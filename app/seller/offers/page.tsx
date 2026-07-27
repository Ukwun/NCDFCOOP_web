'use client';

export const dynamic = 'force-dynamic';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { BadgePercent, CalendarClock, Loader2, Tag, XCircle } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { USER_ROLES } from '@/lib/constants/database';
import { auth, db } from '@/lib/firebase/config';
import { Product } from '@/lib/types/product';

interface SellerOffer {
  id: string;
  productId: string;
  productName: string;
  title: string;
  discountPercentage: number;
  audience: 'member' | 'wholesale' | 'both';
  status: 'active' | 'scheduled' | 'inactive';
  startAt: string;
  endAt: string;
}

function defaultLocalDate(hours: number) {
  const date = new Date(Date.now() + hours * 60 * 60 * 1000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export default function SellerOffersPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<SellerOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({
    productId: '', title: '', discountPercentage: '10', audience: 'both',
    startAt: defaultLocalDate(0), endAt: defaultLocalDate(24 * 7),
  });

  const loadOffers = useCallback(async () => {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) return;
    const response = await fetch('/api/seller/offers', { headers: { Authorization: `Bearer ${token}` } });
    const result = await response.json();
    if (!response.ok) throw new Error('Offers are temporarily unavailable.');
    setOffers(result.offers || []);
  }, []);

  useEffect(() => {
    const user = auth?.currentUser;
    if (!db || !user) { setLoading(false); return; }
    const liveProducts = query(collection(db, 'products'), where('sellerId', '==', user.uid));
    const unsubscribe = onSnapshot(liveProducts, (snapshot) => {
      setProducts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product))
        .filter((product) => product.status === 'live' && product.isActive !== false));
    });
    loadOffers().catch(() => setNotice('Offers could not be refreshed. Please retry.')).finally(() => setLoading(false));
    return unsubscribe;
  }, [loadOffers]);

  const availableProducts = useMemo(() => products.filter((product) =>
    !offers.some((offer) => offer.productId === product.id && offer.status !== 'inactive' && new Date(offer.endAt).getTime() > Date.now())
  ), [offers, products]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setNotice('');
    try {
      const token = await auth?.currentUser?.getIdToken();
      const response = await fetch('/api/seller/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'The offer could not be created.');
      await loadOffers();
      setForm((current) => ({ ...current, productId: '', title: '' }));
      setNotice('Offer created. Eligible members and wholesale buyers now see it automatically.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'The offer could not be created.');
    } finally { setBusy(false); }
  }

  async function endOffer(offerId: string) {
    setBusy(true); setNotice('');
    try {
      const token = await auth?.currentUser?.getIdToken();
      const response = await fetch('/api/seller/offers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ offerId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'The offer could not be ended.');
      await loadOffers();
      setNotice('Offer ended and removed from the product.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'The offer could not be ended.');
    } finally { setBusy(false); }
  }

  return <ProtectedRoute currentPath="/seller/offers" requiredRoles={[USER_ROLES.SELLER]}>
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <header><p className="text-xs font-black uppercase tracking-[.2em] text-emerald-700">Sales campaigns</p><h1 className="mt-2 text-3xl font-black">Offers & Deals</h1><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Create time-limited product discounts. Prices update for the selected audience as soon as the offer starts.</p></header>
        {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-100">{notice}</div>}
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <form onSubmit={submit} className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-lg font-black"><BadgePercent className="text-emerald-600"/>Create an offer</div>
            <FieldLabel label="Approved product"><select required value={form.productId} onChange={(e) => setForm({...form, productId:e.target.value})} className="field"><option value="">Select a product</option>{availableProducts.map((product) => <option value={product.id} key={product.id}>{product.name} · {product.stock} in stock</option>)}</select></FieldLabel>
            <FieldLabel label="Campaign title"><input required minLength={3} maxLength={100} value={form.title} onChange={(e) => setForm({...form,title:e.target.value})} className="field" placeholder="Member appreciation deal"/></FieldLabel>
            <div className="grid grid-cols-2 gap-3"><FieldLabel label="Discount %"><input required type="number" min="1" max="90" value={form.discountPercentage} onChange={(e) => setForm({...form,discountPercentage:e.target.value})} className="field"/></FieldLabel><FieldLabel label="Audience"><select value={form.audience} onChange={(e) => setForm({...form,audience:e.target.value})} className="field"><option value="both">Both</option><option value="member">Members</option><option value="wholesale">Wholesale</option></select></FieldLabel></div>
            <FieldLabel label="Starts"><input required type="datetime-local" value={form.startAt} onChange={(e) => setForm({...form,startAt:e.target.value})} className="field"/></FieldLabel>
            <FieldLabel label="Ends"><input required type="datetime-local" value={form.endAt} onChange={(e) => setForm({...form,endAt:e.target.value})} className="field"/></FieldLabel>
            <button disabled={busy || !availableProducts.length} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 font-bold text-white transition hover:-translate-y-0.5 hover:bg-emerald-800 disabled:opacity-50">{busy ? <Loader2 className="animate-spin" size={18}/> : <Tag size={18}/>}Publish offer</button>
            {!loading && !availableProducts.length && <p className="text-xs text-slate-500">Add an approved product or end its current offer to create another.</p>}
          </form>
          <section className="space-y-3"><h2 className="text-xl font-black">Your campaigns</h2>{loading ? <div className="rounded-2xl bg-white p-8 text-center dark:bg-slate-900">Loading offers…</div> : offers.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 dark:bg-slate-900">No offers created yet.</div> : offers.map((offer) => <article key={offer.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-slate-900"><div className="flex flex-col justify-between gap-3 sm:flex-row"><div><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black uppercase text-emerald-800">{offer.status}</span><h3 className="mt-3 font-black">{offer.title}</h3><p className="text-sm text-slate-500">{offer.productName} · {offer.audience} audience</p><p className="mt-2 flex items-center gap-1 text-xs text-slate-500"><CalendarClock size={14}/>{new Date(offer.startAt).toLocaleString()} – {new Date(offer.endAt).toLocaleString()}</p></div><div className="flex items-center gap-3"><strong className="text-2xl text-emerald-700">-{offer.discountPercentage}%</strong>{offer.status !== 'inactive' && <button disabled={busy} onClick={() => void endOffer(offer.id)} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50"><XCircle size={15}/>End</button>}</div></div></article>)}</section>
        </div>
      </div>
      <style jsx>{`.field{width:100%;min-height:46px;border:1px solid rgb(203 213 225);border-radius:.75rem;background:white;padding:.65rem .8rem;color:rgb(15 23 42);outline:none}.field:focus{border-color:rgb(5 150 105);box-shadow:0 0 0 3px rgb(16 185 129 / .14)}`}</style>
    </main>
  </ProtectedRoute>;
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-bold">{label}</span>{children}</label>;
}
