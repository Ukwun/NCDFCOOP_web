'use client';

import { useEffect, useMemo, useState } from 'react';
import { isDevAutologin } from '@/lib/utils/devSession';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS, USER_ROLES } from '@/lib/constants/database';

type UtilityRole = 'member' | 'institutional_buyer' | 'seller';
type RiskLevel = 'low' | 'medium' | 'high';

interface BasicOrder {
  id: string;
  status?: string;
  paymentStatus?: string;
  createdAt?: any;
  items?: Array<{ sellerId?: string }>;
}

interface BasicNotification {
  id: string;
  type?: string;
  read?: boolean;
}

export interface UtilityLiveData {
  loading: boolean;
  unreadAlertCount: number;
  unreadNotificationCount: number;
  investmentNotificationCount: number;
  institutionalAlertCount: number;
  kycStatus: string;
  complianceReportsCount: number;
  teamSize: number;
  verifiedSuppliersCount: number;
  suppliersObservedCount: number;
  transactionProtectionRate: number;
  deliveryConfidenceRate: number;
  slaRiskCount: number;
  complianceDriftLevel: RiskLevel;
}

function toMillis(timestampLike: any): number {
  if (!timestampLike) return 0;
  if (typeof timestampLike?.toMillis === 'function') return timestampLike.toMillis();
  if (typeof timestampLike?.seconds === 'number') return timestampLike.seconds * 1000;
  const parsed = new Date(timestampLike).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function toRiskLevel(value: number, highThreshold: number, mediumThreshold: number): RiskLevel {
  if (value >= highThreshold) return 'high';
  if (value >= mediumThreshold) return 'medium';
  return 'low';
}

export function useUtilityLiveData(userId: string, role: UtilityRole): UtilityLiveData {
  const [notifications, setNotifications] = useState<BasicNotification[]>([]);
  const [ordersByUserId, setOrdersByUserId] = useState<BasicOrder[]>([]);
  const [ordersByBuyerId, setOrdersByBuyerId] = useState<BasicOrder[]>([]);
  const [memberDoc, setMemberDoc] = useState<Record<string, any> | null>(null);
  const [userDoc, setUserDoc] = useState<Record<string, any> | null>(null);
  const [analyticsDailyCount, setAnalyticsDailyCount] = useState(0);
  const [openAnomalyCount, setOpenAnomalyCount] = useState(0);
  const [verifiedSuppliersCount, setVerifiedSuppliersCount] = useState(0);
  const [suppliersObservedCount, setSuppliersObservedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !db || isDevAutologin()) {
      setNotifications([]);
      setOrdersByUserId([]);
      setOrdersByBuyerId([]);
      setMemberDoc(null);
      setUserDoc(null);
      setAnalyticsDailyCount(0);
      setOpenAnomalyCount(0);
      setVerifiedSuppliersCount(0);
      setSuppliersObservedCount(0);
      setLoading(false);
      return;
    }

    const unsubs: Array<() => void> = [];
    setLoading(true);

    const notificationsQ = query(
      collection(db, COLLECTIONS.NOTIFICATIONS),
      where('userId', '==', userId)
    );

    unsubs.push(
      onSnapshot(
        notificationsQ,
        (snap) => {
          const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, any>) }));
          setNotifications(items);
        },
        () => {
          setNotifications([]);
        }
      )
    );

    const ordersByUserQ = query(
      collection(db, COLLECTIONS.ORDERS),
      where('userId', '==', userId)
    );

    unsubs.push(
      onSnapshot(
        ordersByUserQ,
        (snap) => {
          const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, any>) }));
          setOrdersByUserId(items);
        },
        () => {
          setOrdersByUserId([]);
        }
      )
    );

    const ordersByBuyerQ = query(
      collection(db, COLLECTIONS.ORDERS),
      where('buyerId', '==', userId)
    );

    unsubs.push(
      onSnapshot(
        ordersByBuyerQ,
        (snap) => {
          const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, any>) }));
          setOrdersByBuyerId(items);
        },
        () => {
          setOrdersByBuyerId([]);
        }
      )
    );

    const userRef = doc(db, COLLECTIONS.USERS, userId);
    unsubs.push(
      onSnapshot(
        userRef,
        (snap) => {
          setUserDoc(snap.exists() ? (snap.data() as Record<string, any>) : null);
        },
        () => {
          setUserDoc(null);
        }
      )
    );

    if (role === USER_ROLES.MEMBER) {
      const memberRef = doc(db, COLLECTIONS.MEMBERS, userId);
      unsubs.push(
        onSnapshot(
          memberRef,
          (snap) => {
            setMemberDoc(snap.exists() ? (snap.data() as Record<string, any>) : null);
          },
          () => {
            setMemberDoc(null);
          }
        )
      );
    }

    const needsOperationalIntelligence =
      role === USER_ROLES.INSTITUTIONAL_BUYER || role === USER_ROLES.SELLER;

    if (needsOperationalIntelligence) {
      const anomaliesQ = query(
        collection(db, COLLECTIONS.ANOMALY_ALERTS),
        where('status', '==', 'open')
      );

      unsubs.push(
        onSnapshot(
          anomaliesQ,
          (snap) => {
            setOpenAnomalyCount(snap.size);
          },
          () => {
            setOpenAnomalyCount(0);
          }
        )
      );

      const analyticsQ = collection(db, COLLECTIONS.ANALYTICS_DAILY);
      unsubs.push(
        onSnapshot(
          analyticsQ,
          (snap) => {
            setAnalyticsDailyCount(snap.size);
          },
          () => {
            setAnalyticsDailyCount(0);
          }
        )
      );
    } else {
      setOpenAnomalyCount(0);
      setAnalyticsDailyCount(0);
    }

    setLoading(false);

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [userId, role]);

  const orders = useMemo(() => {
    const map = new Map<string, BasicOrder>();
    [...ordersByUserId, ...ordersByBuyerId].forEach((order) => {
      map.set(order.id, order);
    });
    return Array.from(map.values());
  }, [ordersByBuyerId, ordersByUserId]);

  useEffect(() => {
    const syncSuppliers = async () => {
      if (!db || orders.length === 0) {
        setVerifiedSuppliersCount(0);
        setSuppliersObservedCount(0);
        return;
      }

      const sellerIdSet = new Set<string>();
      for (const order of orders) {
        (order.items || []).forEach((item) => {
          if (item?.sellerId) sellerIdSet.add(item.sellerId);
        });
      }

      const sellerIds = Array.from(sellerIdSet);
      setSuppliersObservedCount(sellerIds.length);
      if (sellerIds.length === 0) {
        setVerifiedSuppliersCount(0);
        return;
      }

      const docs = await Promise.all(
        sellerIds.map(async (sellerId) => {
          try {
            const snap = await getDoc(doc(db, COLLECTIONS.USERS, sellerId));
            if (!snap.exists()) return false;
            const data = snap.data() as Record<string, any>;
            return (
              data?.isVerified === true ||
              data?.verificationStatus === 'verified' ||
              data?.kycStatus === 'verified'
            );
          } catch {
            return false;
          }
        })
      );

      setVerifiedSuppliersCount(docs.filter(Boolean).length);
    };

    syncSuppliers();
  }, [orders]);

  const computed = useMemo(() => {
    const unreadNotificationCount = notifications.filter((n) => !n.read).length;
    const unreadAlertCount = notifications.filter((n) => !n.read && n.type === 'alert').length;
    const investmentNotificationCount = notifications.filter(
      (n) => !n.read && (n.type === 'promotion' || n.type === 'system')
    ).length;
    const institutionalAlertCount = notifications.filter(
      (n) => !n.read && (n.type === 'alert' || n.type === 'system' || n.type === 'message')
    ).length;

    const nonCancelledOrders = orders.filter((o) => o.status !== 'cancelled');
    const protectedOrders = nonCancelledOrders.filter((o) =>
      ['paid', 'completed', 'refunded'].includes(String(o.paymentStatus || '').toLowerCase())
    );
    const deliveredOrders = nonCancelledOrders.filter((o) => o.status === 'delivered');

    const transactionProtectionRate =
      nonCancelledOrders.length > 0
        ? Math.round((protectedOrders.length / nonCancelledOrders.length) * 100)
        : 0;

    const deliveryConfidenceRate =
      nonCancelledOrders.length > 0
        ? Math.round((deliveredOrders.length / nonCancelledOrders.length) * 100)
        : 0;

    const now = Date.now();
    const slaRiskCount = orders.filter((o) => {
      const isActive = ['pending', 'processing', 'confirmed', 'shipped'].includes(
        String(o.status || '').toLowerCase()
      );
      if (!isActive) return false;
      const ageMs = now - toMillis(o.createdAt);
      return ageMs > 72 * 60 * 60 * 1000;
    }).length;

    const kycStatus =
      String(memberDoc?.kycStatus || userDoc?.kycStatus || userDoc?.verificationStatus || 'unknown').toLowerCase();

    let complianceDriftLevel: RiskLevel = 'low';
    if (role === USER_ROLES.MEMBER) {
      if (['rejected', 'failed', 'suspended'].includes(kycStatus)) {
        complianceDriftLevel = 'high';
      } else if (['pending', 'review'].includes(kycStatus)) {
        complianceDriftLevel = 'medium';
      }
    } else {
      const anomalyRisk = toRiskLevel(openAnomalyCount, 6, 2);
      const slaRisk = toRiskLevel(slaRiskCount, 4, 1);
      complianceDriftLevel = anomalyRisk === 'high' || slaRisk === 'high'
        ? 'high'
        : anomalyRisk === 'medium' || slaRisk === 'medium'
        ? 'medium'
        : 'low';
    }

    const teamSizeRaw = userDoc?.teamSize;
    const teamMembers = Array.isArray(userDoc?.teamMembers) ? userDoc.teamMembers.length : 0;
    const teamSize = typeof teamSizeRaw === 'number' ? teamSizeRaw : teamMembers;

    return {
      unreadAlertCount,
      unreadNotificationCount,
      investmentNotificationCount,
      institutionalAlertCount,
      kycStatus,
      complianceReportsCount: analyticsDailyCount,
      teamSize,
      transactionProtectionRate,
      deliveryConfidenceRate,
      slaRiskCount,
      complianceDriftLevel,
    };
  }, [analyticsDailyCount, memberDoc, notifications, openAnomalyCount, orders, role, userDoc]);

  return {
    loading,
    verifiedSuppliersCount,
    suppliersObservedCount,
    ...computed,
  };
}
