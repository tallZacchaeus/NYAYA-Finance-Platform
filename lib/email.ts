import { Resend } from 'resend';

const FROM = process.env.EMAIL_FROM || 'YAYA Finance <noreply@satgo.org>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  return new Resend(apiKey);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

interface EmailData {
  to: string;
  requestId: string;
  requesterName: string;
  amount: number;
  purpose: string;
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
}

function emailWrapper(accentColor: string, heading: string, body: string, ctaHref: string, ctaLabel: string) {
  return `
    <div style="font-family: Georgia, 'Times New Roman', serif; background: #080E18; margin: 0; padding: 40px 20px;">
      <div style="max-width: 560px; margin: 0 auto; background: #0B1929; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); overflow: hidden;">
        <!-- Header -->
        <div style="padding: 28px 32px 24px; border-bottom: 1px solid rgba(255,255,255,0.06);">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #D4A843, #B8860B); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px; color: #080E18; line-height: 1;">Y</div>
            <div>
              <div style="font-size: 15px; font-weight: 600; color: #F0F2F5; letter-spacing: -0.01em;">YAYA Finance</div>
              <div style="font-size: 11px; color: rgba(212,168,67,0.7); font-family: Arial, sans-serif;">RCCG YAYA Finance Portal</div>
            </div>
          </div>
        </div>
        <!-- Body -->
        <div style="padding: 28px 32px;">
          <h2 style="margin: 0 0 16px; font-size: 20px; color: ${accentColor}; font-weight: 600; letter-spacing: -0.01em;">${heading}</h2>
          ${body}
          <div style="margin-top: 28px;">
            <a href="${ctaHref}" style="display: inline-block; background: linear-gradient(135deg, #D4A843, #B8860B); color: #080E18; padding: 11px 24px; text-decoration: none; border-radius: 8px; font-family: Arial, sans-serif; font-size: 14px; font-weight: 600;">${ctaLabel}</a>
          </div>
        </div>
        <!-- Footer -->
        <div style="padding: 16px 32px; border-top: 1px solid rgba(255,255,255,0.06);">
          <p style="margin: 0; font-family: Arial, sans-serif; font-size: 12px; color: rgba(240,242,245,0.3);">RCCG YAYA Finance Platform &mdash; This is an automated message, please do not reply.</p>
        </div>
      </div>
    </div>
  `;
}

function tableRow(label: string, value: string) {
  return `<tr>
    <td style="padding: 9px 0; font-family: Arial, sans-serif; font-size: 13px; color: rgba(240,242,245,0.45); border-bottom: 1px solid rgba(255,255,255,0.05); width: 40%;">${label}</td>
    <td style="padding: 9px 0; font-family: Arial, sans-serif; font-size: 13px; color: rgba(240,242,245,0.85); border-bottom: 1px solid rgba(255,255,255,0.05);">${value}</td>
  </tr>`;
}

export async function sendRequestSubmittedEmail(data: EmailData) {
  const resend = getResendClient();

  const body = `
    <p style="font-family: Arial, sans-serif; font-size: 14px; color: rgba(240,242,245,0.7); margin: 0 0 20px;">Dear ${escapeHtml(data.requesterName)},</p>
    <p style="font-family: Arial, sans-serif; font-size: 14px; color: rgba(240,242,245,0.7); margin: 0 0 20px;">Your financial request has been submitted successfully and is pending review.</p>
    <table style="border-collapse: collapse; width: 100%; margin: 0 0 8px;">
      ${tableRow('Amount', formatAmount(data.amount))}
      ${tableRow('Purpose', escapeHtml(data.purpose))}
      ${tableRow('Status', 'Pending Review')}
    </table>
  `;

  await resend.emails.send({
    from: FROM,
    to: data.to,
    subject: 'Financial Request Submitted - YAYA Finance',
    html: emailWrapper('#D4A843', 'Request Submitted', body, `${APP_URL}/my-requests`, 'View Request'),
  });
}

