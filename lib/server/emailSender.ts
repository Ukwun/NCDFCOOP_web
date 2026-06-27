import sgMail from '@sendgrid/mail';

export interface TransactionalEmail {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
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

export async function sendTransactionalEmail(
  message: TransactionalEmail
): Promise<void> {
  configureSendGrid();

  await sgMail.send({
    ...message,
    from:
      process.env.SENDGRID_FROM_EMAIL ||
      process.env.EMAIL_FROM ||
      'noreply@ncdfcoop.com',
  });
}
