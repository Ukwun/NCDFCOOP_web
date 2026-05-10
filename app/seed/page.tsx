'use client';

import { useState } from 'react';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/lib/auth/authContext';
import { COLLECTIONS } from '@/lib/constants/database';

const SEED_PRODUCTS = [
  {
    id: 'prod_001_tomatoes',
    name: 'Fresh Tomatoes (1kg)',
    description: 'Farm-fresh, organic tomatoes delivered twice weekly from local farms. Perfect for salads and cooking.',
    price: 850, originalPrice: 1200, discount: 29, category: 'vegetables',
    stock: 245, maxOrder: 100, rating: 4.8, reviews: 324,
    images: ['https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=Fresh+Tomatoes'],
    thumbnail: 'https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=Fresh+Tomatoes',
    sellerName: 'Green Valley Farms', isFeatured: true, unit: 'kg',
  },
  {
    id: 'prod_002_grains',
    name: 'Premium Grains Mix (5kg)',
    description: 'Bulk grain package containing rice, millet, and sorghum. Certified organic.',
    price: 2500, originalPrice: 3800, discount: 34, category: 'grains',
    stock: 142, maxOrder: 50, rating: 4.9, reviews: 521,
    images: ['https://via.placeholder.com/400x400/D4A574/FFFFFF?text=Grain+Mix'],
    thumbnail: 'https://via.placeholder.com/400x400/D4A574/FFFFFF?text=Grain+Mix',
    sellerName: 'Agricultural Co-op', isFeatured: true, unit: 'kg',
  },
  {
    id: 'prod_003_greens',
    name: 'Organic Leafy Greens Bundle',
    description: 'Fresh spinach, kale, and lettuce bundle. Pesticide-free, hand-picked this morning.',
    price: 1200, originalPrice: 1800, discount: 33, category: 'vegetables',
    stock: 187, maxOrder: 100, rating: 4.7, reviews: 298,
    images: ['https://via.placeholder.com/400x400/52C41A/FFFFFF?text=Leafy+Greens'],
    thumbnail: 'https://via.placeholder.com/400x400/52C41A/FFFFFF?text=Leafy+Greens',
    sellerName: 'Green Valley Farms', unit: 'bundle',
  },
  {
    id: 'prod_004_roots',
    name: 'Carrots & Root Vegetables (2kg)',
    description: 'Mixed root vegetables including carrots, beetroot, parsnips, and yams.',
    price: 980, originalPrice: 1500, discount: 35, category: 'vegetables',
    stock: 203, maxOrder: 100, rating: 4.6, reviews: 412,
    images: ['https://via.placeholder.com/400x400/FA8C16/FFFFFF?text=Root+Veggies'],
    thumbnail: 'https://via.placeholder.com/400x400/FA8C16/FFFFFF?text=Root+Veggies',
    sellerName: 'Harvest Fresh', unit: 'kg',
  },
  {
    id: 'prod_005_palm_oil',
    name: 'Premium Palm Oil (5L)',
    description: 'Cold-pressed, unrefined premium palm oil. No additives. Perfect for cooking.',
    price: 3200, originalPrice: 4500, discount: 29, category: 'oils',
    stock: 89, maxOrder: 20, rating: 4.9, reviews: 645,
    images: ['https://via.placeholder.com/400x400/FFA940/FFFFFF?text=Palm+Oil'],
    thumbnail: 'https://via.placeholder.com/400x400/FFA940/FFFFFF?text=Palm+Oil',
    sellerName: 'Pure Oil Producers', isFeatured: true, unit: 'liter',
  },
  {
    id: 'prod_006_chili',
    name: 'Dried Chili Peppers (500g)',
    description: 'Premium quality sun-dried chili peppers. Authentic Nigerian spice for rich, bold flavors.',
    price: 1450, originalPrice: 2200, discount: 34, category: 'spices',
    stock: 156, maxOrder: 100, rating: 4.7, reviews: 289,
    images: ['https://via.placeholder.com/400x400/F5222D/FFFFFF?text=Chili+Peppers'],
    thumbnail: 'https://via.placeholder.com/400x400/F5222D/FFFFFF?text=Chili+Peppers',
    sellerName: 'Spice Masters', unit: 'g',
  },
  {
    id: 'prod_007_cassava',
    name: 'Fresh Cassava Flour (2kg)',
    description: 'Premium cassava flour milled fresh. Perfect for fufu, garri, and traditional delicacies.',
    price: 1650, originalPrice: 2400, discount: 31, category: 'grains',
    stock: 127, maxOrder: 50, rating: 4.6, reviews: 187,
    images: ['https://via.placeholder.com/400x400/FFCB69/FFFFFF?text=Cassava+Flour'],
    thumbnail: 'https://via.placeholder.com/400x400/FFCB69/FFFFFF?text=Cassava+Flour',
    sellerName: 'Agricultural Co-op', unit: 'kg',
  },
  {
    id: 'prod_008_eggs',
    name: 'Fresh Farm Eggs (Dozen)',
    description: 'Fresh farm eggs from free-range chickens. Collected daily. Rich golden yolks.',
    price: 890, originalPrice: 1200, discount: 26, category: 'dairy',
    stock: 298, maxOrder: 100, rating: 4.8, reviews: 521,
    images: ['https://via.placeholder.com/400x400/FFF566/333333?text=Fresh+Eggs'],
    thumbnail: 'https://via.placeholder.com/400x400/FFF566/333333?text=Fresh+Eggs',
    sellerName: 'Harvest Fresh', isFeatured: true, unit: 'dozen',
  },
  {
    id: 'prod_009_onions',
    name: 'Onions Bundle (3kg)',
    description: 'Golden, sweet onions. Perfect for all your cooking needs. No pesticides.',
    price: 750, originalPrice: 1100, discount: 32, category: 'vegetables',
    stock: 412, maxOrder: 100, rating: 4.5, reviews: 156,
    images: ['https://via.placeholder.com/400x400/DEB887/FFFFFF?text=Onions'],
    thumbnail: 'https://via.placeholder.com/400x400/DEB887/FFFFFF?text=Onions',
    sellerName: 'Green Valley Farms', unit: 'kg',
  },
  {
    id: 'prod_010_groundnuts',
    name: 'Premium Groundnuts (1kg)',
    description: 'Raw, high-quality groundnuts. High protein content. Perfect for snacking or cooking.',
    price: 2100, originalPrice: 3200, discount: 34, category: 'grains',
    stock: 203, maxOrder: 50, rating: 4.7, reviews: 334,
    images: ['https://via.placeholder.com/400x400/E6B800/FFFFFF?text=Groundnuts'],
    thumbnail: 'https://via.placeholder.com/400x400/E6B800/FFFFFF?text=Groundnuts',
    sellerName: 'Pure Oil Producers', unit: 'kg',
  },
  {
    id: 'prod_011_ginger_garlic',
    name: 'Ginger & Garlic Pack',
    description: 'Fresh ginger and garlic combo pack. Essential spices for every Nigerian kitchen.',
    price: 650, originalPrice: 950, discount: 32, category: 'spices',
    stock: 267, maxOrder: 100, rating: 4.6, reviews: 198,
    images: ['https://via.placeholder.com/400x400/BF8F00/FFFFFF?text=Ginger+Garlic'],
    thumbnail: 'https://via.placeholder.com/400x400/BF8F00/FFFFFF?text=Ginger+Garlic',
    sellerName: 'Spice Masters', unit: 'pack',
  },
  {
    id: 'prod_012_basmati',
    name: 'Basmati Rice (10kg)',
    description: 'Premium long-grain basmati rice. Aromatic, fluffy, and delicious. Best quality.',
    price: 4200, originalPrice: 6500, discount: 35, category: 'grains',
    stock: 78, maxOrder: 30, rating: 4.9, reviews: 612,
    images: ['https://via.placeholder.com/400x400/E8D5B7/FFFFFF?text=Basmati+Rice'],
    thumbnail: 'https://via.placeholder.com/400x400/E8D5B7/FFFFFF?text=Basmati+Rice',
    sellerName: 'Agricultural Co-op', isFeatured: true, unit: 'kg',
  },
];

