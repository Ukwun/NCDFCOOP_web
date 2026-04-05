/**
 * Order Confirmation Email Handler
 */

import { NextRequest, NextResponse } from 'next/server';

interface OrderConfirmationPayload {
  email: string;
  orderDetails: {
    orderId: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    total: number;
    shippingAddress: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { email, orderDetails } = (await request.json()) as OrderConfirmationPayload;

    if (!email || !orderDetails) {
      return NextResponse.json(
        { error: 'Missing email or order details' },
        { status: 400 }
      );
    }

    const itemsHtml = orderDetails.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₦${item.price.toLocaleString()}</td>
        </tr>
      `
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2c7d3f; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .order-id { background-color: #f0f0f0; padding: 10px; border-radius: 5px; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .total-row { background-color: #f9f9f9; font-weight: bold; }
            .footer { font-size: 12px; color: #999; padding: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Order Confirmation</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Thank you for your order! Your order has been received and is being processed.</p>
              
              <div class="order-id">
                <strong>Order ID:</strong> ${orderDetails.orderId}
              </div>

              <h3>Order Items</h3>
              <table>
                <thead style="background-color: #f0f0f0;">
                  <tr>
                    <th style="padding: 10px; text-align: left;">Product</th>
                    <th style="padding: 10px; text-align: center;">Quantity</th>
                    <th style="padding: 10px; text-align: right;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                  <tr class="total-row">
                    <td colspan="2" style="padding: 10px; text-align: right;">Total:</td>
                    <td style="padding: 10px; text-align: right;">₦${orderDetails.total.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              <h3>Shipping Address</h3>
              <p style="background-color: #f9f9f9; padding: 10px; border-radius: 5px;">
                ${orderDetails.shippingAddress}
              </p>

              <h3>What's Next?</h3>
              <ul>
                <li>Your order is being packed and prepared for shipment</li>
                <li>You'll receive a shipping notification within 24 hours</li>
                <li>Track your order using the link in your notification</li>
              </ul>

              <p>If you have any questions about your order, please contact our customer support team.</p>
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
Order Confirmation

Thank you for your order!

Order ID: ${orderDetails.orderId}

Items:
${orderDetails.items.map((item) => `- ${item.name} (Qty: ${item.quantity}) - ₦${item.price}`).join('\n')}

Total: ₦${orderDetails.total.toLocaleString()}

Shipping Address:
${orderDetails.shippingAddress}

What's Next?
- Your order is being packed and prepared for shipment
- You'll receive a shipping notification within 24 hours
- Track your order using the link in your notification

If you have questions, contact our customer support.
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
          subject: `✅ Order Confirmation #${orderDetails.orderId} - NCDF COOP`,
          html,
          text,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to send order confirmation');
    }

    return NextResponse.json(
      { message: 'Order confirmation email sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return NextResponse.json(
      { error: 'Failed to send order confirmation email' },
      { status: 500 }
    );
  }
}
