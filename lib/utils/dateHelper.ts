import { Timestamp } from 'firebase/firestore';

/**
 * Safely convert Date | Timestamp to Date
 * Handles both Firebase Timestamp and native Date objects
 */
export function toDate(value: Date | Timestamp | string | number | null | undefined): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (value && typeof value === 'object' && 'toDate' in value) {
    return (value as Timestamp).toDate();
  }
  const parsed = new Date(value as string | number);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}
