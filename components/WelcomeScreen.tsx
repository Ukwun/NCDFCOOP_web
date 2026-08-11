"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Boxes,
  Building2,
  ChevronRight,
  Handshake,
  Headphones,
  Menu,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  X,
} from "lucide-react";
import { collection, limit, onSnapshot, query, where } from "firebase/firestore";
import { useAuth } from "@/lib/auth/authContext";
import { getAuthenticatedLandingPath } from "@/lib/auth/roleRouting";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/constants/database";
import { Product } from "@/lib/types/product";
import { resolveProductImage } from "@/lib/utils/productImage";
import { getActiveProductOffer } from "@/lib/utils/productOffer";

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

const roleCards = [
  {
    icon: ShoppingBag,
    title: "Shop as a member",
    copy: "Buy verified everyday products, manage orders, earn rewards and unlock tier-based cooperative benefits.",
    accent: "bg-amber-50 text-amber-700",
  },
  {
    icon: Building2,
    title: "Buy at wholesale scale",
    copy: "Source in bulk with minimum-order visibility, supplier intelligence, order controls and dedicated inquiry channels.",
    accent: "bg-blue-50 text-blue-700",
  },
  {
    icon: Store,
    title: "Grow as a seller",
    copy: "List products, manage inventory and offers, respond to buyers, track earnings and request verified payouts.",
    accent: "bg-emerald-50 text-emerald-700",
  },
];

const platformCapabilities = [
  { icon: BadgeCheck, title: "Controlled marketplace", copy: "Products enter the public catalog only after the platform approval workflow is complete." },
  { icon: Handshake, title: "Direct buyer relationships", copy: "Product inquiries become live conversations between the buyer and the responsible seller." },
  { icon: PackageCheck, title: "Order accountability", copy: "Orders, payment status, fulfilment and delivery activity remain tied to the right accounts." },
  { icon: BarChart3, title: "Operational visibility", copy: "Role-aware dashboards give each participant the controls and information relevant to their work." },
];

function priceFor(product: Product) {
  return product.price || product.retailPrice || product.originalPrice || 0;
}

