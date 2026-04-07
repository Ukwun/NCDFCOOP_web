/**
 * Invoice Generation Service
 * Generates and manages PDF invoices for orders
 */

import { Order } from '@/lib/types/product';

export interface Invoice {
  invoiceNumber: string;
  orderId: string;
  date: Date;
  dueDate?: Date;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  billingAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  notes?: string;
  termsAndConditions?: string;
}

export interface InvoiceItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
  total: number;
}

/**
 * Generate invoice data from order
 */
export function generateInvoiceData(
  order: Order,
  customerName: string,
  customerEmail: string,
  customerPhone: string
): Invoice {
  const invoiceNumber = `INV-${order.id.replace('ORD-', '')}`;

  // Calculate totals
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = 500; // Default shipping - can be made dynamic
  const tax = subtotal * 0.075; // 7.5% VAT (Nigeria)
  const discount = 0; // Can be applied from coupons
  const total = subtotal + shippingCost + tax - discount;

  const invoice: Invoice = {
    invoiceNumber,
    orderId: order.id,
    date: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress: order.shippingAddress,
    billingAddress: order.shippingAddress,
    items: order.items.map((item) => ({
      productId: item.productId,
      name: item.productName,
      quantity: item.quantity,
      unitPrice: item.price,
      total: item.price * item.quantity,
    })),
    subtotal,
    shippingCost,
    tax,
    discount,
    total,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    notes: 'Thank you for your purchase! Your items will be delivered within 5-7 business days.',
    termsAndConditions:
      'This invoice is a billing statement for the above transaction. Items are subject to availability. For returns and exchanges, contact support within 14 days of delivery.',
  };

  return invoice;
}

/**
 * Generate HTML invoice for printing/email
 */
export function generateHTMLInvoice(invoice: Invoice): string {
  const itemsHTML = invoice.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₦${item.unitPrice.toLocaleString()}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₦${item.total.toLocaleString()}</td>
    </tr>
  `
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 20px;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background-color: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      border-bottom: 2px solid #007bff;
      padding-bottom: 20px;
    }
    .company-info h1 {
      margin: 0;
      color: #007bff;
      font-size: 28px;
    }
    .company-info p {
      margin: 5px 0;
      color: #666;
      font-size: 14px;
    }
    .invoice-info {
      text-align: right;
    }
    .invoice-info p {
      margin: 5px 0;
      font-size: 14px;
    }
    .invoice-number {
      font-size: 18px;
      font-weight: bold;
      color: #333;
    }
    .invoice-date {
      color: #666;
    }
    .addresses {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 30px;
    }
    .address-block h3 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .address-block p {
      margin: 5px 0;
      color: #666;
      font-size: 14px;
    }
    table {
      width: 100%;
      margin-bottom: 30px;
      border-collapse: collapse;
    }
    th {
      background-color: #f8f9fa;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #333;
      border-bottom: 2px solid #dee2e6;
    }
    .summary {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 30px;
    }
    .summary-table {
      width: 300px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .summary-row.subtotal { color: #666; }
    .summary-row.shipping { color: #666; }
    .summary-row.tax { color: #666; }
    .summary-row.discount { color: #28a745; }
    .summary-row.total {
      font-size: 18px;
      font-weight: bold;
      color: #333;
      background-color: #f8f9fa;
      padding: 12px 0;
      border: none;
      border-top: 2px solid #007bff;
    }
    .footer {
      border-top: 1px solid #eee;
      padding-top: 20px;
      margin-top: 20px;
      font-size: 12px;
      color: #666;
    }
    .payment-status {
      background-color: #d4edda;
      color: #155724;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 20px;
      text-align: center;
    }
    @media print {
      body { background-color: white; padding: 0; }
      .invoice-container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="company-info">
        <h1>🛒 NCDFCOOP</h1>
        <p>Commerce Platform</p>
        <p>Email: support@ncdfcoop.com</p>
        <p>Phone: +234-xxx-xxx-xxxx</p>
      </div>
      <div class="invoice-info">
        <div class="invoice-number">${invoice.invoiceNumber}</div>
        <p class="invoice-date">${invoice.date.toLocaleDateString('en-NG', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}</p>
        <p style="margin-top: 15px;">Order ID: ${invoice.orderId}</p>
      </div>
    </div>

    <div class="payment-status">
      Payment Status: <strong>${invoice.paymentStatus === 'pending' ? '⏳ Pending' : '✅ Completed'}</strong>
    </div>

    <div class="addresses">
      <div class="address-block">
        <h3>Bill To</h3>
        <p><strong>${invoice.customerName}</strong></p>
        <p>${invoice.customerEmail}</p>
        <p>${invoice.customerPhone}</p>
        <p style="margin-top: 10px; color: #333;">${invoice.billingAddress}</p>
      </div>
      <div class="address-block">
        <h3>Ship To</h3>
        <p><strong>${invoice.customerName}</strong></p>
        <p>${invoice.shippingAddress}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th style="text-align: center;">Quantity</th>
          <th style="text-align: right;">Unit Price</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
      </tbody>
    </table>

    <div class="summary">
      <div class="summary-table">
        <div class="summary-row subtotal">
          <span>Subtotal:</span>
          <span>₦${invoice.subtotal.toLocaleString()}</span>
        </div>
        <div class="summary-row shipping">
          <span>Shipping:</span>
          <span>₦${invoice.shippingCost.toLocaleString()}</span>
        </div>
        <div class="summary-row tax">
          <span>VAT (7.5%):</span>
          <span>₦${invoice.tax.toLocaleString()}</span>
        </div>
        ${
          invoice.discount > 0
            ? `
        <div class="summary-row discount">
          <span>Discount:</span>
          <span>-₦${invoice.discount.toLocaleString()}</span>
        </div>
        `
            : ''
        }
        <div class="summary-row total">
          <span>Total:</span>
          <span>₦${invoice.total.toLocaleString()}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <p><strong>Notes:</strong> ${invoice.notes}</p>
      <p style="margin-top: 15px; font-size: 11px;"><strong>Terms & Conditions:</strong> ${invoice.termsAndConditions}</p>
      <p style="margin-top: 20px; text-align: center; color: #999;">Thank you for your business!</p>
    </div>
  </div>
</body>
</html>
  `;

  return html;
}

/**
 * Download invoice as PDF (requires server-side PDF generation)
 * For now, opens HTML invoice in new window
 */
export function downloadInvoice(invoice: Invoice): void {
  const html = generateHTMLInvoice(invoice);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${invoice.invoiceNumber}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Preview invoice in browser
 */
export function previewInvoice(invoice: Invoice): void {
  const html = generateHTMLInvoice(invoice);
  const newWindow = window.open();
  if (newWindow) {
    newWindow.document.write(html);
    newWindow.document.close();
  }
}

/**
 * Send invoice email (requires backend endpoint)
 */
export async function sendInvoiceEmail(
  invoice: Invoice,
  emailAddresses: string[]
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/email/send-invoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invoice,
        emailAddresses,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to send invoice email:', error);
    return {
      success: false,
      message: 'Failed to send invoice email',
    };
  }
}
