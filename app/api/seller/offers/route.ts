import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { USER_ROLES } from '@/lib/constants/database';
import { getAdminDb } from '@/lib/firebase/admin';
import { hasRole, verifyRequestUser } from '@/lib/server/requestAuth';

async function requireSeller(request: NextRequest) {
  const user = await verifyRequestUser(request);
  return hasRole(user, USER_ROLES.SELLER) ? user : null;
}

function toIso(value: unknown) {
  return value && typeof (value as { toDate?: () => Date }).toDate === 'function'
    ? (value as { toDate: () => Date }).toDate().toISOString()
    : null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireSeller(request);
    if (!user) return NextResponse.json({ error: 'Seller access required.' }, { status: 403 });
    const snapshot = await getAdminDb().collection('offers').where('sellerId', '==', user.uid).get();
    const offers = snapshot.docs.map((doc) => {
      const data = doc.data();
      return { id: doc.id, ...data, startAt: toIso(data.startAt), endAt: toIso(data.endAt), createdAt: toIso(data.createdAt) };
    }).sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    return NextResponse.json({ offers });
  } catch (error) {
    console.error('Seller offers read failed:', error);
    return NextResponse.json({ error: 'Offers are temporarily unavailable.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireSeller(request);
    if (!user) return NextResponse.json({ error: 'Seller access required.' }, { status: 403 });
    const body = await request.json().catch(() => ({}));
    const productId = String(body.productId || '').trim();
    const title = String(body.title || '').trim().slice(0, 100);
    const audience = String(body.audience || '');
    const discountPercentage = Number(body.discountPercentage);
    const startDate = new Date(String(body.startAt || ''));
    const endDate = new Date(String(body.endAt || ''));
    if (!productId || title.length < 3 || !['member', 'wholesale', 'both'].includes(audience)
      || !Number.isFinite(discountPercentage) || discountPercentage < 1 || discountPercentage > 90
      || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())
      || endDate <= startDate || endDate.getTime() <= Date.now()
      || endDate.getTime() - startDate.getTime() > 90 * 24 * 60 * 60 * 1000) {
      return NextResponse.json({ error: 'Enter a product, title, 1–90% discount, audience, and a valid offer period of up to 90 days.' }, { status: 400 });
    }

    const db = getAdminDb();
    const productRef = db.collection('products').doc(productId);
    const productSnapshot = await productRef.get();
    const product = productSnapshot.data() || {};
    if (!productSnapshot.exists || product.sellerId !== user.uid) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }
    if (product.status !== 'live' || product.isActive === false) {
      return NextResponse.json({ error: 'Only approved live products can have offers.' }, { status: 409 });
    }
    if ((audience === 'member' && product.type === 'wholesale') || (audience === 'wholesale' && product.type === 'retail')) {
      return NextResponse.json({ error: 'The selected audience cannot access this product.' }, { status: 400 });
    }
    const existingEnd = product.activeOffer?.endAt?.toDate?.()?.getTime?.() || 0;
    if (product.activeOffer?.status !== 'inactive' && existingEnd > Date.now()) {
      return NextResponse.json({ error: 'End the current offer before creating another one for this product.' }, { status: 409 });
    }

    const offerRef = db.collection('offers').doc();
    const status = startDate.getTime() <= Date.now() ? 'active' : 'scheduled';
    const offer = {
      id: offerRef.id, productId, sellerId: user.uid, title,
      discount: discountPercentage, discountPercentage, audience, status,
      startAt: Timestamp.fromDate(startDate), endAt: Timestamp.fromDate(endDate),
    };
    const batch = db.batch();
    batch.set(offerRef, {
      ...offer,
      productName: String(product.name || ''),
      imageUrl: String(product.thumbnail || product.images?.[0] || ''),
      originalPrice: Number(product.price || 0),
      startDate: Timestamp.fromDate(startDate),
      endDate: Timestamp.fromDate(endDate),
      createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
    });
    batch.update(productRef, { activeOffer: offer, updatedAt: FieldValue.serverTimestamp() });
    batch.set(db.collection('activityLogs').doc(), {
      userId: user.uid, sellerId: user.uid, productId, offerId: offerRef.id,
      action: 'seller_offer_created', createdAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();
    return NextResponse.json({ success: true, offer: { ...offer, startAt: startDate.toISOString(), endAt: endDate.toISOString() } }, { status: 201 });
  } catch (error) {
    console.error('Seller offer creation failed:', error);
    return NextResponse.json({ error: 'The offer could not be created.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireSeller(request);
    if (!user) return NextResponse.json({ error: 'Seller access required.' }, { status: 403 });
    const offerId = String((await request.json().catch(() => ({}))).offerId || '').trim();
    const db = getAdminDb();
    const offerRef = db.collection('offers').doc(offerId);
    const snapshot = await offerRef.get();
    const offer = snapshot.data() || {};
    if (!snapshot.exists || offer.sellerId !== user.uid) {
      return NextResponse.json({ error: 'Offer not found.' }, { status: 404 });
    }
    const batch = db.batch();
    batch.update(offerRef, { status: 'inactive', updatedAt: FieldValue.serverTimestamp() });
    const productRef = db.collection('products').doc(String(offer.productId || ''));
    const product = await productRef.get();
    if (product.exists && product.data()?.activeOffer?.id === offerId) {
      batch.update(productRef, { activeOffer: FieldValue.delete(), updatedAt: FieldValue.serverTimestamp() });
    }
    await batch.commit();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Seller offer cancellation failed:', error);
    return NextResponse.json({ error: 'The offer could not be ended.' }, { status: 500 });
  }
}
