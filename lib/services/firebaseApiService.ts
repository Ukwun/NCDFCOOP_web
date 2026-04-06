/**
 * Firebase API Service
 * Handles all CRUD operations and complex queries
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
  writeBatch,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/constants/database';
import { ErrorHandler } from '@/lib/error/errorHandler';

/**
 * Member Services
 */
export const memberService = {
  /**
   * Get single member profile
   */
  async getMember(memberId: string) {
    try {
      if (!db) throw new Error('Database not initialized');
      const memberRef = doc(db, COLLECTIONS.MEMBERS, memberId);
      const memberSnap = await getDoc(memberRef);

      if (!memberSnap.exists()) {
        throw new Error('Member not found');
      }

      return memberSnap.data();
    } catch (error) {
      ErrorHandler.logError('MEMBER_GET', String(error), 'error');
      throw error;
    }
  },

  /**
   * Update member profile
   */
  async updateMember(memberId: string, data: Partial<DocumentData>) {
    try {
      if (!db) throw new Error('Database not initialized');
      const memberRef = doc(db, COLLECTIONS.MEMBERS, memberId);
      await updateDoc(memberRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      ErrorHandler.logError('MEMBER_UPDATE', String(error), 'error');
      throw error;
    }
  },

  /**
   * Add points to member account
   */
  async addPoints(memberId: string, points: number, reason: string) {
    try {
      if (!db) throw new Error('Database not initialized');
      const memberRef = doc(db, COLLECTIONS.MEMBERS, memberId);

      await updateDoc(memberRef, {
        rewardsPoints: increment(points),
        lifetimePoints: increment(points),
      });

      // Log transaction
      await addDoc(collection(db, COLLECTIONS.MEMBERS, memberId, 'pointHistory'), {
        points,
        reason,
        timestamp: serverTimestamp(),
        type: 'credit',
      });

      return { success: true, newPoints: points };
    } catch (error) {
      ErrorHandler.logError('MEMBER_ADD_POINTS', String(error), 'error');
      throw error;
    }
  },

  /**
   * Redeem member points
   */
  async redeemPoints(
    memberId: string,
    points: number,
    redemptionType: 'cashback' | 'voucher' | 'shop'
  ) {
    try {
      if (!db) throw new Error('Database not initialized');

      const member = await this.getMember(memberId);
      if (member.rewardsPoints < points) {
        throw new Error('Insufficient points');
      }

      const batch = writeBatch(db);

      // Update member points
      const memberRef = doc(db, COLLECTIONS.MEMBERS, memberId);
      batch.update(memberRef, {
        rewardsPoints: increment(-points),
      });

      // Create redemption record
      const redemptionRef = doc(
        collection(db, COLLECTIONS.MEMBERS, memberId, 'redemptions')
      );
      batch.set(redemptionRef, {
        points,
        redemptionType,
        status: 'pending',
        createdAt: serverTimestamp(),
        processedAt: null,
      });

      await batch.commit();

      return {
        success: true,
        remainingPoints: member.rewardsPoints - points,
      };
    } catch (error) {
      ErrorHandler.logError('MEMBER_REDEEM_POINTS', String(error), 'error');
      throw error;
    }
  },
};

/**
 * Product Services
 */
export const productService = {
  /**
   * Create new product listing
   */
  async createProduct(
    sellerId: string,
    productData: {
      name: string;
      category: string;
      price: number;
      quantity: number;
      minimumOrder: number;
      description: string;
      images: string[]; // URLs after upload
    }
  ) {
    try {
      if (!db) throw new Error('Database not initialized');

      const docRef = await addDoc(collection(db, COLLECTIONS.PRODUCTS), {
        ...productData,
        sellerId,
        status: 'pending', // pending approval
        rating: 0,
        reviews: [],
        inquiries: 0,
        sold: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { id: docRef.id, ...productData };
    } catch (error) {
      ErrorHandler.logError('PRODUCT_CREATE', String(error), 'error');
      throw error;
    }
  },

  /**
   * Update existing product
   */
  async updateProduct(productId: string, data: Partial<DocumentData>) {
    try {
      if (!db) throw new Error('Database not initialized');
      const productRef = doc(db, COLLECTIONS.PRODUCTS, productId);

      await updateDoc(productRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      ErrorHandler.logError('PRODUCT_UPDATE', String(error), 'error');
      throw error;
    }
  },

  /**
   * Delete product
   */
  async deleteProduct(productId: string) {
    try {
      if (!db) throw new Error('Database not initialized');
      const productRef = doc(db, COLLECTIONS.PRODUCTS, productId);
      await deleteDoc(productRef);
      return { success: true };
    } catch (error) {
      ErrorHandler.logError('PRODUCT_DELETE', String(error), 'error');
      throw error;
    }
  },

  /**
   * Get product by ID
   */
  async getProduct(productId: string) {
    try {
      if (!db) throw new Error('Database not initialized');
      const productRef = doc(db, COLLECTIONS.PRODUCTS, productId);
      const productSnap = await getDoc(productRef);

      if (!productSnap.exists()) {
        throw new Error('Product not found');
      }

      return { id: productSnap.id, ...productSnap.data() };
    } catch (error) {
      ErrorHandler.logError('PRODUCT_GET', String(error), 'error');
      throw error;
    }
  },

  /**
   * Get products by seller
   */
  async getSellerProducts(sellerId: string) {
    try {
      if (!db) throw new Error('Database not initialized');
      const q = query(
        collection(db, COLLECTIONS.PRODUCTS),
        where('sellerId', '==', sellerId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      ErrorHandler.logError('PRODUCT_GET_SELLER', String(error), 'error');
      throw error;
    }
  },
};

/**
 * Order Services
 */
export const orderService = {
  /**
   * Create new order
   */
  async createOrder(
    buyerId: string,
    items: Array<{
      productId: string;
      quantity: number;
      price: number;
    }>,
    totalAmount: number
  ) {
    try {
      if (!db) throw new Error('Database not initialized');

      const docRef = await addDoc(collection(db, COLLECTIONS.ORDERS), {
        buyerId,
        items,
        totalAmount,
        status: 'pending', // pending, confirmed, shipped, delivered, cancelled
        paymentStatus: 'unpaid',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { id: docRef.id, status: 'success' };
    } catch (error) {
      ErrorHandler.logError('ORDER_CREATE', String(error), 'error');
      throw error;
    }
  },

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: string,
    status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  ) {
    try {
      if (!db) throw new Error('Database not initialized');
      const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);

      await updateDoc(orderRef, {
        status,
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      ErrorHandler.logError('ORDER_UPDATE_STATUS', String(error), 'error');
      throw error;
    }
  },

  /**
   * Get buyer's orders
   */
  async getBuyerOrders(buyerId: string) {
    try {
      if (!db) throw new Error('Database not initialized');
      const q = query(
        collection(db, COLLECTIONS.ORDERS),
        where('buyerId', '==', buyerId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      ErrorHandler.logError('ORDER_GET_BUYER', String(error), 'error');
      throw error;
    }
  },
};

/**
 * Inquiry Services
 */
export const inquiryService = {
  /**
   * Create bulk purchase inquiry
   */
  async createInquiry(
    buyerId: string,
    productId: string,
    data: {
      quantity: string;
      budget: number;
      deliveryDate: string;
      message?: string;
    }
  ) {
    try {
      if (!db) throw new Error('Database not initialized');

      const docRef = await addDoc(
        collection(db, COLLECTIONS.INQUIRIES),
        {
          buyerId,
          productId,
          ...data,
          status: 'new', // new, quoted, accepted, rejected
          quotes: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      return { id: docRef.id, status: 'success' };
    } catch (error) {
      ErrorHandler.logError('INQUIRY_CREATE', String(error), 'error');
      throw error;
    }
  },

  /**
   * Submit quote for inquiry
   */
  async submitQuote(
    inquiryId: string,
    sellerId: string,
    quoteAmount: number
  ) {
    try {
      if (!db) throw new Error('Database not initialized');

      const batch = writeBatch(db);

      // Update inquiry with quote
      const inquiryRef = doc(db, COLLECTIONS.INQUIRIES, inquiryId);
      batch.update(inquiryRef, {
        status: 'quoted',
        quotes: [
          {
            sellerId,
            amount: quoteAmount,
            submittedAt: serverTimestamp(),
          },
        ],
        updatedAt: serverTimestamp(),
      });

      await batch.commit();

      return { success: true };
    } catch (error) {
      ErrorHandler.logError('INQUIRY_SUBMIT_QUOTE', String(error), 'error');
      throw error;
    }
  },

  /**
   * Get seller's inquiries
   */
  async getSellerInquiries(sellerId: string) {
    try {
      if (!db) throw new Error('Database not initialized');

      // Query for inquiries where seller's product is mentioned in the inquiry
      // This is a simplified approach - you may need to adjust based on your schema
      const q = query(
        collection(db, COLLECTIONS.INQUIRIES),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      ErrorHandler.logError('INQUIRY_GET_SELLER', String(error), 'error');
      throw error;
    }
  },

  /**
   * Update inquiry status
   */
  async updateInquiryStatus(
    inquiryId: string,
    status: 'new' | 'quoted' | 'accepted' | 'rejected'
  ) {
    try {
      if (!db) throw new Error('Database not initialized');
      const inquiryRef = doc(db, COLLECTIONS.INQUIRIES, inquiryId);

      await updateDoc(inquiryRef, {
        status,
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      ErrorHandler.logError('INQUIRY_UPDATE_STATUS', String(error), 'error');
      throw error;
    }
  },
};

/**
 * Bank Account Services
 */
export const bankService = {
  /**
   * Add or update bank account for seller
   */
  async saveBankAccount(
    sellerId: string,
    bankData: {
      bankName: string;
      accountNumber: string;
      accountName: string;
    }
  ) {
    try {
      if (!db) throw new Error('Database not initialized');
      const sellerRef = doc(db, 'sellers', sellerId);

      await updateDoc(sellerRef, {
        bankAccount: {
          ...bankData,
          verified: false, // Mark as unverified until confirmed
        },
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      ErrorHandler.logError('BANK_SAVE_ACCOUNT', String(error), 'error');
      throw error;
    }
  },
};

/**
 * Referral Services
 */
export const referralService = {
  /**
   * Create referral record
   */
  async createReferral(referrerId: string, referredEmail: string) {
    try {
      if (!db) throw new Error('Database not initialized');

      const docRef = await addDoc(
        collection(db, COLLECTIONS.MEMBERS, referrerId, 'referrals'),
        {
          referredEmail,
          status: 'pending', // pending, active, completed
          bonusAmount: 0,
          createdAt: serverTimestamp(),
          completedAt: null,
        }
      );

      return { id: docRef.id, status: 'success' };
    } catch (error) {
      ErrorHandler.logError('REFERRAL_CREATE', String(error), 'error');
      throw error;
    }
  },

  /**
   * Update referral status
   */
  async updateReferralStatus(
    memberId: string,
    referralId: string,
    status: 'pending' | 'active' | 'completed',
    bonusAmount?: number
  ) {
    try {
      if (!db) throw new Error('Database not initialized');

      const referralRef = doc(
        db,
        COLLECTIONS.MEMBERS,
        memberId,
        'referrals',
        referralId
      );

      const updateData: any = {
        status,
        updatedAt: serverTimestamp(),
      };

      if (status === 'completed' && bonusAmount) {
        updateData.completedAt = serverTimestamp();
        updateData.bonusAmount = bonusAmount;
      }

      await updateDoc(referralRef, updateData);

      return { success: true };
    } catch (error) {
      ErrorHandler.logError('REFERRAL_UPDATE_STATUS', String(error), 'error');
      throw error;
    }
  },
};

/**
 * Voting Services
 */
export const votingService = {
  /**
   * Submit member vote
   */
  async submitVote(
    memberId: string,
    proposalId: string,
    selectedOption: string
  ) {
    try {
      if (!db) throw new Error('Database not initialized');

      const voteRef = doc(
        db,
        COLLECTIONS.MEMBERS,
        memberId,
        'votes',
        proposalId
      );

      await updateDoc(voteRef, {
        selectedOption,
        votedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      ErrorHandler.logError('VOTE_SUBMIT', String(error), 'error');
      throw error;
    }
  },
};

export default {
  memberService,
  productService,
  orderService,
  inquiryService,
  bankService,
  referralService,
  votingService,
};
