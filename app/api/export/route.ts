import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { format } from 'date-fns';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id: string; role?: string };
    if (user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let query = supabase
      .from('requests')
      .select('*, user:users(id, name, email, department)')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (from) {
      query = query.gte('created_at', from);
    }

    if (to) {
      query = query.lte('created_at', to);
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error('Error fetching requests for export:', error);
      return NextResponse.json({ message: 'Failed to fetch data' }, { status: 500 });
    }

    // Build CSV
    const headers = [
      'Request ID',
      'Requester Name',
      'Requester Email',
      'Department',
      'Amount (NGN)',
      'Purpose',
      'Category',
      'Description',
      'Status',
      'Submitted At',
      'Reviewed At',
      'Paid At',
      'Rejection Reason',
    ];

    const rows = (requests || []).map((req) => [
      req.id,
      req.user?.name || '',
      req.user?.email || '',
      req.user?.department || '',
      req.amount?.toString() || '0',
      `"${(req.purpose || '').replace(/"/g, '""')}"`,
      req.category || '',
      `"${(req.description || '').replace(/"/g, '""')}"`,
      req.status || '',
      req.created_at ? format(new Date(req.created_at), 'yyyy-MM-dd HH:mm:ss') : '',
      req.reviewed_at ? format(new Date(req.reviewed_at), 'yyyy-MM-dd HH:mm:ss') : '',
      req.paid_at ? format(new Date(req.paid_at), 'yyyy-MM-dd HH:mm:ss') : '',
      `"${(req.rejection_reason || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const filename = `satgo-requests-${format(new Date(), 'yyyy-MM-dd')}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('GET /api/export error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