export default function SeedPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  async function runSeed() {
    if (!user) {
      setStatus(['⚠️ You must be signed in to seed products.']);
      return;
    }

    setRunning(true);
    setDone(false);
    setStatus(['Starting seed...']);

    let count = 0;
    const errors: string[] = [];

    for (const product of SEED_PRODUCTS) {
      try {
        const docRef = doc(collection(db, COLLECTIONS.PRODUCTS), product.id);
        await setDoc(docRef, {
          ...product,
          sellerId: user.uid,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        count++;
        setStatus(prev => [...prev, `✅ ${product.name}`]);
      } catch (err: any) {
        const msg = `❌ ${product.name}: ${err?.message ?? 'Unknown error'}`;
        errors.push(msg);
        setStatus(prev => [...prev, msg]);
      }
    }

    setStatus(prev => [
      ...prev,
      '',
      `Done. ${count} products seeded, ${errors.length} failed.`,
    ]);
    setRunning(false);
    setDone(true);
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', maxWidth: 600 }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>🌱 Seed Products</h1>

      {!user && (
        <p style={{ color: 'orange' }}>
          ⚠️ Not signed in. <a href="/signin">Sign in first</a>, then return here.
        </p>
      )}

      {user && (
        <p style={{ marginBottom: '1rem', color: '#555' }}>
          Signed in as: <strong>{user.email}</strong> (uid: {user.uid})
        </p>
      )}

      <button
        onClick={runSeed}
        disabled={running || !user}
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: running ? '#aaa' : '#16a34a',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          cursor: running || !user ? 'not-allowed' : 'pointer',
          fontSize: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {running ? 'Seeding...' : done ? 'Seed Again' : 'Seed 12 Products'}
      </button>

      {done && (
        <p style={{ marginBottom: '1rem' }}>
          <a href="/products" style={{ color: '#2563eb' }}>→ View products catalog</a>
        </p>
      )}

      <div style={{ background: '#111', color: '#0f0', padding: '1rem', borderRadius: 6, minHeight: 100 }}>
        {status.map((line, i) => (
          <div key={i}>{line || '\u00A0'}</div>
        ))}
      </div>
    </div>
  );
}
