import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { UserRole } from '@/lib/types';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = session.user as { id: string; role?: string };
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden - Admin access required' }, { status: 403 });
    }

    if (currentUser.id === params.id) {
      return NextResponse.json(
        { message: 'You cannot change your own role' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { role } = body as { role: UserRole };

    if (role !== 'admin' && role !== 'finance' && role !== 'requester') {
      return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
    }

    const db = getAdminDb();
    const userRef = db.collection('users').doc(params.id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    await userRef.update({ role, updated_at: FieldValue.serverTimestamp() });

    return NextResponse.json({ message: 'Role updated successfully', role });
  } catch (error) {
    console.error('PATCH /api/users/[id]/role error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
