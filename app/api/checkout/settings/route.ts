import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { normalizeCommercePaymentSettings } from '@/lib/commerce/settings';

export async function GET() {
  try {
    const snapshot = await getAdminDb().collection('global_settings').doc('commerce').get();
    const settings = normalizeCommercePaymentSettings(snapshot.data());
    return NextResponse.json({
      bankTransferEnabled: settings.bankTransferEnabled,
      cashOnDeliveryEnabled: settings.cashOnDeliveryEnabled,
      inventoryReservationMinutes: settings.inventoryReservationMinutes,
      bankTransferReservationHours: settings.bankTransferReservationHours,
    }, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    console.error('Checkout settings read failed:', error);
    return NextResponse.json(
      {
        bankTransferEnabled: false,
        cashOnDeliveryEnabled: false,
        inventoryReservationMinutes: 30,
        bankTransferReservationHours: 48,
        bankTransferAccount: null,
      },
      { status: 503 },
    );
  }
}
