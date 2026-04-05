/**
 * Deposit Confirmation Email Handler
 */

import { NextRequest, NextResponse } from 'next/server';

interface DepositConfirmationPayload {
  email: string;
  depositDetails: {
    amount: number;
    reference: string;
    timestamp: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { email, depositDetails } = (await request.json()) as DepositConfirmationPayload;

    if (!email || !depositDetails) {
      return NextResponse.json(
        { error: 'Missing email or deposit details' },
        { status: 400 }
      );
    }

    const date = new Date(depositDetails.timestamp).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2c7d3f; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .amount-box {
              background-color: #f0f0f0;
              padding: 20px;
              border-radius: 5px;
              text-align: center;
              margin: 20px 0;
            }
            .amount { font-size: 32px; font-weight: bold; color: #2c7d3f; }
            .reference { background-color: #f9f9f9; padding: 10px; border-radius: 5px; word-break: break-all; }
            .footer { font-size: 12px; color: #999; padding: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💰 Deposit Confirmed</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Your deposit to NCDF COOP has been successfully received and credited to your account.</p>
              
              <div class="amount-box">
                <p style="margin: 0; color: #666;">Amount Deposited</p>
                <div class="amount">₦${depositDetails.amount.toLocaleString()}</div>
              </div>

              <h3>Transaction Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 10px; font-weight: bold;">Reference:</td>
                  <td style="padding: 10px;">${depositDetails.reference}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 10px; font-weight: bold;">Date & Time:</td>
                  <td style="padding: 10px;">${date}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: bold;">Status:</td>
                  <td style="padding: 10px; color: #2c7d3f; font-weight: bold;">✅ Completed</td>
                </tr>
              </table>

              <h3>What Happens Next?</h3>
              <ul>
                <li>Your new savings balance is updated immediately</li>
                <li>You'll continue to earn interest on your savings</li>
                <li>Monitor your account in the "My NCDF COOP" section</li>
              </ul>

              <p>Thank you for being an active NCDF COOP member!</p>
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
Deposit Confirmed

Hello,

Your deposit to NCDF COOP has been successfully received.

Amount Deposited: ₦${depositDetails.amount.toLocaleString()}

Transaction Details:
Reference: ${depositDetails.reference}
Date & Time: ${date}
Status: ✅ Completed

What Happens Next?
- Your new savings balance is updated immediately
- You continue to earn interest on your savings
- Monitor your account in the "My NCDF COOP" section

Thank you for being an active NCDF COOP member!
    `.trim();

    // Call the main email sending endpoint
    const response = await fetch(
      new URL('/api/email/send', request.nextUrl.origin),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: `💰 Deposit Confirmation - NCDF COOP`,
          html,
          text,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to send deposit confirmation');
    }

    return NextResponse.json(
      { message: 'Deposit confirmation email sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending deposit confirmation email:', error);
    return NextResponse.json(
      { error: 'Failed to send deposit confirmation email' },
      { status: 500 }
    );
  }
}
