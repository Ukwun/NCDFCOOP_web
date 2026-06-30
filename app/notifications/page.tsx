'use client';

import Link from 'next/link';
import { BellRing, CheckCheck, Clock3, Gift, MessageSquare, PackageCheck, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/lib/auth/authContext';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { markAllNotificationsAsRead, Notification } from '@/lib/services/notificationService';
import { USER_ROLES } from '@/lib/constants/database';

const wholesaleWords = /wholesale|bulk|supplier|compliance|sla|certification|rfq|procurement/i;

function presentation(notification: Notification, wholesale: boolean) {
  const text = `${notification.title} ${notification.message}`;
  if (wholesale && /compliance|certification|kyc/i.test(text)) return { label: 'Compliance', Icon: ShieldAlert, tone: 'border-amber-300 bg-amber-50 text-amber-900' };
  if (wholesale && /sla|delivery|breach|late/i.test(text)) return { label: 'SLA', Icon: Clock3, tone: 'border-rose-300 bg-rose-50 text-rose-900' };
  if (notification.type === 'order') return { label: wholesale ? 'Procurement' : 'Order', Icon: PackageCheck, tone: 'border-emerald-300 bg-emerald-50 text-emerald-900' };
  if (notification.type === 'message') return { label: wholesale ? 'Supplier message' : 'Message', Icon: MessageSquare, tone: 'border-blue-300 bg-blue-50 text-blue-900' };
  if (notification.type === 'promotion') return { label: wholesale ? 'Bulk offer' : 'Reward', Icon: Gift, tone: 'border-violet-300 bg-violet-50 text-violet-900' };
  return { label: wholesale ? 'Operations' : 'Account', Icon: BellRing, tone: 'border-slate-300 bg-slate-50 text-slate-900' };
}

export default function NotificationsPage() {
  const { user, currentRole, loading: authLoading } = useAuth();
  const { notifications, unreadCount, loading, error, markAsRead, refresh } = useNotifications({ userId: user?.uid || '', refreshInterval: 15000 });
  const wholesale = currentRole === USER_ROLES.INSTITUTIONAL_BUYER;
  const visible = notifications.filter((notification) => wholesale
    ? notification.type !== 'promotion' || wholesaleWords.test(`${notification.title} ${notification.message}`)
    : !wholesaleWords.test(`${notification.title} ${notification.message}`));

  if (authLoading || loading) return <div className="min-h-screen bg-slate-100 p-8 text-center text-slate-500">Synchronizing live notifications…</div>;
  if (!user) return <div className="mx-auto mt-20 max-w-xl text-center">Please sign in to view notifications.</div>;

  const markEverything = async () => { await markAllNotificationsAsRead(user.uid); await refresh(); };
  return <div className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6">
    <main className="mx-auto max-w-3xl">
      <header className={`overflow-hidden rounded-2xl p-6 text-white shadow-lg ${wholesale ? 'bg-gradient-to-br from-emerald-950 to-emerald-700' : 'bg-gradient-to-br from-blue-950 to-blue-700'}`}>
        <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-75">{wholesale ? 'Wholesale operations feed' : 'Member activity feed'}</p><div className="mt-2 flex items-end justify-between gap-4"><div><h1 className="text-3xl font-black">Notifications</h1><p className="mt-1 text-sm opacity-80">{wholesale ? 'Compliance, SLA, suppliers, RFQs and procurement events.' : 'Orders, loyalty, rewards and account activity.'}</p></div><span className="rounded-full bg-white/15 px-3 py-1 text-sm font-bold">{unreadCount} new</span></div>
      </header>
      <div className="my-4 flex items-center justify-between"><p className="text-sm text-slate-500">Updates refresh automatically every 15 seconds.</p><button onClick={() => void markEverything()} disabled={!unreadCount} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold transition hover:-translate-y-0.5 disabled:opacity-40"><CheckCheck size={16}/>Mark all read</button></div>
      {error && <div className="mb-4 rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}
      <div className="space-y-3">{visible.map((notification) => {
        const view = presentation(notification, wholesale); const Icon = view.Icon;
        return <article key={notification.id} className={`rounded-2xl border p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-md ${notification.read ? 'border-slate-200 bg-white' : view.tone}`}>
          <div className="flex gap-3"><div className="mt-0.5 rounded-xl bg-white/80 p-2"><Icon size={19}/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><h2 className="font-bold">{notification.title}</h2><span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold uppercase">{view.label}</span></div>{!notification.read && <button onClick={() => notification.id && void markAsRead(notification.id)} className="text-xs font-bold underline">Mark read</button>}</div><p className="mt-1 text-sm opacity-80">{notification.message}</p><div className="mt-3 flex items-center justify-between gap-3"><time className="text-xs opacity-60">{notification.createdAt?.seconds ? new Date(notification.createdAt.seconds * 1000).toLocaleString() : 'Just now'}</time>{notification.data?.link && <Link href={notification.data.link} onClick={() => notification.id && void markAsRead(notification.id)} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">Open</Link>}</div></div></div>
        </article>})}</div>
      {!visible.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">No {wholesale ? 'wholesale operational' : 'member'} notifications yet.</div>}
    </main>
  </div>;
}
