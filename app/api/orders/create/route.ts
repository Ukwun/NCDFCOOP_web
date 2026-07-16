import { randomUUID } from 'crypto';
import { Timestamp } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { verifyRequestUser } from '@/lib/server/requestAuth';
import { USER_ROLES } from '@/lib/constants/database';
import {
  applyMemberDiscount,
  getMembershipTier,
} from '@/lib/membership/tiers';
import { sendOrderReceipt } from '@/lib/server/orderEmail';
import { resolveProductImage } from '@/lib/utils/productImage';

type PaymentMethod = 'flutterwave' | 'bank_transfer' | 'cash_on_delivery';

interface CheckoutItemInput {
  productId?: string;
  quantity?: number;
}

interface CreateOrderPayload {
  items?: CheckoutItemInput[];
  shippingAddress?: string;
  paymentMethod?: PaymentMethod;
  clientTotal?: number;
  prepaymentDiscountRequested?: boolean;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  'flutterwave',
  'bank_transfer',
  'cash_on_delivery',
];

function money(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0
    ? Math.round(numeric * 100) / 100
    : 0;
}

function resolveUnitPrice(
  product: Record<string, any>,
  quantity: number,
  isWholesaleBuyer: boolean,
  activeMemberTier?: string
): number {
  const retailPrice = money(
    product.price || product.retailPrice || product.originalPrice
  );

  if (
    !isWholesaleBuyer ||
    !['wholesale', 'both'].includes(String(product.type || 'retail'))
  ) {
    return activeMemberTier
      ? applyMemberDiscount(retailPrice, activeMemberTier)
      : retailPrice;
  }

  const bulkPrices = Array.isArray(product.bulkPrices)
    ? product.bulkPrices
        .filter(
          (row: any) =>
            money(row?.price) > 0 &&
            quantity >= Number(row?.minQuantity || 0) &&
            (!row?.maxQuantity || quantity <= Number(row.maxQuantity))
        )
        .sort(
          (left: any, right: any) =>
            Number(right.minQuantity || 0) - Number(left.minQuantity || 0)
        )
    : [];

  return money(bulkPrices[0]?.price || product.wholesalePrice || retailPrice);
}

