import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  Timestamp,
  Unsubscribe,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/constants/database';

export type InquiryStatus = 'new' | 'quoted' | 'accepted' | 'rejected';
export type InquiryKind = 'inquiry' | 'chat';

export interface InquiryRecord {
  id: string;
  inquiryNumber: string;
  sellerId: string;
  sellerName: string;
  buyerId: string;
  buyerName: string;
  productId: string;
  productName: string;
  quantity: number;
  budget: number;
  status: InquiryStatus;
  kind: InquiryKind;
  message: string;
  quoteAmount?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface CreateInquiryInput {
  sellerId: string;
  sellerName: string;
  buyerId: string;
  buyerName: string;
  productId: string;
  productName: string;
  quantity: number;
  budget: number;
  message: string;
  kind: InquiryKind;
}

function buildInquiryNumber(now: Date): string {
  const yy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const suffix = Math.floor(Math.random() * 900 + 100);
  return `INQ-${yy}${mm}${dd}-${suffix}`;
}

export async function createInquiry(input: CreateInquiryInput): Promise<string> {
  const now = new Date();
  const timestamp = Timestamp.now();

  const payload = {
    inquiryNumber: buildInquiryNumber(now),
    sellerId: input.sellerId,
    sellerName: input.sellerName,
    buyerId: input.buyerId,
    buyerName: input.buyerName,
    productId: input.productId,
    productName: input.productName,
    quantity: input.quantity,
    budget: input.budget,
    status: 'new' as const,
    kind: input.kind,
    message: input.message,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const ref = await addDoc(collection(db, COLLECTIONS.INQUIRIES), payload);
  return ref.id;
}

export async function getSellerInquiries(sellerId: string): Promise<InquiryRecord[]> {
  const q = query(collection(db, COLLECTIONS.INQUIRIES), where('sellerId', '==', sellerId));
  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((snap) => ({ id: snap.id, ...(snap.data() as Omit<InquiryRecord, 'id'>) }))
    .sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });
}

export async function getBuyerInquiries(buyerId: string): Promise<InquiryRecord[]> {
  const q = query(collection(db, COLLECTIONS.INQUIRIES), where('buyerId', '==', buyerId));
  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((snap) => ({ id: snap.id, ...(snap.data() as Omit<InquiryRecord, 'id'>) }))
    .sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });
}

export function subscribeSellerInquiries(
  sellerId: string,
  onData: (records: InquiryRecord[]) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  const q = query(collection(db, COLLECTIONS.INQUIRIES), where('sellerId', '==', sellerId));

  return onSnapshot(
    q,
    (snapshot) => {
      const rows = snapshot.docs
        .map((snap) => ({ id: snap.id, ...(snap.data() as Omit<InquiryRecord, 'id'>) }))
        .sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });

      onData(rows);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

export function subscribeBuyerInquiries(
  buyerId: string,
  onData: (records: InquiryRecord[]) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  const q = query(collection(db, COLLECTIONS.INQUIRIES), where('buyerId', '==', buyerId));

  return onSnapshot(
    q,
    (snapshot) => {
      const rows = snapshot.docs
        .map((snap) => ({ id: snap.id, ...(snap.data() as Omit<InquiryRecord, 'id'>) }))
        .sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });

      onData(rows);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

export async function updateInquiryStatus(
  inquiryId: string,
  status: InquiryStatus,
  quoteAmount?: number
): Promise<void> {
  const updatePayload: { status: InquiryStatus; updatedAt: Timestamp; quoteAmount?: number } = {
    status,
    updatedAt: Timestamp.now(),
  };

  if (typeof quoteAmount === 'number') {
    updatePayload.quoteAmount = quoteAmount;
  }

  await updateDoc(doc(db, COLLECTIONS.INQUIRIES, inquiryId), updatePayload);
}
