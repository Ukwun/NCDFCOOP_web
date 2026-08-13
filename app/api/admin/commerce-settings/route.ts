import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { hasRole, verifyRequestUser } from "@/lib/server/requestAuth";
import { USER_ROLES } from "@/lib/constants/database";
import {
  normalizeMembershipTierPrices,
  validateMembershipTierPrices,
} from "@/lib/membership/pricing";
import { normalizeCommercePaymentSettings } from "@/lib/commerce/settings";

const DEFAULT_COMMISSION_PERCENT = 10;

function normalizePercentage(value: unknown): number | null {
  const percentage = Number(value);
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 30)
    return null;
  return Math.round(percentage * 100) / 100;
}

export async function GET(request: NextRequest) {
  const user = await verifyRequestUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(user, USER_ROLES.SUPER_ADMIN)) {
    return NextResponse.json(
      { error: "Owner access required." },
      { status: 403 },
    );
  }
  const snapshot = await getAdminDb()
    .collection("global_settings")
    .doc("commerce")
    .get();
  return NextResponse.json({
    sellerCommissionPercent:
      normalizePercentage(snapshot.data()?.sellerCommissionPercent) ??
      DEFAULT_COMMISSION_PERCENT,
    membershipTierPrices: normalizeMembershipTierPrices(
      snapshot.data()?.membershipTierPrices,
    ),
    ...normalizeCommercePaymentSettings(snapshot.data()),
  });
}

export async function PUT(request: NextRequest) {
  const user = await verifyRequestUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(user, USER_ROLES.SUPER_ADMIN)) {
    return NextResponse.json(
      { error: "Owner access required." },
      { status: 403 },
    );
  }
  const payload = await request.json().catch(() => ({}));
  const updates: Record<string, unknown> = {};
  const logData: Record<string, unknown> = {};

  if ("sellerCommissionPercent" in payload) {
    const sellerCommissionPercent = normalizePercentage(
      payload.sellerCommissionPercent,
    );
    if (sellerCommissionPercent === null) {
      return NextResponse.json(
        { error: "Commission must be between 0% and 30%." },
        { status: 400 },
      );
    }
    updates.sellerCommissionPercent = sellerCommissionPercent;
    logData.sellerCommissionPercent = sellerCommissionPercent;
  }

  if ("membershipTierPrices" in payload) {
    const membershipTierPrices = validateMembershipTierPrices(
      payload.membershipTierPrices,
    );
    if (!membershipTierPrices) {
      return NextResponse.json(
        {
          error:
            "Enter a whole-number price between ₦100 and ₦10,000,000 for every tier.",
        },
        { status: 400 },
      );
    }
    updates.membershipTierPrices = membershipTierPrices;
    logData.membershipTierPrices = membershipTierPrices;
  }

  if ("bankTransferAccount" in payload || "bankTransferEnabled" in payload) {
    const account = payload.bankTransferAccount || {};
    const bankName = String(account.bankName || '').trim().slice(0, 120);
    const accountName = String(account.accountName || '').trim().slice(0, 120);
    const accountNumber = String(account.accountNumber || '').replace(/\s+/g, '');
    if (payload.bankTransferEnabled === true &&
        (bankName.length < 2 || accountName.length < 2 || !/^\d{10}$/.test(accountNumber))) {
      return NextResponse.json(
        { error: 'A verified Nigerian bank, account name and 10-digit account number are required before bank transfer can be enabled.' },
        { status: 400 },
      );
    }
    if (bankName || accountName || accountNumber) {
      if (bankName.length < 2 || accountName.length < 2 || !/^\d{10}$/.test(accountNumber)) {
        return NextResponse.json({ error: 'Enter complete, valid company bank details.' }, { status: 400 });
      }
      updates.bankTransferAccount = {
        bankName,
        accountName,
        accountNumber,
        instructions: String(account.instructions || '').trim().slice(0, 500),
        verifiedBy: user.uid,
        verifiedAt: FieldValue.serverTimestamp(),
      };
      logData.bankTransferAccountLast4 = accountNumber.slice(-4);
    }
    if ("bankTransferEnabled" in payload) {
      updates.bankTransferEnabled = payload.bankTransferEnabled === true;
      logData.bankTransferEnabled = updates.bankTransferEnabled;
    }
  }

  if ("cashOnDeliveryEnabled" in payload) {
    updates.cashOnDeliveryEnabled = payload.cashOnDeliveryEnabled === true;
    logData.cashOnDeliveryEnabled = updates.cashOnDeliveryEnabled;
  }

  for (const [field, fallback, min, max] of [
    ['inventoryReservationMinutes', 30, 5, 180],
    ['bankTransferReservationHours', 48, 1, 72],
  ] as const) {
    if (field in payload) {
      const value = Number(payload[field]);
      if (!Number.isInteger(value) || value < min || value > max) {
        return NextResponse.json({ error: `${field} must be between ${min} and ${max}.` }, { status: 400 });
      }
      updates[field] = value || fallback;
      logData[field] = value;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "Provide a commerce setting to update." },
      { status: 400 },
    );
  }
  const db = getAdminDb();
  const now = FieldValue.serverTimestamp();
  await db
    .collection("global_settings")
    .doc("commerce")
    .set({ ...updates, updatedAt: now, updatedBy: user!.uid }, { merge: true });
  await db.collection("activityLogs").add({
    userId: user!.uid,
    action: "commerce_settings_updated",
    ...logData,
    createdAt: now,
  });
  const snapshot = await db.collection("global_settings").doc("commerce").get();
  return NextResponse.json({
    sellerCommissionPercent:
      normalizePercentage(snapshot.data()?.sellerCommissionPercent) ??
      DEFAULT_COMMISSION_PERCENT,
    membershipTierPrices: normalizeMembershipTierPrices(
      snapshot.data()?.membershipTierPrices,
    ),
    ...normalizeCommercePaymentSettings(snapshot.data()),
  });
}