export async function sendRequestApprovedEmail(data: EmailData) {
  const resend = getResendClient();

  const body = `
    <p style="font-family: Arial, sans-serif; font-size: 14px; color: rgba(240,242,245,0.7); margin: 0 0 20px;">Dear ${escapeHtml(data.requesterName)},</p>
    <p style="font-family: Arial, sans-serif; font-size: 14px; color: rgba(240,242,245,0.7); margin: 0 0 20px;">Your financial request has been <strong style="color: #34D399;">approved</strong>. Payment will be processed shortly.</p>
    <table style="border-collapse: collapse; width: 100%; margin: 0 0 8px;">
      ${tableRow('Amount', formatAmount(data.amount))}
      ${tableRow('Purpose', escapeHtml(data.purpose))}
      ${tableRow('Status', 'Approved')}
    </table>
  `;

  await resend.emails.send({
    from: FROM,
    to: data.to,
    subject: 'Financial Request Approved - YAYA Finance',
    html: emailWrapper('#34D399', 'Request Approved', body, `${APP_URL}/my-requests`, 'View Request'),
  });
}

export async function sendRequestRejectedEmail(data: EmailData & { reason?: string }) {
  const resend = getResendClient();

  const body = `
    <p style="font-family: Arial, sans-serif; font-size: 14px; color: rgba(240,242,245,0.7); margin: 0 0 20px;">Dear ${escapeHtml(data.requesterName)},</p>
    <p style="font-family: Arial, sans-serif; font-size: 14px; color: rgba(240,242,245,0.7); margin: 0 0 20px;">Unfortunately, your financial request has been <strong style="color: #F87171;">rejected</strong>.</p>
    ${data.reason ? `<div style="background: rgba(248,113,113,0.06); border: 1px solid rgba(248,113,113,0.2); border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;"><p style="font-family: Arial, sans-serif; font-size: 13px; color: rgba(240,242,245,0.7); margin: 0;"><strong style="color: #F87171;">Reason:</strong> ${escapeHtml(data.reason)}</p></div>` : ''}
    <table style="border-collapse: collapse; width: 100%; margin: 0 0 8px;">
      ${tableRow('Amount', formatAmount(data.amount))}
      ${tableRow('Purpose', escapeHtml(data.purpose))}
      ${tableRow('Status', 'Rejected')}
    </table>
    <p style="font-family: Arial, sans-serif; font-size: 13px; color: rgba(240,242,245,0.45); margin: 16px 0 0;">You may submit a revised request after addressing the concerns raised.</p>
  `;

  await resend.emails.send({
    from: FROM,
    to: data.to,
    subject: 'Financial Request Rejected - YAYA Finance',
    html: emailWrapper('#F87171', 'Request Rejected', body, `${APP_URL}/my-requests`, 'Go to Dashboard'),
  });
}

export async function sendReceiptUploadedEmail(data: EmailData) {
  const resend = getResendClient();

  const body = `
    <p style="font-family: Arial, sans-serif; font-size: 14px; color: rgba(240,242,245,0.7); margin: 0 0 20px;">Dear ${escapeHtml(data.requesterName)},</p>
    <p style="font-family: Arial, sans-serif; font-size: 14px; color: rgba(240,242,245,0.7); margin: 0 0 20px;">A receipt has been uploaded for your financial request. Your request is now <strong style="color: #A78BFA;">completed</strong>.</p>
    <table style="border-collapse: collapse; width: 100%; margin: 0 0 8px;">
      ${tableRow('Amount', formatAmount(data.amount))}
      ${tableRow('Purpose', escapeHtml(data.purpose))}
      ${tableRow('Status', 'Completed')}
    </table>
  `;

  await resend.emails.send({
    from: FROM,
    to: data.to,
    subject: 'Receipt Uploaded — Request Completed - YAYA Finance',
    html: emailWrapper('#A78BFA', 'Request Completed', body, `${APP_URL}/my-requests`, 'View Request'),
  });
}

export async function sendAdminNotificationEmail(to: string, subject: string, body: string) {
  const resend = getResendClient();

  await resend.emails.send({
    from: FROM,
    to,
    subject: `${subject} - YAYA Finance`,
    html: emailWrapper('#D4A843', subject, `<div style="font-family: Arial, sans-serif; font-size: 14px; color: rgba(240,242,245,0.7);">${body}</div>`, `${APP_URL}/admin`, 'Open Portal'),
  });
}