function validateAddress(serializedAddress: string): boolean {
  if (!serializedAddress || serializedAddress.length > 10_000) return false;

  try {
    const address = JSON.parse(serializedAddress);
    return ['firstName', 'lastName', 'phone', 'street', 'city', 'state', 'country']
      .every((field) => String(address?.[field] || '').trim().length > 0);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as CreateOrderPayload;
    const items = Array.isArray(body.items) ? body.items : [];
    const paymentMethod = body.paymentMethod;
    const shippingAddress = String(body.shippingAddress || '');

    if (
      items.length === 0 ||
      items.length > 100 ||
      !paymentMethod ||
      !PAYMENT_METHODS.includes(paymentMethod) ||
      !validateAddress(shippingAddress)
    ) {
      return NextResponse.json(
        { error: 'The checkout details are incomplete or invalid.' },
        { status: 400 }
      );
    }

    const quantities = new Map<string, number>();
    for (const item of items) {
      const productId = String(item.productId || '').trim();
      const quantity = Number(item.quantity);
      if (
        !productId ||
        !Number.isSafeInteger(quantity) ||
        quantity < 1 ||
        quantity > 10_000
      ) {
        return NextResponse.json(
          { error: 'A cart item has an invalid quantity.' },
          { status: 400 }
        );
      }
      quantities.set(productId, (quantities.get(productId) || 0) + quantity);
    }

    const db = getAdminDb();
    const commerceSettings = await db.collection('global_settings').doc('commerce').get();
    const configuredCommission = Number(commerceSettings.data()?.sellerCommissionPercent);
    const sellerCommissionPercent =
      Number.isFinite(configuredCommission) && configuredCommission >= 0 && configuredCommission <= 30
        ? Math.round(configuredCommission * 100) / 100
        : 10;
    const productEntries = await Promise.all(
      Array.from(quantities.keys()).map(async (productId) => {
        const snapshot = await db.collection('products').doc(productId).get();
        return [productId, snapshot] as const;
      })
    );
    const productSnapshots = new Map(productEntries);
    const isWholesaleBuyer =
      user.selectedRole === USER_ROLES.INSTITUTIONAL_BUYER &&
      user.roles.includes(USER_ROLES.INSTITUTIONAL_BUYER);
    const isActiveMember =
      user.selectedRole === USER_ROLES.MEMBER &&
      user.roles.includes(USER_ROLES.MEMBER) &&
      user.membershipStatus === 'active';
    const memberTier = getMembershipTier(user.memberTier);
    const normalizedItems: Array<Record<string, unknown>> = [];
    let subtotal = 0;

    for (const [productId, quantity] of quantities) {
      const snapshot = productSnapshots.get(productId);
      if (!snapshot?.exists) {
        return NextResponse.json(
          { error: 'A product in your cart is no longer available.' },
          { status: 409 }
        );
      }

      const product = snapshot.data() || {};
      const stock = Number(product.stock || 0);
      const minimum = isWholesaleBuyer
        ? Number(product.minOrderQuantity || product.minOrder || 1)
        : 1;
      const unitPrice = resolveUnitPrice(
        product,
        quantity,
        isWholesaleBuyer,
        isActiveMember ? memberTier.id : undefined
      );

      if (product.isActive === false || stock < quantity) {
        return NextResponse.json(
          { error: `${product.name || 'A product'} does not have enough stock.` },
          { status: 409 }
        );
      }
      if (quantity < minimum) {
        return NextResponse.json(
          {
            error: `${product.name || 'This product'} requires a minimum quantity of ${minimum}.`,
          },
          { status: 409 }
        );
      }
      if (unitPrice <= 0) {
        return NextResponse.json(
          { error: `${product.name || 'A product'} has no valid price.` },
          { status: 409 }
        );
      }

      const lineTotal = money(unitPrice * quantity);
      subtotal += lineTotal;
      normalizedItems.push({
        productId,
        productName: String(product.name || 'Product'),
        quantity,
        price: unitPrice,
        subtotal: lineTotal,
        sellerId: String(product.sellerId || ''),
        sellerName: String(product.sellerName || ''),
        sellerVerified: product.sellerVerified === true,
        productImage: resolveProductImage(product.thumbnail || product.images?.[0] || product.image),
        minOrderQuantity: minimum,
        unitOfMeasure: String(product.unitOfMeasure || product.unit || 'unit'),
        type: String(product.type || 'retail'),
      });
    }

    subtotal = money(subtotal);
    const grossSubtotal = subtotal;
    const prepaymentDiscountRequested =
      body.prepaymentDiscountRequested === true &&
      isWholesaleBuyer &&
      paymentMethod !== 'cash_on_delivery';
    const prepaymentDiscount = prepaymentDiscountRequested ? money(grossSubtotal * 0.1) : 0;
    subtotal = money(grossSubtotal - prepaymentDiscount);
    const discountRatio = grossSubtotal > 0 ? subtotal / grossSubtotal : 1;
    const pricedItems = normalizedItems.map((item) => {
      const sellerGrossAmount = money(Number(item.subtotal || 0) * discountRatio);
      const platformCommissionAmount = money(
        sellerGrossAmount * (sellerCommissionPercent / 100),
      );
      return {
        ...item,
        sellerGrossAmount,
        platformCommissionPercent: sellerCommissionPercent,
        platformCommissionAmount,
        sellerNetAmount: money(sellerGrossAmount - platformCommissionAmount),
      };
    });
    const tax = money(subtotal * 0.1);
    const freeShippingThreshold = isActiveMember
      ? memberTier.freeShippingThreshold
      : 50_000;
    const shipping =
      freeShippingThreshold === 0 || subtotal > freeShippingThreshold ? 0 : 2_500;
    const totalAmount = money(subtotal + tax + shipping);
    const orderId = `ORD-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const transactionRef =
      paymentMethod === 'flutterwave'
        ? `TXN-${Date.now()}-${randomUUID().slice(0, 10)}`
        : paymentMethod === 'bank_transfer'
          ? `BANK-${Date.now()}-${randomUUID().slice(0, 10)}`
          : null;
    const sellerIds = Array.from(
      new Set(
        pricedItems
          .map((item) => String(item['sellerId'] || ''))
          .filter(Boolean)
      )
    );
    const now = Timestamp.now();
    const complianceStatus = isWholesaleBuyer && pricedItems.some((item) => item['sellerVerified'] !== true)
      ? 'awaiting_seller_kyc'
      : 'cleared';
    const initialStatus = complianceStatus === 'awaiting_seller_kyc'
      ? 'compliance_review'
      : paymentMethod === 'cash_on_delivery' ? 'confirmed' : 'pending';
    const cartSnapshot = await db
      .collection('cartItems')
      .where('userId', '==', user.uid)
      .get();

    await db.runTransaction(async (transaction) => {
      const inventoryRows: Array<{
        ref: FirebaseFirestore.DocumentReference;
        quantity: number;
        stock: number;
      }> = [];

      for (const [productId, quantity] of quantities) {
        const productRef = db.collection('products').doc(productId);
        const currentProduct = await transaction.get(productRef);
        const currentStock = Number(currentProduct.data()?.stock || 0);
        if (!currentProduct.exists || currentStock < quantity) {
          throw new Error('INVENTORY_CHANGED');
        }
        inventoryRows.push({ ref: productRef, quantity, stock: currentStock });
      }

      for (const inventory of inventoryRows) {
        transaction.update(inventory.ref, {
          stock: inventory.stock - inventory.quantity,
          updatedAt: now,
        });
      }

      transaction.set(db.collection('orders').doc(orderId), {
        id: orderId,
        userId: user.uid,
        buyerId: user.uid,
        buyerEmail: user.email || '',
        items: pricedItems,
        sellerCommissionPercent,
        platformCommissionAmount: money(
          pricedItems.reduce((sum, item) => sum + Number(item.platformCommissionAmount || 0), 0),
        ),
        sellerNetAmount: money(
          pricedItems.reduce((sum, item) => sum + Number(item.sellerNetAmount || 0), 0),
        ),
        subtotal,
        grossSubtotal,
        prepaymentDiscount,
        prepaymentDiscountApplied: prepaymentDiscountRequested,
        tax,
        shipping,
        totalAmount,
        currency: 'NGN',
        status: initialStatus,
        complianceStatus,
        complianceCheckpoints: {
          identity: isWholesaleBuyer ? 'verified_buyer' : 'not_required',
          supplierKyc: complianceStatus === 'cleared' ? 'passed' : 'pending',
          moq: 'passed',
          inventory: 'reserved',
        },
        paymentStatus: 'pending',
        paymentMethod,
        shippingAddress,
        buyerType: isWholesaleBuyer ? 'wholesale' : 'member',
        memberTier: isActiveMember ? memberTier.id : null,
        sellerIds,
        ...(sellerIds.length === 1 ? { sellerId: sellerIds[0] } : {}),
        ...(transactionRef ? { transactionRef } : {}),
        inventoryReserved: true,
        createdAt: now,
        updatedAt: now,
        estimatedDelivery: Timestamp.fromMillis(now.toMillis() + 7 * 86_400_000),
      });

      if (transactionRef) {
        transaction.set(db.collection('transactions').doc(transactionRef), {
          id: transactionRef,
          orderId,
          userId: user.uid,
          email: user.email || '',
          type:
            paymentMethod === 'bank_transfer'
              ? 'bank_transfer'
              : 'order_payment',
          amount: totalAmount,
          currency: 'NGN',
          status: 'pending',
          paymentMethod,
          createdAt: now,
          updatedAt: now,
          ...(paymentMethod === 'bank_transfer'
            ? {
                expiresAt: Timestamp.fromMillis(now.toMillis() + 48 * 3_600_000),
                bankName: 'First Bank Nigeria',
                accountName: 'NCDFCOOP Commerce Limited',
                accountNumber: '3136996240',
              }
            : {}),
        });
      }

      transaction.set(db.collection('notifications').doc(), {
        userId: user.uid,
        title: 'Order received',
        message: `Order #${orderId} has been created successfully.`,
        type: 'order',
        read: false,
        data: { orderId },
        createdAt: now,
      });

      if (complianceStatus === 'awaiting_seller_kyc') {
        transaction.set(db.collection('notifications').doc(), {
          userId: user.uid,
          title: 'Supplier compliance action required',
          message: `Order #${orderId} is paused before fulfillment while seller KYC evidence is reviewed.`,
          type: 'alert',
          read: false,
          data: { orderId, status: 'compliance_review', category: 'compliance', link: `/orders/${orderId}` },
          createdAt: now,
        });
      }

      for (const cartItem of cartSnapshot.docs) {
        transaction.delete(cartItem.ref);
      }
    });

    if (paymentMethod === 'cash_on_delivery') {
      await sendOrderReceipt(orderId);
    }

    return NextResponse.json(
      {
        orderId,
        transactionRef,
        totals: { subtotal, tax, shipping, prepaymentDiscount, totalAmount, currency: 'NGN' },
        pricingAdjusted:
          money(body.clientTotal) > 0 && money(body.clientTotal) !== totalAmount,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.message === 'INVENTORY_CHANGED') {
      return NextResponse.json(
        { error: 'Inventory changed while checking out. Review your cart and try again.' },
        { status: 409 }
      );
    }

    console.error('Order creation failed:', error?.code || error?.message);
    return NextResponse.json(
      { error: 'We could not create the order. Please try again.' },
      { status: 500 }
    );
  }
}
