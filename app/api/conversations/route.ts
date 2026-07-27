import { Timestamp } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { verifyRequestUser } from '@/lib/server/requestAuth';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Sign in to open this conversation.' }, { status: 401 });
    const inquiryId = String((await request.json().catch(() => ({}))).inquiryId || '').trim();
    if (!inquiryId) return NextResponse.json({ error: 'Inquiry is required.' }, { status: 400 });

    const db = getAdminDb();
    const inquiryRef = db.collection('inquiries').doc(inquiryId);
    const inquiry = await inquiryRef.get();
    if (!inquiry.exists) return NextResponse.json({ error: 'Inquiry not found.' }, { status: 404 });
    const data = inquiry.data() || {};
    const buyerId = String(data.buyerId || '');
    const sellerId = String(data.sellerId || '');
    if (!buyerId || !sellerId || ![buyerId, sellerId].includes(user.uid)) {
      return NextResponse.json({ error: 'You are not part of this inquiry.' }, { status: 403 });
    }

    const conversationId = `inquiry_${inquiryId}`;
    const conversationRef = db.collection('conversations').doc(conversationId);
    await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(conversationRef);
      const now = Timestamp.now();
      if (!existing.exists) {
        transaction.set(conversationRef, {
          participants: [buyerId, sellerId],
          participantNames: {
            [buyerId]: String(data.buyerName || 'Buyer'),
            [sellerId]: String(data.sellerName || 'Seller'),
          },
          inquiryId,
          productId: String(data.productId || ''),
          productName: String(data.productName || 'Product inquiry'),
          lastMessage: String(data.message || 'Conversation opened').slice(0, 500),
          lastMessageTime: now,
          unreadCount: 0,
          unreadCounts: {
            [buyerId]: 0,
            [sellerId]: 0,
          },
          isArchived: false,
          createdAt: now,
        });
      } else {
        const existingCounts = existing.data()?.unreadCounts || {};
        transaction.set(conversationRef, {
          participants: [buyerId, sellerId],
          participantNames: {
            [buyerId]: String(data.buyerName || 'Buyer'),
            [sellerId]: String(data.sellerName || 'Seller'),
          },
          inquiryId,
          productId: String(data.productId || ''),
          productName: String(data.productName || 'Product inquiry'),
          isArchived: false,
          unreadCounts: {
            [buyerId]: Math.max(0, Number(existingCounts[buyerId] || 0)),
            [sellerId]: Math.max(0, Number(existingCounts[sellerId] || 0)),
          },
        }, { merge: true });
      }
      transaction.update(inquiryRef, { conversationId, updatedAt: now });
    });
    return NextResponse.json({ success: true, conversationId });
  } catch (error) {
    console.error('Conversation creation failed:', error);
    return NextResponse.json({ error: 'The conversation could not be opened.' }, { status: 500 });
  }
}
