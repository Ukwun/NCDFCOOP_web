import * as Sentry from '@sentry/nextjs';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';

export async function recordOperationalAlert(input: {
  category: 'payment' | 'webhook' | 'authentication' | 'inventory' | 'payout' | 'infrastructure';
  severity: 'warning' | 'error' | 'critical';
  message: string;
  context?: Record<string, string | number | boolean | null>;
  error?: unknown;
}) {
  const safeMessage = input.message.slice(0, 500);
  console.error(`[${input.category}:${input.severity}] ${safeMessage}`, input.error || '');
  if (process.env.SENTRY_DSN) {
    if (input.error instanceof Error) Sentry.captureException(input.error, { tags: { category: input.category, severity: input.severity }, extra: input.context });
    else Sentry.captureMessage(safeMessage, { level: input.severity === 'critical' ? 'fatal' : input.severity, tags: { category: input.category }, extra: input.context });
  }
  try {
    await getAdminDb().collection('anomalyAlerts').add({
      category: input.category,
      severity: input.severity,
      message: safeMessage,
      context: input.context || {},
      status: 'open',
      createdAt: Timestamp.now(),
    });
  } catch (writeError) {
    console.error('Operational alert persistence failed:', writeError);
  }
}