export default function WelcomeScreen() {
  const { user, currentRole, roleSelectionComplete, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogUnavailable, setCatalogUnavailable] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [boardIndex, setBoardIndex] = useState(0);
  const marketplaceRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!db) {
      setCatalogUnavailable(true);
      setCatalogLoading(false);
      return;
    }

    const liveCatalog = query(
      collection(db, COLLECTIONS.PRODUCTS),
      where("status", "==", "live"),
      limit(80),
    );

    return onSnapshot(
      liveCatalog,
      (snapshot) => {
        const nextProducts = snapshot.docs
          .map((document) => ({ id: document.id, ...document.data() }) as Product)
          .sort((a, b) => {
            const featured = Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured));
            if (featured) return featured;
            const toMillis = (value: Product["createdAt"]) =>
              (value as { toMillis?: () => number })?.toMillis?.() || 0;
            return toMillis(b.createdAt) - toMillis(a.createdAt);
          });
        setProducts(nextProducts);
        setCatalogUnavailable(false);
        setCatalogLoading(false);
      },
      () => {
        setCatalogUnavailable(true);
        setCatalogLoading(false);
      },
    );
  }, []);

  const categories = useMemo(
    () => [
      "All",
      ...Array.from(new Set(products.map((product) => product.category).filter(Boolean))).sort(),
    ],
    [products],
  );

  const activeDealProducts = useMemo(
    () => products.filter((product) => getActiveProductOffer(product) || product.isFeatured).slice(0, 4),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      const inCategory = category === "All" || product.category === category;
      const matches = !term || [product.name, product.category, product.description, product.sellerName]
        .some((value) => String(value || "").toLowerCase().includes(term));
      return inCategory && matches;
    }).slice(0, 12);
  }, [category, products, search]);

  useEffect(() => {
    if (activeDealProducts.length < 2) return;
    const timer = window.setInterval(
      () => setBoardIndex((current) => (current + 1) % activeDealProducts.length),
      5000,
    );
    return () => window.clearInterval(timer);
  }, [activeDealProducts.length]);

  const openMarketplace = (event: FormEvent) => {
    event.preventDefault();
    marketplaceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const accountHref = user && !authLoading
    ? getAuthenticatedLandingPath(currentRole, roleSelectionComplete)
    : "/signin";
  const boardProduct = activeDealProducts[boardIndex];
  const liveOffer = boardProduct ? getActiveProductOffer(boardProduct) : null;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f6f7f3] text-slate-950 selection:bg-emerald-200">
      <header className="sticky top-0 z-50 border-b border-emerald-950/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center gap-5 px-4 sm:px-6 lg:px-10">
          <Link href="/welcome" aria-label="CoopX homepage" className="shrink-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700">
            <Image src="/images/logo/coopx-logo-nav.jpg" alt="CoopX" width={220} height={78} priority className="h-11 w-auto object-contain sm:h-12" />
          </Link>

          <nav aria-label="Primary navigation" className="ml-auto hidden items-center gap-7 lg:flex">
            <a href="#marketplace" className="text-sm font-semibold text-slate-700 transition hover:text-emerald-800">Marketplace</a>
            <a href="#how-it-works" className="text-sm font-semibold text-slate-700 transition hover:text-emerald-800">How it works</a>
            <a href="#for-everyone" className="text-sm font-semibold text-slate-700 transition hover:text-emerald-800">Who it is for</a>
            <a href="#trust" className="text-sm font-semibold text-slate-700 transition hover:text-emerald-800">Why CoopX</a>
          </nav>

          <div className="ml-auto hidden items-center gap-3 sm:flex lg:ml-4">
            <Link href={accountHref} className="rounded-full px-4 py-2.5 text-sm font-bold text-emerald-900 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-700">
              {user ? "Open dashboard" : "Sign in"}
            </Link>
            {!user && (
              <Link href="/signup" className="rounded-full bg-emerald-900 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2 motion-reduce:transform-none">
                Create account
              </Link>
            )}
          </div>

          <button type="button" onClick={() => setMobileOpen((open) => !open)} aria-expanded={mobileOpen} aria-label="Toggle navigation" className="ml-auto rounded-xl border border-slate-200 p-2.5 text-slate-800 sm:hidden">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {mobileOpen && (
          <div className="border-t border-slate-100 bg-white px-4 py-4 shadow-lg sm:hidden">
            <div className="grid gap-2">
              {[['Marketplace', '#marketplace'], ['How it works', '#how-it-works'], ['Who it is for', '#for-everyone'], ['Why CoopX', '#trust']].map(([label, href]) => (
                <a key={href} href={href} onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-3 font-semibold text-slate-700 hover:bg-emerald-50">{label}</a>
              ))}
              <Link href={accountHref} className="mt-2 rounded-xl border border-emerald-900 px-4 py-3 text-center font-bold text-emerald-900">{user ? "Open dashboard" : "Sign in"}</Link>
              {!user && <Link href="/signup" className="rounded-xl bg-emerald-900 px-4 py-3 text-center font-bold text-white">Create account</Link>}
            </div>
          </div>
        )}
      </header>

      <main>
        <section className="relative isolate overflow-hidden bg-[#052e24] text-white">
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_30%,#6ee7b7_0,transparent_28%),radial-gradient(circle_at_90%_10%,#facc15_0,transparent_24%)]" />
          <div className="relative mx-auto grid max-w-[1440px] gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.04fr_.96fr] lg:px-10 lg:py-16">
            <div className="flex flex-col justify-center">
              <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">
                <Sparkles size={15} /> Powering the agri value chain
              </div>
              <h1 className="max-w-3xl font-serif text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl">
                One trusted marketplace for everyday buying, wholesale trade and seller growth.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-emerald-50/80 sm:text-lg">
                CoopX connects members, verified sellers and wholesale buyers in a controlled commerce ecosystem—so products, conversations, orders, rewards and payouts stay connected to the people responsible for them.
              </p>

              <form onSubmit={openMarketplace} role="search" className="mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-2xl sm:flex-row">
                <label htmlFor="home-product-search" className="sr-only">Search the live marketplace</label>
                <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
                  <Search size={20} className="shrink-0 text-emerald-800" />
                  <input id="home-product-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products, categories or sellers" className="min-h-12 w-full bg-white text-slate-950 outline-none placeholder:text-slate-400" />
                </div>
                <button type="submit" className="min-h-12 rounded-xl bg-amber-400 px-6 font-extrabold text-emerald-950 transition hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2">Search marketplace</button>
              </form>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/signup" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-emerald-950 transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-emerald-950 motion-reduce:transform-none">
                  Start with CoopX <ArrowRight size={18} />
                </Link>
                <a href="#how-it-works" className="inline-flex min-h-12 items-center rounded-full border border-white/30 px-6 py-3 font-bold text-white transition hover:bg-white/10">See how it works</a>
              </div>
            </div>

            <div className="relative min-h-[420px] overflow-hidden rounded-[2rem] border border-white/15 bg-emerald-900 shadow-2xl sm:min-h-[520px]">
              <Image src={boardProduct ? resolveProductImage(boardProduct.thumbnail || boardProduct.images?.[0]) : "/images/onboarding/coopx-figma-1.jpg"} alt={boardProduct ? boardProduct.name : "A CoopX marketplace transaction"} fill priority className="object-cover transition duration-700" sizes="(max-width: 1024px) 100vw, 48vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                {boardProduct ? (
                  <>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-emerald-900">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 motion-reduce:animate-none" />
                      {liveOffer ? `${liveOffer.discountPercentage}% live offer` : "Featured live listing"}
                    </div>
                    <h2 className="text-2xl font-black sm:text-3xl">{boardProduct.name}</h2>
                    <p className="mt-2 text-sm text-white/80">{boardProduct.category} · {boardProduct.sellerName || "CoopX marketplace"}</p>
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <span className="text-xl font-black">{priceFor(boardProduct) > 0 ? naira.format(priceFor(boardProduct)) : "Request pricing"}</span>
                      <Link href={`/products/${boardProduct.id}`} className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-4 py-2.5 text-sm font-black text-emerald-950 transition hover:bg-amber-300">View listing <ChevronRight size={17} /></Link>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="rounded-full bg-amber-400 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-emerald-950">Welcome to CoopX</span>
                    <h2 className="mt-4 text-2xl font-black sm:text-3xl">Trade with clarity from discovery to fulfilment.</h2>
                    <p className="mt-2 max-w-md text-sm leading-6 text-white/80">Explore the marketplace now, then create the account that matches how you buy or sell.</p>
                  </>
                )}
              </div>
              {activeDealProducts.length > 1 && (
                <div className="absolute right-5 top-5 flex gap-2" aria-label="Advertisement selector">
                  {activeDealProducts.map((product, index) => <button key={product.id} type="button" onClick={() => setBoardIndex(index)} aria-label={`Show ${product.name}`} className={`h-2.5 rounded-full transition-all ${index === boardIndex ? 'w-8 bg-amber-400' : 'w-2.5 bg-white/60'}`} />)}
                </div>
              )}
            </div>
          </div>
        </section>

        <section aria-label="Platform assurances" className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-px bg-slate-200 lg:grid-cols-4">
            {[
              [ShieldCheck, "Role-aware access", "The right controls for each account"],
              [BadgeCheck, "Approved listings", "Only live products enter discovery"],
              [Truck, "Order visibility", "Track commerce activity end to end"],
              [Headphones, "Buyer–seller contact", "Real inquiry conversations"],
            ].map(([Icon, title, copy]) => {
              const AssuranceIcon = Icon as typeof ShieldCheck;
              return <div key={String(title)} className="flex gap-3 bg-white p-5 sm:p-6"><AssuranceIcon className="mt-0.5 shrink-0 text-emerald-700" size={23} /><div><p className="font-extrabold text-slate-900">{String(title)}</p><p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">{String(copy)}</p></div></div>;
            })}
          </div>
        </section>

        <section id="marketplace" ref={marketplaceRef} className="scroll-mt-24 py-16 sm:py-20">
          <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Live marketplace</p>
                <h2 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">Discover what is available now</h2>
                <p className="mt-3 max-w-2xl text-slate-600">This catalog is read directly from approved CoopX listings. New approvals and product changes appear without replacing them with demo inventory.</p>
              </div>
              <Link href="/products" className="inline-flex items-center gap-2 font-extrabold text-emerald-800 hover:text-emerald-600">View full marketplace <ArrowRight size={18} /></Link>
            </div>

            <div className="mt-8 flex gap-2 overflow-x-auto pb-3" aria-label="Product categories">
              {categories.map((item) => (
                <button key={item} type="button" onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full border px-4 py-2.5 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-emerald-700 ${category === item ? 'border-emerald-900 bg-emerald-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-500 hover:text-emerald-800'}`}>{item}</button>
              ))}
            </div>

            {catalogLoading ? (
              <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => <div key={index} className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="aspect-[4/3] animate-pulse bg-slate-200 motion-reduce:animate-none" /><div className="space-y-3 p-4"><div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" /><div className="h-5 w-1/2 animate-pulse rounded bg-slate-200" /></div></div>)}
              </div>
            ) : filteredProducts.length ? (
              <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {filteredProducts.slice(0, 8).map((product) => {
                  const offer = getActiveProductOffer(product);
                  return <Link href={`/products/${product.id}`} key={product.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 motion-reduce:transform-none">
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                      <Image src={resolveProductImage(product.thumbnail || product.images?.[0])} alt={product.name} fill className="object-cover transition duration-500 group-hover:scale-105 motion-reduce:transform-none" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
                      {offer && <span className="absolute left-3 top-3 rounded-full bg-rose-600 px-2.5 py-1 text-xs font-black text-white">{offer.discountPercentage}% off</span>}
                      <span className="absolute bottom-3 right-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-extrabold text-emerald-900 shadow">{product.stock > 0 ? 'In stock' : 'Unavailable'}</span>
                    </div>
                    <div className="p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{product.category}</p>
                      <h3 className="mt-1 line-clamp-2 min-h-11 font-extrabold leading-5 text-slate-900 group-hover:text-emerald-800">{product.name}</h3>
                      <div className="mt-4 flex items-end justify-between gap-2">
                        <div><p className="text-lg font-black text-slate-950">{priceFor(product) > 0 ? naira.format(priceFor(product)) : 'Request price'}</p><p className="mt-0.5 truncate text-xs text-slate-500">{product.sellerName || 'CoopX'}{product.unit ? ` · ${product.unit}` : ''}</p></div>
                        <span className="rounded-full bg-emerald-50 p-2 text-emerald-800 transition group-hover:bg-emerald-900 group-hover:text-white"><ArrowRight size={17} /></span>
                      </div>
                    </div>
                  </Link>;
                })}
              </div>
            ) : (
              <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                <Boxes className="mx-auto text-emerald-700" size={38} />
                <h3 className="mt-4 text-xl font-black">{catalogUnavailable ? 'The live catalog is temporarily unavailable' : search || category !== 'All' ? 'No live products match this search' : 'Approved listings will appear here'}</h3>
                <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">{catalogUnavailable ? 'Please try again shortly. Account access and sign-up remain available.' : 'Change the category or search terms, or create an account to return when new products are approved.'}</p>
                {(search || category !== "All") && <button type="button" onClick={() => { setSearch(""); setCategory("All"); }} className="mt-5 rounded-full bg-emerald-900 px-5 py-2.5 font-bold text-white">Clear filters</button>}
              </div>
            )}
          </div>
        </section>

        <section id="for-everyone" className="scroll-mt-24 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Built for the complete trade relationship</p>
              <h2 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">One platform, distinct experiences for every participant</h2>
              <p className="mt-4 text-slate-600">CoopX does not make every user operate the same way. Your verified account role determines the workspace, permissions, prices and operational tools you receive.</p>
            </div>
            <div className="mt-9 grid gap-5 lg:grid-cols-3">
              {roleCards.map(({ icon: Icon, title, copy, accent }) => <article key={title} className="group rounded-3xl border border-slate-200 bg-[#fbfcf9] p-7 transition duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl motion-reduce:transform-none"><div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accent}`}><Icon size={25} /></div><h3 className="mt-6 text-xl font-black">{title}</h3><p className="mt-3 leading-7 text-slate-600">{copy}</p><Link href="/signup" className="mt-6 inline-flex items-center gap-2 font-extrabold text-emerald-800">Create your account <ChevronRight size={18} /></Link></article>)}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-24 bg-[#082f27] py-16 text-white sm:py-20">
          <div className="mx-auto grid max-w-[1440px] gap-10 px-4 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:px-10">
            <div className="relative min-h-[420px] overflow-hidden rounded-[2rem]">
              <Image src="/images/onboarding/coopx-figma-3.jpg" alt="Cooperative wholesale trade and fulfilment" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 42vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/75 to-transparent" />
              <div className="absolute bottom-0 p-7"><p className="text-sm font-bold text-emerald-200">Connected commerce</p><p className="mt-2 text-2xl font-black">From product approval to buyer delivery, every action has an accountable owner.</p></div>
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">How CoopX works</p>
              <h2 className="mt-3 font-serif text-3xl font-bold sm:text-4xl">A clear path from account to completed trade</h2>
              <div className="mt-8 grid gap-5">
                {[
                  ["01", "Create and verify your account", "Choose the buyer or seller path that reflects how you intend to use the marketplace."],
                  ["02", "Discover or publish live inventory", "Buyers see approved products; sellers submit inventory through the review workflow."],
                  ["03", "Transact with the right controls", "Pricing, membership benefits, wholesale quantities, inquiries and orders follow the active role."],
                  ["04", "Track the outcome", "Participants monitor messages, fulfilment, earnings, withdrawals and administrative decisions in their own dashboards."],
                ].map(([number, title, copy]) => <div key={number} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400 font-black text-emerald-950">{number}</span><div><h3 className="font-extrabold">{title}</h3><p className="mt-1 text-sm leading-6 text-emerald-50/70">{copy}</p></div></div>)}
              </div>
            </div>
          </div>
        </section>

        <section id="trust" className="scroll-mt-24 py-16 sm:py-20">
          <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
            <div className="text-center"><p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Commerce with operational intelligence</p><h2 className="mx-auto mt-3 max-w-3xl font-serif text-3xl font-bold sm:text-4xl">The platform understands who is acting—and what they are allowed to do</h2></div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {platformCapabilities.map(({ icon: Icon, title, copy }) => <div key={title} className="rounded-3xl border border-slate-200 bg-white p-6"><Icon className="text-emerald-700" size={27} /><h3 className="mt-5 font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p></div>)}
            </div>
            <div className="mt-12 overflow-hidden rounded-[2rem] bg-amber-400 px-6 py-10 sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-10">
              <div><p className="font-bold text-emerald-900">Ready to participate?</p><h2 className="mt-2 max-w-2xl font-serif text-3xl font-bold text-emerald-950">Enter a marketplace designed around real roles, real products and accountable trade.</h2></div>
              <div className="mt-6 flex shrink-0 flex-wrap gap-3 lg:mt-0"><Link href="/signup" className="inline-flex items-center gap-2 rounded-full bg-emerald-950 px-6 py-3.5 font-bold text-white transition hover:-translate-y-0.5 hover:bg-emerald-900 motion-reduce:transform-none">Create account <ArrowRight size={18} /></Link><Link href="/signin" className="rounded-full border border-emerald-950 px-6 py-3.5 font-bold text-emerald-950 transition hover:bg-white/40">Sign in</Link></div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#041f1a] text-emerald-50">
        <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-10">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <Image src="/images/logo/coopx-logo-full.jpg" alt="CoopX" width={360} height={150} className="h-20 w-auto rounded-lg object-contain" />
              <p className="mt-5 max-w-md text-sm leading-7 text-emerald-50/65">CoopX is a role-aware cooperative commerce platform connecting members, wholesale buyers and sellers through controlled product discovery, communication, ordering and settlement workflows.</p>
              <a href="mailto:support@ncdfcoop.com" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-amber-300 hover:text-amber-200"><Headphones size={17} /> support@ncdfcoop.com</a>
            </div>
            <div><h3 className="font-black text-white">Marketplace</h3><div className="mt-4 grid gap-3 text-sm text-emerald-50/65"><a href="#marketplace" className="hover:text-white">Browse products</a><a href="#for-everyone" className="hover:text-white">For members</a><a href="#for-everyone" className="hover:text-white">For wholesale buyers</a><a href="#for-everyone" className="hover:text-white">For sellers</a></div></div>
            <div><h3 className="font-black text-white">Platform</h3><div className="mt-4 grid gap-3 text-sm text-emerald-50/65"><a href="#how-it-works" className="hover:text-white">How it works</a><a href="#trust" className="hover:text-white">Trust and controls</a><Link href="/signin" className="hover:text-white">Sign in</Link><Link href="/signup" className="hover:text-white">Create account</Link></div></div>
            <div><h3 className="font-black text-white">Legal & support</h3><div className="mt-4 grid gap-3 text-sm text-emerald-50/65"><Link href="/privacy" className="hover:text-white">Privacy policy</Link><Link href="/terms" className="hover:text-white">Terms of service</Link><a href="mailto:support@ncdfcoop.com" className="hover:text-white">Contact support</a><Link href="/forgot-password" className="hover:text-white">Recover account</Link></div></div>
          </div>
          <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-emerald-50/50 sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} CoopX. All rights reserved.</p><p>Powering the agri value chain.</p></div>
        </div>
      </footer>
    </div>
  );
}
