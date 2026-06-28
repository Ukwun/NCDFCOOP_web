export interface FlutterwaveTransaction {
  id: number | string;
  tx_ref: string;
  amount: number;
  currency: string;
  status: string;
  payment_type?: string;
  processor_response?: string;
  customer?: {
    id?: number | string;
    email?: string;
    name?: string;
    phone_number?: string;
  };
}

export async function verifyFlutterwaveTransaction(
  transactionId: string | number
): Promise<FlutterwaveTransaction> {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) throw new Error('FLUTTERWAVE_NOT_CONFIGURED');

  const response = await fetch(
    `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(String(transactionId))}/verify`,
    {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    }
  );
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload?.status !== 'success' || !payload?.data) {
    throw Object.assign(new Error('FLUTTERWAVE_VERIFICATION_FAILED'), {
      status: response.status,
    });
  }

  return payload.data as FlutterwaveTransaction;
}

export function matchesExpectedPayment(
  payment: FlutterwaveTransaction,
  expected: { reference: string; amount: number; currency: string }
): boolean {
  return (
    payment.status === 'successful' &&
    payment.tx_ref === expected.reference &&
    String(payment.currency || '').toUpperCase() ===
      expected.currency.toUpperCase() &&
    Math.abs(Number(payment.amount) - Number(expected.amount)) < 0.01
  );
}
