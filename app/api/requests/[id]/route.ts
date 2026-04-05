import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const updateRequestSchema = z.object({
  amount: z.number().positive().optional(),
  purpose: z.string().min(5).max(200).optional(),
  category: z.enum(['travel', 'supplies', 'events', 'utilities', 'personnel', 'other']).optional(),
  description: z.string().max(1000).optional().nullable(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id: string; role?: string };
    const supabase = createAdminClient();

    const { data: req, error } = await supabase
      .from('requests')
      .select(`
        *,
        user:users(id, name, email, department),
        documents:request_documents(*),
        receipt:receipts(*)
      `)
      .eq('id', params.id)
      .single();

    if (error || !req) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }

    // Non-admins can only see their own requests
    if (user.role !== 'admin' && req.user_id !== user.id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ request: req });
  } catch (error) {
    console.error('GET /api/requests/[id] error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id: string; role?: string };
    const supabase = createAdminClient();

    // Fetch existing request
    const { data: existing, error: fetchError } = await supabase
      .from('requests')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }

    // Requesters can only update their own pending requests
    if (user.role !== 'admin') {
      if (existing.user_id !== user.id) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }
      if (existing.status !== 'pending') {
        return NextResponse.json(
          { message: 'Only pending requests can be edited' },
          { status: 400 }
        );
      }
    }

    const body = await request.json();
    const validated = updateRequestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { data: updated, error } = await supabase
      .from('requests')
      .update(validated.data)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ message: 'Failed to update request' }, { status: 500 });
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      request_id: params.id,
      action: 'request_updated',
      user_id: user.id,
      metadata: validated.data,
    });

    return NextResponse.json({ request: updated });
  } catch (error) {
    console.error('PATCH /api/requests/[id] error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id: string; role?: string };
    const supabase = createAdminClient();

    const { data: existing, error: fetchError } = await supabase
      .from('requests')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }

    // Only requesters can delete their own pending requests; admins can delete any
    if (user.role !== 'admin') {
      if (existing.user_id !== user.id || existing.status !== 'pending') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }
    }

    const { error } = await supabase.from('requests').delete().eq('id', params.id);

    if (error) {
      return NextResponse.json({ message: 'Failed to delete request' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/requests/[id] error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
