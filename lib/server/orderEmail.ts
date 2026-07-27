import { getAdminDb } from '@/lib/firebase/admin';
import { sendTransactionalEmail } from '@/lib/server/emailSender';

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function naira(value: unknown): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export async function sendOrderReceipt(orderId: string): Promise<void> {
  try {
    const snapshot = await getAdminDb().collection('orders').doc(orderId).get();
    if (!snapshot.exists) return;

    const order = snapshot.data() || {};
    const email = String(order.buyerEmail || '').trim();
    if (!email) return;
    const items = Array.isArray(order.items) ? order.items : [];
    const rows = items
      .map(
        (item: any) => `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #e5e7eb">${escapeHtml(item.productName)}</td>
            <td style="padding:10px;text-align:center;border-bottom:1px solid #e5e7eb">${Number(item.quantity || 0)}</td>
            <td style="padding:10px 0;text-align:right;border-bottom:1px solid #e5e7eb">${naira(item.subtotal || Number(item.price || 0) * Number(item.quantity || 0))}</td>
          </tr>`
      )
      .join('');

    await sendTransactionalEmail({
      to: email,
      subject: `Order ${orderId} received - CoopX`,
      html: `
        <!doctype html>
        <html>
          <body style="margin:0;background:#f4f7f4;font-family:Arial,sans-serif;color:#17211a">
            <div style="max-width:620px;margin:0 auto;padding:28px 18px">
              <div style="background:#164a2e;color:#fff;padding:24px;border-radius:8px 8px 0 0">
                <h1 style="margin:0;font-size:24px">Order received</h1>
                <p style="margin:8px 0 0">${escapeHtml(orderId)}</p>
              </div>
              <div style="background:#fff;padding:24px;border:1px solid #dfe8e1;border-top:0;border-radius:0 0 8px 8px">
                <p>We have received your order and will keep you updated as it moves through fulfillment.</p>
                <table style="width:100%;border-collapse:collapse;margin:20px 0">
                  <thead><tr><th style="text-align:left">Item</th><th>Qty</th><th style="text-align:right">Total</th></tr></thead>
                  <tbody>${rows}</tbody>
                </table>
                <p style="font-size:18px;font-weight:700;text-align:right">Order total: ${naira(order.totalAmount)}</p>
                <p style="color:#5f6b62;font-size:13px">Payment method: ${escapeHtml(String(order.paymentMethod || '').replace(/_/g, ' '))}</p>
              </div>
            </div>
          </body>
        </html>`,
      text: `Order ${orderId} received. Total: ${naira(order.totalAmount)}. We will notify you as fulfillment progresses.`,
    });
  } catch (error: any) {
    console.error('Order receipt email failed:', error?.code || error?.message);
  }
}
