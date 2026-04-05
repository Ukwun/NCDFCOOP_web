/**
 * Email API Route - Generic Email Sending with Rate Limiting
 * 
 * This is a template for sending emails via SendGrid, Mailgun, or similar services.
 * Includes 🔒 RATE LIMITING to prevent abuse (5 emails per minute)
 * 
 * To use this, install your preferred email service SDK:
 * - SendGrid: npm install @sendgrid/mail
 * - Mailgun: npm install mailgun.js
 * 
 * Then update the implementation below with your chosen service.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter, getRateLimitStatus } from '@/lib/middleware/rateLimiting';

// Example using SendGrid (uncomment and configure if using SendGrid)
// import sgMail from '@sendgrid/mail';
// if (process.env.SENDGRID_API_KEY) {
//   sgMail.setApiKey(process.env.SENDGRID_API_KEY);
// }

// Example using Mailgun (uncomment and configure if using Mailgun)
// import FormData from 'form-data';
// import Mailgun from 'mailgun.js';
// const mailgun = new Mailgun(FormData);
// const mg = mailgun.client({
//   username: 'api',
//   key: process.env.MAILGUN_API_KEY || '',
// });

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Create rate limiter: 5 emails per minute per email address
const emailRateLimiter = createRateLimiter(
  (req: any) => req.body?.to || req.headers.get('x-forwarded-for') || 'unknown',
  'email'
);

export async function POST(request: NextRequest) {
  try {
    // 🔒 APPLY RATE LIMITING (5 emails per minute)
    const limitResult = await emailRateLimiter(request);

    const { to, subject, html } = (await request.json()) as EmailPayload;

    // Validate inputs
    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        {
          status: 400,
          headers: limitResult.headers,
        }
      );
    }

    // Check rate limit status for response info
    const rateLimitStatus = getRateLimitStatus(to, 'email');

    // Implement with your chosen email service
    // Example with SendGrid:
    /*
    await sgMail.send({
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@ncdfcoop.com',
      subject,
      html,
      text: text || '',
    });
    */

    // Example with Mailgun:
    /*
    await mg.messages.create(process.env.MAILGUN_DOMAIN || 'mail.ncdfcoop.com', {
      from: 'NCDF COOP <noreply@ncdfcoop.com>',
      to,
      subject,
      html,
      text: text || '',
    });
    */

    // Placeholder: Log email for development
    console.log(`📧 Email sent to ${to}:`, { subject, html: html.substring(0, 100) });

    return NextResponse.json(
      {
        message: 'Email sent successfully',
        to,
        rateLimitRemaining: rateLimitStatus.remaining,
      },
      {
        status: 200,
        headers: limitResult.headers, // 🔒 Include rate limit info in response
      }
    );
  } catch (error: any) {
    // 🔒 Handle rate limit error specifically
    if (error?.status === 429) {
      return NextResponse.json(
        {
          error: 'Too many emails. Maximum 5 per minute. Please try again in a moment.',
        },
        {
          status: 429,
          headers: error.headers,
        }
      );
    }

    // Log other errors
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
