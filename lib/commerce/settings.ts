export interface CommercePaymentSettings {
  bankTransferEnabled: boolean;
  cashOnDeliveryEnabled: boolean;
  inventoryReservationMinutes: number;
  bankTransferReservationHours: number;
  bankTransferAccount: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    instructions: string;
  } | null;
}

export const DEFAULT_PAYMENT_SETTINGS: CommercePaymentSettings = {
  bankTransferEnabled: false,
  cashOnDeliveryEnabled: false,
  inventoryReservationMinutes: 30,
  bankTransferReservationHours: 48,
  bankTransferAccount: null,
};

function boundedInteger(value: unknown, fallback: number, min: number, max: number) {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric >= min && numeric <= max
    ? numeric
    : fallback;
}

export function normalizeCommercePaymentSettings(
  value: FirebaseFirestore.DocumentData | undefined,
): CommercePaymentSettings {
  const bankName = String(value?.bankTransferAccount?.bankName || '').trim();
  const accountName = String(value?.bankTransferAccount?.accountName || '').trim();
  const accountNumber = String(value?.bankTransferAccount?.accountNumber || '').replace(/\s+/g, '');
  const verifiedAccount =
    bankName.length >= 2 && accountName.length >= 2 && /^\d{10}$/.test(accountNumber)
      ? {
          bankName,
          accountName,
          accountNumber,
          instructions: String(value?.bankTransferAccount?.instructions || '').trim().slice(0, 500),
        }
      : null;

  return {
    bankTransferEnabled: value?.bankTransferEnabled === true && verifiedAccount !== null,
    cashOnDeliveryEnabled: value?.cashOnDeliveryEnabled === true,
    inventoryReservationMinutes: boundedInteger(value?.inventoryReservationMinutes, 30, 5, 180),
    bankTransferReservationHours: boundedInteger(value?.bankTransferReservationHours, 48, 1, 72),
    bankTransferAccount: verifiedAccount,
  };
}

