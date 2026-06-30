'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { BadgeCheck, Clock3, Filter, MessageSquareQuote, Search, ShieldCheck, ShoppingCart } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth/authContext';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS, USER_ROLES } from '@/lib/constants/database';
import { Product } from '@/lib/types/product';
import { addToCart } from '@/lib/services/cartService';
import { createInquiry } from '@/lib/services/inquiryService';
import { createNotification } from '@/lib/services/notificationService';
import { resolveProductImage } from '@/lib/utils/productImage';

export default function WholesaleProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [supplier, setSupplier] = useState('all');
  const [category, setCategory] = useState('all');
  const [busyId, setBusyId] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) { setLoading(false); return; }
    const liveCatalog = query(
      collection(db, COLLECTIONS.PRODUCTS),
      where('status', '==', 'live')
    );
    return onSnapshot(liveCatalog, (snapshot) => {
      setProducts(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Product))
        .filter((product) => ['wholesale', 'both'].includes(product.type || 'retail') && product.isActive !== false));
      setLoading(false);
    }, () => { setNotice('The live catalog could not be synchronized.'); setLoading(false); });
  }, []);

  const suppliers = useMemo(() => Array.from(new Set(products.map((product) => product.sellerName || 'NCDFCOOP Direct'))).sort(), [products]);
  const categories = useMemo(() => Array.from(new Set(products.map((product) => product.category).filter(Boolean))).sort(), [products]);
  const filtered = useMemo(() => products.filter((product) => {
    const term = search.toLowerCase().trim();
    return (!term || `${product.name} ${product.description} ${product.sellerName}`.toLowerCase().includes(term))
      && (supplier === 'all' || (product.sellerName || 'NCDFCOOP Direct') === supplier)
      && (category === 'all' || product.category === category);
  }), [products, search, supplier, category]);

  const addMinimumToCart = async (product: Product) => {
    if (!user) return;
    try {
      setBusyId(product.id); setNotice('');
      const quantity = Math.max(1, product.minOrderQuantity || product.minOrder || 1);
      await addToCart(user.uid, product.id, product.name, product.wholesalePrice || product.price, resolveProductImage(product.thumbnail || product.images?.[0]), quantity);
      setNotice(`${product.name} added at its minimum order quantity (${quantity}).`);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Unable to add this product.'); }
    finally { setBusyId(''); }
  };

  const requestQuote = async (product: Product) => {
    if (!user) return;
    try {
      setBusyId(product.id); setNotice('');
      const quantity = Math.max(1, product.minOrderQuantity || product.minOrder || 1);
      const inquiryId = await createInquiry({ sellerId: product.sellerId || '', sellerName: product.sellerName || 'NCDFCOOP Direct', buyerId: user.uid,
        buyerName: user.displayName || user.email || 'Wholesale buyer', productId: product.id, productName: product.name,
        quantity, budget: (product.wholesalePrice || product.price) * quantity,
        message: `RFQ requested for ${quantity} ${product.unit || 'units'} of ${product.name}. Please confirm bulk tiers, compliance documents, and delivery SLA.`, kind: 'inquiry' });
      if (product.sellerId) await createNotification(product.sellerId, { title: `Wholesale RFQ: ${product.name}`, message: `An institutional buyer requested a quote for ${quantity} ${product.unit || 'units'}.`, type: 'message', read: false,
        data: { inquiryId, productId: product.id, buyerId: user.uid, sellerId: product.sellerId, link: '/seller/inquiries' } });
      setNotice('RFQ sent. The supplier can now respond in your inquiries workspace.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Unable to send RFQ.'); }
    finally { setBusyId(''); }
  };

  return <ProtectedRoute currentPath="/wholesale/products" requiredRoles={[USER_ROLES.INSTITUTIONAL_BUYER]}>
    <div className="min-h-screen bg-slate-100 pb-20 text-slate-900">
      <header className="bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6"><p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-200">Verified institutional sourcing</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Institutional Bulk Catalog</h1><p className="mt-3 max-w-2xl text-sm text-emerald-100">Wholesale-only inventory with minimum quantities, supplier trust signals, pricing tiers, and RFQ workflows.</p></div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <section className="sticky top-16 z-20 grid gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur md:grid-cols-[1fr_220px_200px]">
          <label className="flex items-center gap-2 rounded-xl bg-slate-100 px-3"><Search size={18} className="text-slate-400"/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products or suppliers" className="w-full bg-transparent py-3 text-sm outline-none"/></label>
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3"><Filter size={16}/><select value={supplier} onChange={(event) => setSupplier(event.target.value)} className="w-full bg-transparent py-3 text-sm outline-none"><option value="all">All suppliers</option>{suppliers.map((name) => <option key={name}>{name}</option>)}</select></label>
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none"><option value="all">All categories</option>{categories.map((name) => <option key={name}>{name}</option>)}</select>
        </section>
        {notice && <div aria-live="polite" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</div>}
        {loading ? <div className="grid gap-4 py-6 sm:grid-cols-2 xl:grid-cols-3">{[1,2,3,4,5,6].map((item) => <div key={item} className="h-96 animate-pulse rounded-2xl bg-white"/>)}</div> :
        <div className="grid gap-4 py-6 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((product) => {
          const moq = Math.max(1, product.minOrderQuantity || product.minOrder || 1);
          const price = product.wholesalePrice || product.price;
          return <article key={product.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
            <Link href={`/products/${product.id}`} className="relative block h-48 overflow-hidden bg-slate-100"><Image src={resolveProductImage(product.thumbnail || product.images?.[0])} alt={product.name} fill className="object-cover transition duration-500 group-hover:scale-105"/><span className="absolute left-3 top-3 rounded-full bg-slate-950/80 px-2.5 py-1 text-xs font-bold text-white">MOQ {moq} {product.unit || 'units'}</span></Link>
            <div className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{product.category}</p><Link href={`/products/${product.id}`} className="mt-1 block text-lg font-bold leading-tight hover:text-emerald-700">{product.name}</Link></div><span className="text-right text-lg font-black">₦{price.toLocaleString()}<small className="block text-[10px] font-medium text-slate-400">per {product.unit || 'unit'}</small></span></div>
              <p className="mt-3 line-clamp-2 text-sm text-slate-500">{product.description}</p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]"><span className="rounded-lg bg-emerald-50 p-2 text-emerald-800"><BadgeCheck size={14}/>{product.sellerVerified ? 'Verified' : 'Review due'}</span><span className="rounded-lg bg-blue-50 p-2 text-blue-800"><Clock3 size={14}/>{product.slaDays || 5}-day SLA</span><span className="rounded-lg bg-violet-50 p-2 text-violet-800"><ShieldCheck size={14}/>{product.certifications?.length || 0} certs</span></div>
              <p className="mt-3 text-xs text-slate-500">Supplier: <strong className="text-slate-700">{product.sellerName || 'NCDFCOOP Direct'}</strong></p>
              {product.bulkPrices?.length ? <div className="mt-3 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">Best tier: ₦{Math.min(...product.bulkPrices.map((tier) => tier.price)).toLocaleString()} from {Math.max(...product.bulkPrices.map((tier) => tier.minQuantity))} units</div> : null}
              <div className="mt-4 grid grid-cols-2 gap-2"><button onClick={() => void requestQuote(product)} disabled={busyId === product.id} className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-700 px-3 py-2.5 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50 disabled:opacity-50"><MessageSquareQuote size={16}/>RFQ</button><button onClick={() => void addMinimumToCart(product)} disabled={busyId === product.id} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:opacity-50"><ShoppingCart size={16}/>Add MOQ</button></div>
            </div>
          </article>})}</div>}
        {!loading && filtered.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">No wholesale inventory matches these filters.</div>}
      </main>
    </div>
  </ProtectedRoute>;
}
