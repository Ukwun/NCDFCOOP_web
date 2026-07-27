export interface PaystackTransaction {
  id: number | string;
  status: string;
  reference: string;
  amount: number;
  currency: string;
}

interface PaystackResponse<T> {
  status: boolean;
  message?: string;
  data?: T;
}

function configuredSecret(): string {
  const secret =
    process.env.PAYSTACK_SECRET_KEY ||
    process.env.FLUTTERWAVE_SECRET_KEY ||
    "";
  if (!/^sk_(test|live)_/i.test(secret)) {
    throw new Error("PAYSTACK_NOT_CONFIGURED");
  }
  return secret;
}

export function isPaystackConfigured(): boolean {
  try {
    configuredSecret();
    return true;
  } catch {
    return false;
  }
}

export function paystackEnvironment(): "test" | "live" {
  return /^sk_live_/i.test(configuredSecret()) ? "live" : "test";
}

export async function initializePaystackTransaction(input: {
  email: string;
  amount: number;
  currency: string;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}): Promise<{ authorizationUrl: string; accessCode: string; reference: string }> {
  const response = await fetch(
    "https://api.paystack.co/transaction/initialize",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${configuredSecret()}`,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify({
        email: input.email,
        amount: Math.round(input.amount * 100),
        currency: input.currency,
        reference: input.reference,
        callback_url: input.callbackUrl,
        metadata: input.metadata || {},
      }),
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    },
  );
  const payload = (await response.json().catch(() => ({}))) as PaystackResponse<{
    authorization_url?: string;
    access_code?: string;
    reference?: string;
  }>;
  if (
    !response.ok ||
    payload.status !== true ||
    !payload.data?.authorization_url ||
    !payload.data?.access_code
  ) {
    throw new Error(payload.message || "PAYSTACK_INITIALIZATION_FAILED");
  }
  return {
    authorizationUrl: payload.data.authorization_url,
    accessCode: payload.data.access_code,
    reference: payload.data.reference || input.reference,
  };
}

export async function verifyPaystackTransaction(
  reference: string,
): Promise<PaystackTransaction> {
  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${configuredSecret()}`,
        "Cache-Control": "no-cache",
      },
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    },
  );
  const payload = (await response.json().catch(() => ({}))) as PaystackResponse<
    PaystackTransaction
  >;
  if (!response.ok || payload.status !== true || !payload.data) {
    throw new Error(payload.message || "PAYSTACK_VERIFICATION_FAILED");
  }
  return payload.data;
}

export function matchesExpectedPaystackPayment(
  payment: PaystackTransaction,
  expected: { reference: string; amount: number; currency: string },
): boolean {
  return (
    payment.status === "success" &&
    payment.reference === expected.reference &&
    Number(payment.amount) === Math.round(expected.amount * 100) &&
    String(payment.currency).toUpperCase() === expected.currency.toUpperCase()
  );
}
