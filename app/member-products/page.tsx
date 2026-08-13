'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BadgePercent } from 'lucide-react';
import ProductList from '@/components/ProductList';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getProducts } from '@/lib/services/productService';
import { Product } from '@/lib/types/product';
import { USER_ROLES } from '@/lib/constants/database';

export default function MemberProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    let active = true;
    getProducts(100, 'retail')
      .then((items) => { if (active) setProducts(items); })
      .catch(() => { if (active) setProducts([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const categories = useMemo(() => ['all', ...Array.from(new Set(products.map((product) => product.category).filter(Boolean)))], [products]);
  const visible = useMemo(() => products
    .filter((product) => category === 'all' || product.category === category)
    .sort((a, b) => {
      if (sort === 'price-low') return a.price - b.price;
      if (sort === 'price-high') return b.price - a.price;
      if (sort === 'discount') return (b.discount || 0) - (a.discount || 0);
      const millis = (value: Product['createdAt'] | string) => {
        if (value instanceof Date) return value.getTime();
        if (typeof value === 'string') return Date.parse(value) || 0;
        return typeof value?.toMillis === 'function' ? value.toMillis() : 0;
      };
      return millis(b.createdAt) - millis(a.createdAt);
    }), [category, products, sort]);

  return (
    <ProtectedRoute currentPath="/member-products" requiredRoles={[USER_ROLES.MEMBER]}>
      <main className="min-h-screen bg-slate-50 pb-16 dark:bg-slate-950">
        <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3"><button onClick={() => router.push('/home')} aria-label="Return to member dashboard" className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 transition hover:-translate-x-0.5 dark:border-slate-700"><ArrowLeft size={19}/></button><span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900"><BadgePercent size={14}/> MEMBER PRICING</span></div>
            <h1 className="mt-4 text-3xl font-black text-slate-950 dark:text-white">Live member marketplace</h1>
            <p className="mt-2 text-sm text-slate-500">Only active products from the real marketplace appear here. Eligible member discounts are calculated from your account tier.</p>
          </div>
        </header>
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${category === item ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200'}`}>{item}</button>)}</div>
            <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort products" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"><option value="newest">Newest</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="discount">Highest discount</option></select>
          </div>
          <ProductList products={visible} isLoading={loading} onViewDetails={(id) => router.push(`/products/${id}`)} showPagination />
        </div>
      </main>
    </ProtectedRoute>
  );
}
