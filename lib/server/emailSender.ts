import sgMail from '@sendgrid/mail';

export interface TransactionalEmail {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

interface ResendResponse {
  id?: string;
  message?: string;
  name?: string;
}

let configuredApiKey: string | null = null;

function configureSendGrid(): void {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    throw new Error('Email provider is not configured');
  }

  if (configuredApiKey !== apiKey) {
    sgMail.setApiKey(apiKey);
    configuredApiKey = apiKey;
  }
}

async function sendWithResend(message: TransactionalEmail): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('Email provider is not configured');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from:
        process.env.RESEND_FROM_EMAIL ||
        process.env.EMAIL_FROM ||
        'CoopX <onboarding@resend.dev>',
      to: [message.to],
      subject: message.subject,
      html: message.html,
      ...(message.text ? { text: message.text } : {}),
      ...(message.replyTo ? { reply_to: message.replyTo } : {}),
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as ResendResponse;
  if (!response.ok || !payload.id) {
    throw new Error(payload.message || payload.name || 'RESEND_DELIVERY_FAILED');
  }
}

export async function sendTransactionalEmail(
  message: TransactionalEmail
): Promise<void> {
  if (process.env.RESEND_API_KEY) {
    await sendWithResend(message);
    return;
  }

  configureSendGrid();

  await sgMail.send({
    ...message,
    from:
      process.env.SENDGRID_FROM_EMAIL ||
      process.env.EMAIL_FROM ||
      'noreply@ncdfcoop.com',
  });
}
