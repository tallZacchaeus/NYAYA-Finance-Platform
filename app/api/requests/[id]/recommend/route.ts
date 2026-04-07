import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { auth } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { serializeDoc } from '@/lib/firestore';
import { formatCurrency } from '@/lib/utils';
import { z } from 'zod';

const recommendSchema = z.object({
  action: z.enum(['recommended', 'not_recommended']),
  comment: z
    .string()
    .min(10, 'Please provide a comment of at least 10 characters')
    .max(1000),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id: string; role?: string };
    if (user.role !== 'finance') {
      return NextResponse.json(
        { message: 'Forbidden - Finance access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = recommendSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: validated.error.flatten() },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const reqDoc = await db.collection('requests').doc(params.id).get();

    if (!reqDoc.exists) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }

    const existing = reqDoc.data()!;

    if (existing.status !== 'pending') {
      return NextResponse.json(
        { message: `Cannot recommend a request with status: ${existing.status}` },
        { status: 400 }
      );
    }

    const now = FieldValue.serverTimestamp();
    const { action, comment } = validated.data;

    await db.collection('requests').doc(params.id).update({
      status: action,
      recommendation_status: action,
      recommendation_comment: comment,
      recommended_by: user.id,
      recommended_at: now,
      updated_at: now,
    });

    const updatedDoc = await db.collection('requests').doc(params.id).get();
    const updated = serializeDoc(updatedDoc.id, updatedDoc.data()!);

    // Audit log
    await db.collection('audit_logs').add({
      request_id: params.id,
      action: `request_${action}`,
      user_id: user.id,
      metadata: { comment, previous_status: 'pending' },
      timestamp: now,
    });

    // Notify all admins
    const adminsSnap = await db.collection('users').where('role', '==', 'admin').get();
    const label = action === 'recommended' ? 'Recommended for Approval' : 'Not Recommended';
    await Promise.all(
      adminsSnap.docs.map((adminDoc) =>
        db.collection('notifications').add({
          user_id: adminDoc.id,
          request_id: params.id,
          title: `Finance: ${label}`,
          message: `A request for ${formatCurrency(existing.amount as number)} has been ${action === 'recommended' ? 'recommended for approval' : 'not recommended'} by finance.`,
          read: false,
          created_at: now,
        })
      )
    );

    return NextResponse.json({
      request: updated,
      message: `Request ${action === 'recommended' ? 'recommended for approval' : 'not recommended'} successfully`,
    });
  } catch (error) {
    console.error('POST /api/requests/[id]/recommend error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
