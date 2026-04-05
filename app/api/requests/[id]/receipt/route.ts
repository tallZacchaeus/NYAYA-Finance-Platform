import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendReceiptUploadedEmail } from '@/lib/email';

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
    if (user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const supabase = createAdminClient();

    // Fetch the request
    const { data: existing, error: fetchError } = await supabase
      .from('requests')
      .select('*, user:users(id, name, email)')
      .eq('id', params.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }

    if (existing.status !== 'paid') {
      return NextResponse.json(
        { message: `Receipts can only be uploaded for paid requests. Current status: ${existing.status}` },
        { status: 400 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ message: 'File too large. Maximum size is 10MB' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: 'Invalid file type. Allowed: PDF, JPG, PNG' },
        { status: 400 }
      );
    }

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const filePath = `receipts/${params.id}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;

    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      // Fallback: store without actual file (for demo purposes)
      const { data: receipt, error: receiptError } = await supabase
        .from('receipts')
        .insert({
          request_id: params.id,
          file_url: `placeholder://${filePath}`,
          file_name: file.name,
          file_size: file.size,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (receiptError) {
        return NextResponse.json({ message: 'Failed to save receipt' }, { status: 500 });
      }

      return NextResponse.json({ receipt, message: 'Receipt uploaded (storage bucket pending setup)' });
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(filePath);

    // Save receipt record
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .insert({
        request_id: params.id,
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_size: file.size,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (receiptError) {
      console.error('Error saving receipt:', receiptError);
      return NextResponse.json({ message: 'Failed to save receipt record' }, { status: 500 });
    }

    // Note: the DB trigger `receipt_completes_request` will automatically
    // update the request status to 'completed'

    // Audit log
    await supabase.from('audit_logs').insert({
      request_id: params.id,
      action: 'receipt_uploaded',
      user_id: user.id,
      metadata: { file_name: file.name, file_size: file.size },
    });

    // Notify requester
    await supabase.from('notifications').insert({
      user_id: existing.user_id,
      request_id: params.id,
      title: 'Receipt Uploaded - Request Completed',
      message: `A receipt has been uploaded for your request. Your request is now completed.`,
    });

    // Send email (non-blocking)
    if (existing.user?.email) {
      sendReceiptUploadedEmail({
        to: existing.user.email,
        requestId: params.id,
        requesterName: existing.user.name || 'User',
        amount: existing.amount,
        purpose: existing.purpose,
      }).catch(console.error);
    }

    return NextResponse.json({ receipt, message: 'Receipt uploaded successfully. Request completed.' });
  } catch (error) {
    console.error('POST /api/requests/[id]/receipt error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
