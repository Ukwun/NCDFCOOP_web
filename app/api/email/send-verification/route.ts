/**
 * Email Verification Handler
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestUser } from '@/lib/server/requestAuth';
import { sendTransactionalEmail } from '@/lib/server/emailSender';

interface VerificationPayload {
  email: string;
  verificationLink: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRequestUser(request);
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, verificationLink } = (await request.json()) as VerificationPayload;

    if (!email || !verificationLink) {
      return NextResponse.json(
        { error: 'Missing email or verification link' },
        { status: 400 }
      );
    }

    if (email.trim().toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2c7d3f; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .button {
              background-color: #2c7d3f;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              display: inline-block;
              margin: 20px 0;
            }
            .footer { font-size: 12px; color: #999; padding: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✉️ Verify Your Email Address</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Thanks for signing up for NCDF COOP! Click the button below to verify your email address:</p>
              <a href="${verificationLink}" class="button">Verify Email Address</a>
              <p>This link will expire in 48 hours.</p>
              <p>If you didn't create this account, you can safely ignore this email.</p>
              <hr />
              <p><strong>What's Next?</strong></p>
              <ul>
                <li>Verify your email to activate your account</li>
                <li>Complete your member profile</li>
                <li>Start shopping and earning loyalty points!</li>
              </ul>
            </div>
            <div class="footer">
              <p>&copy; 2026 NCDF COOP. All rights reserved.</p>
              <p>These are automated messages. Do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Verify Your Email Address

Thanks for signing up for NCDF COOP! 
Click the link below to verify your email address:

${verificationLink}

This link will expire in 48 hours.

If you didn't create this account, ignore this email.

What's Next?
- Verify your email to activate your account
- Complete your member profile
- Start shopping and earning loyalty points!
    `.trim();

    await sendTransactionalEmail({
      to: user.email,
      subject: 'Verify Your Email Address - NCDF COOP',
      html,
      text,
    });

    return NextResponse.json(
      { message: 'Verification email sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending verification email:', error);
    return NextResponse.json(
      { error: 'Failed to send verification email' },
      { status: 500 }
    );
  }
}
