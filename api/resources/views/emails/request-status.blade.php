<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NYAYA Finance – Request Update</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; color: #333; }
        .wrapper { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
        .header { background: #1a1a2e; padding: 24px 32px; }
        .header h1 { color: #fff; margin: 0; font-size: 20px; letter-spacing: .5px; }
        .header span { color: #a0aec0; font-size: 13px; }
        .body { padding: 32px; }
        .status-badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; }
        .status-pending     { background: #fef3c7; color: #92400e; }
        .status-recommended { background: #dbeafe; color: #1e40af; }
        .status-approved    { background: #d1fae5; color: #065f46; }
        .status-rejected    { background: #fee2e2; color: #991b1b; }
        .status-paid        { background: #ede9fe; color: #5b21b6; }
        .status-completed   { background: #ecfdf5; color: #047857; }
        .detail-table { width: 100%; border-collapse: collapse; margin: 24px 0; }
        .detail-table td { padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
        .detail-table td:first-child { color: #6b7280; width: 140px; }
        .detail-table td:last-child { font-weight: 500; }
        .cta { display: block; margin: 28px 0; text-align: center; }
        .cta a { background: #1a1a2e; color: #fff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-size: 15px; font-weight: 600; }
        .footer { padding: 20px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
    </style>
</head>
<body>
<div class="wrapper">
    <div class="header">
        <h1>NYAYA Finance Platform</h1>
        <span>Financial Request Management</span>
    </div>

    <div class="body">
        <p>Hello {{ $notifiable->name }},</p>

        @php
            $status = $financeRequest->status;
            $statusLabels = [
                'pending'     => 'Submitted & Pending Review',
                'recommended' => 'Recommended by Team Lead',
                'approved'    => 'Approved for Payment',
                'rejected'    => 'Rejected',
                'paid'        => 'Payment Processed',
                'completed'   => 'Completed',
            ];
            $statusMessages = [
                'pending'     => 'A new finance request has been submitted and is awaiting review.',
                'recommended' => 'This request has been recommended by the team lead and is awaiting finance admin approval.',
                'approved'    => 'Great news — this finance request has been approved for payment.',
                'rejected'    => 'Unfortunately, this finance request has been rejected.',
                'paid'        => 'Payment has been processed for this request.',
                'completed'   => 'This finance request has been completed and a receipt has been uploaded.',
            ];
        @endphp

        <p>{{ $statusMessages[$status] ?? 'The status of a finance request has been updated.' }}</p>

        <span class="status-badge status-{{ $status }}">{{ $statusLabels[$status] ?? $status }}</span>

        <table class="detail-table">
            <tr>
                <td>Reference</td>
                <td>{{ $financeRequest->reference }}</td>
            </tr>
            <tr>
                <td>Title</td>
                <td>{{ $financeRequest->title }}</td>
            </tr>
            <tr>
                <td>Amount</td>
                <td>₦{{ number_format($financeRequest->amount_kobo / 100, 2) }}</td>
            </tr>
            <tr>
                <td>Department</td>
                <td>{{ $financeRequest->department?->name ?? '—' }}</td>
            </tr>
            <tr>
                <td>Event</td>
                <td>{{ $financeRequest->event?->name ?? '—' }}</td>
            </tr>
            <tr>
                <td>Action by</td>
                <td>{{ $actor->name }}</td>
            </tr>
            @if ($status === 'rejected' && $financeRequest->rejection_reason)
            <tr>
                <td>Reason</td>
                <td style="color:#991b1b;">{{ $financeRequest->rejection_reason }}</td>
            </tr>
            @endif
            <tr>
                <td>Updated at</td>
                <td>{{ now()->format('D, d M Y H:i') }} WAT</td>
            </tr>
        </table>

        <div class="cta">
            <a href="{{ env('FRONTEND_URL') }}/requests/{{ $financeRequest->id }}">View Request</a>
        </div>

        <p style="font-size:13px;color:#6b7280;">
            If you were not expecting this email or believe it was sent in error, please contact your finance administrator.
        </p>
    </div>

    <div class="footer">
        &copy; {{ date('Y') }} NYAYA Youth Affairs · RCCG Finance Platform<br>
        This is an automated notification — please do not reply to this email.
    </div>
</div>
</body>
</html>
