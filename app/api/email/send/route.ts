import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter } from '@/lib/middleware/rateLimiting';
import { sendTransactionalEmail } from '@/lib/server/emailSender';
import { isInternalOrTrustedRequest } from '@/lib/server/requestAuth';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const emailRateLimiter = createRateLimiter(
  (input: { identifier: string }) => input.identifier,
  'email'
);

export async function POST(request: NextRequest) {
  try {
    if (!(await isInternalOrTrustedRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { to, subject, html, text } = (await request.json()) as EmailPayload;
    const recipient = String(to || '').trim().toLowerCase();

    if (!recipient || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const limitResult = await emailRateLimiter({ identifier: recipient });
    await sendTransactionalEmail({
      to: recipient,
      subject,
      html,
      text: text || undefined,
    });

    return NextResponse.json(
      { message: 'Email sent successfully' },
      { status: 200, headers: limitResult.headers }
    );
  } catch (error: any) {
    if (error?.status === 429) {
      return NextResponse.json(
        { error: 'Too many emails. Please try again shortly.' },
        { status: 429, headers: error.headers }
      );
    }

    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
