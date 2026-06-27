import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { createRateLimiter } from '@/lib/middleware/rateLimiting';
import { sendTransactionalEmail } from '@/lib/server/emailSender';

interface PasswordResetPayload {
  email: string;
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getAppUrl(request: NextRequest): string {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.URL ||
    request.nextUrl.origin;

  return configuredUrl.replace(/\/$/, '');
}

const resetRateLimiter = createRateLimiter(
  (input: { identifier: string }) => input.identifier,
  'email'
);

export async function POST(request: NextRequest) {
  try {
    const { email: rawEmail } = (await request.json()) as PasswordResetPayload;
    const email = String(rawEmail || '').trim().toLowerCase();

    if (!email || !isEmail(email)) {
      return NextResponse.json(
        { error: 'Enter a valid email address.' },
        { status: 400 }
      );
    }

    const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const clientIp = forwardedFor || request.headers.get('x-real-ip') || 'unknown';
    await resetRateLimiter({ identifier: `${clientIp}:${email}` });

    let resetLink = '';
    try {
      resetLink = await getAdminAuth().generatePasswordResetLink(email, {
        url: `${getAppUrl(request)}/signin`,
        handleCodeInApp: false,
      });
    } catch (error: any) {
      if (error?.code === 'auth/user-not-found') {
        return NextResponse.json(
          { message: 'If an account exists with this email, a reset link will be sent shortly.' },
          { status: 200 }
        );
      }

      console.error('Error generating password reset link:', error);
      return NextResponse.json(
        { error: 'Password reset is not configured correctly. Please contact support.' },
        { status: 500 }
      );
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charSet="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; color: #253025; background: #f6f8f6; margin: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 24px; }
            .header { background-color: #164A2E; color: white; padding: 24px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 28px; border: 1px solid #e5eee5; border-top: 0; border-radius: 0 0 10px 10px; }
            .button { background-color: #164A2E; color: white; padding: 13px 26px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 18px 0; font-weight: 700; }
            .note { color: #667066; font-size: 13px; line-height: 1.5; }
            .footer { font-size: 12px; color: #7a837a; padding: 20px 0; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>We received a request to reset your NCDF COOP password. Use the secure button below to create a new password.</p>
              <a href="${resetLink}" class="button">Reset Your Password</a>
              <p class="note">This link expires automatically. If the button does not work, copy and paste this link into your browser:</p>
              <p class="note">${resetLink}</p>
              <p class="note">If you did not request this, you can ignore this email. Your password will remain unchanged.</p>
            </div>
            <div class="footer">
              <p>&copy; 2026 NCDF COOP. All rights reserved.</p>
              <p>This is an automated security email. Do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Password Reset Request

We received a request to reset your NCDF COOP password.

Reset your password here:
${resetLink}

If you did not request this, you can ignore this email.
    `.trim();

    await sendTransactionalEmail({
      to: email,
      subject: 'Password Reset Request - NCDF COOP',
      html,
      text,
    });

    return NextResponse.json(
      { message: 'If an account exists with this email, a reset link will be sent shortly.' },
      { status: 200 }
    );
  } catch (error: any) {
    if (error?.status === 429) {
      return NextResponse.json(
        { error: 'Too many reset requests. Please wait a minute and try again.' },
        { status: 429, headers: error.headers }
      );
    }

    console.error('Error sending password reset email:', error);
    return NextResponse.json(
      { error: 'Failed to send password reset email. Please try again later.' },
      { status: 500 }
    );
  }
}
