'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { ArrowLeft, Clock3, ShoppingCart, Tag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { useFlashDeals } from '@/lib/hooks/useFlashDeals';
import { addToCart } from '@/lib/services/cartService';
import { resolveProductImage } from '@/lib/utils/productImage';

export default function FlashSalesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { deals, loading, error } = useFlashDeals();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  const addDeal = async (deal: (typeof deals)[number]) => {
    if (!user?.uid) {
      router.push(`/signin?next=${encodeURIComponent('/flash-sales')}`);
      return;
    }
    try {
      setBusyId(deal.id);
      setNotice('');
      await addToCart(user.uid, deal.productId, deal.name, deal.price, deal.image || '', 1);
      setNotice(`${deal.name} was added to your cart.`);
    } catch {
      setNotice('This deal could not be added. It may have expired or sold out.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50 text-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-orange-950/30 dark:text-white">
      <header className="sticky top-14 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/85">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6">
          <button onClick={() => router.back()} aria-label="Go back" className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 transition hover:-translate-x-0.5 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/10"><ArrowLeft size={20}/></button>
          <div><p className="text-xs font-black uppercase tracking-[0.22em] text-orange-600">Live offers</p><h1 className="text-2xl font-black sm:text-3xl">Flash sales</h1></div>
          <button onClick={() => router.push('/cart')} className="ml-auto inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 dark:bg-white dark:text-slate-950"><ShoppingCart size={17}/>Cart</button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 via-rose-600 to-fuchsia-700 p-6 text-white shadow-xl sm:p-9">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold"><Tag size={14}/> Verified active offers</span><h2 className="mt-4 max-w-2xl text-3xl font-black sm:text-4xl">Real discounts. Live inventory. No sample deals.</h2><p className="mt-2 max-w-xl text-sm text-orange-50">Offers disappear automatically when their configured end time passes.</p></div><div className="inline-flex items-center gap-2 rounded-2xl bg-black/20 px-4 py-3 text-sm font-bold"><Clock3 size={18}/>{deals.length} active now</div></div>
        </section>

        {notice && <p aria-live="polite" className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold shadow-sm dark:border-white/10 dark:bg-white/5">{notice}</p>}
        {loading && <div className="grid gap-5 py-10 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map((n) => <div key={n} className="h-80 animate-pulse rounded-3xl bg-slate-200 dark:bg-white/10"/>)}</div>}
        {!loading && error && <div className="my-10 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900"><h2 className="font-black">Flash deals are temporarily unavailable</h2><p className="mt-1 text-sm">Please refresh shortly. Checkout and the standard product catalogue remain available.</p></div>}
        {!loading && !error && deals.length === 0 && <div className="my-10 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-white/15 dark:bg-white/5"><Clock3 className="mx-auto text-orange-500" size={34}/><h2 className="mt-4 text-xl font-black">No flash sale is active right now</h2><p className="mt-2 text-sm text-slate-500">We will show the next verified offer here as soon as it goes live.</p><button onClick={() => router.push('/products')} className="mt-5 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white dark:bg-white dark:text-slate-950">Browse all products</button></div>}

        <div className="grid gap-5 py-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {deals.map((deal) => <article key={deal.id} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/5">
            <button onClick={() => router.push(`/products/${deal.productId}`)} className="block w-full text-left"><div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-white/10"><img src={resolveProductImage(deal.image)} alt={deal.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/><span className="absolute right-3 top-3 rounded-full bg-rose-600 px-3 py-1 text-xs font-black text-white">-{deal.discountPercent}%</span></div><div className="p-5"><p className="text-xs font-bold text-orange-600">Ends in {deal.timeLeftDisplay}</p><h2 className="mt-2 line-clamp-2 font-black">{deal.name}</h2><div className="mt-3 flex items-end gap-2"><span className="text-xl font-black">₦{deal.price.toLocaleString()}</span><span className="text-sm text-slate-400 line-through">₦{deal.originalPrice.toLocaleString()}</span></div></div></button>
            <div className="px-5 pb-5"><button onClick={() => void addDeal(deal)} disabled={busyId === deal.id} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 text-sm font-black text-white transition hover:bg-orange-700 disabled:opacity-50"><ShoppingCart size={17}/>{busyId === deal.id ? 'Adding…' : 'Add to cart'}</button></div>
          </article>)}
        </div>
      </div>
    </main>
  );
}
