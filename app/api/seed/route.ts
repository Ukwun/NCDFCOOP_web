import { NextRequest, NextResponse } from 'next/server';
import {
  Timestamp,
  collection,
  getDocs,
  deleteDoc,
  addDoc,
} from 'firebase/firestore';
import { getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Initialize Firebase for server-side use
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function POST(request: NextRequest) {
  try {
    // Verify db is initialized
    if (!db) {
      return NextResponse.json(
        { error: 'Database not initialized' },
        { status: 500 }
      );
    }

    // Check authorization header (simple protection)
    const auth = request.headers.get('authorization');
    if (auth !== 'Bearer seed-key-coop-2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Clear existing products and offers
    const productsRef = collection(db, 'products');
    const productsSnapshot = await getDocs(productsRef);
    for (const doc of productsSnapshot.docs) {
      await deleteDoc(doc.ref);
    }

    const offersRef = collection(db, 'offers');
    const offersSnapshot = await getDocs(offersRef);
    for (const doc of offersSnapshot.docs) {
      await deleteDoc(doc.ref);
    }

    // Add sample products
    const products = [
      {
        name: 'Fresh Tomatoes (1kg)',
        description: 'Farm-fresh, organic tomatoes delivered weekly',
        price: 1200,
        category: 'vegetables',
        sellerId: 'seed-seller-1',
        image: '/images/products/tomatoes.jpg',
        stock: 500,
        rating: 4.5,
        reviews: 128,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      {
        name: 'Premium Grains Mix (5kg)',
        description: 'Bulk grain package - rice, millet, sorghum blend',
        price: 3500,
        category: 'grains',
        sellerId: 'seed-seller-2',
        image: '/images/products/grains.jpg',
        stock: 200,
        rating: 4.8,
        reviews: 256,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      {
        name: 'Organic Leafy Greens Bundle',
        description: 'Spinach, kale, lettuce - fresh from farm',
        price: 1800,
        category: 'vegetables',
        sellerId: 'seed-seller-1',
        image: '/images/products/greens.jpg',
        stock: 300,
        rating: 4.7,
        reviews: 89,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      {
        name: 'Carrots & Root Vegetables (2kg)',
        description: 'Mixed root vegetables - carrots, beetroot, parsnips',
        price: 1500,
        category: 'vegetables',
        sellerId: 'seed-seller-3',
        image: '/images/products/carrots.jpg',
        stock: 400,
        rating: 4.6,
        reviews: 145,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      {
        name: 'Premium Palm Oil (5L)',
        description: 'Cold-pressed, pure palm oil for cooking',
        price: 4500,
        category: 'oils',
        sellerId: 'seed-seller-4',
        image: '/images/products/palm-oil.jpg',
        stock: 150,
        rating: 4.9,
        reviews: 312,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      {
        name: 'Dried Chili Peppers (500g)',
        description: 'Premium quality dried peppers for traditional cooking',
        price: 2200,
        category: 'spices',
        sellerId: 'seed-seller-5',
        image: '/images/products/chili.jpg',
        stock: 250,
        rating: 4.4,
        reviews: 76,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      {
        name: 'Cassava Flour (10kg)',
        description: 'Processed cassava flour - traditional Nigerian staple',
        price: 3200,
        category: 'grains',
        sellerId: 'seed-seller-2',
        image: '/images/products/cassava.jpg',
        stock: 180,
        rating: 4.7,
        reviews: 134,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      {
        name: 'Pure Honey (1kg)',
        description: 'Raw, unfiltered honey from local beekeepers',
        price: 5500,
        category: 'honey',
        sellerId: 'seed-seller-6',
        image: '/images/products/honey.jpg',
        stock: 120,
        rating: 4.9,
        reviews: 201,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
    ];

    for (const product of products) {
      await addDoc(productsRef, product);
    }

    // Add sample offers
    const now = Timestamp.now();
    const tomorrow = Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
    const nextWeek = Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

    const offers = [
      {
        title: 'Fresh Vegetables Bundle - 30% Off',
        description: 'Save ₦2,500 on fresh farm produce this week',
        discount: 30,
        status: 'active',
        startDate: now,
        endDate: nextWeek,
        targetTier: 'member',
        code: 'VEGGIES30',
        minPurchase: 5000,
      },
      {
        title: 'Premium Grains Bulk Discount - 25% Off',
        description: 'Buy in bulk at wholesale rates',
        discount: 25,
        status: 'active',
        startDate: now,
        endDate: nextWeek,
        targetTier: 'wholesale',
        code: 'GRAINS25',
        minPurchase: 10000,
      },
      {
        title: 'Double Loyalty Points Weekend',
        description: 'Earn 2 loyalty points for every ₦1 spent (Friday-Sunday)',
        discount: 100,
        status: 'active',
        startDate: now,
        endDate: tomorrow,
        targetTier: 'member',
        code: 'DOUBLE2X',
      },
      {
        title: 'Free Shipping on Orders ₦5,000+',
        description: 'No delivery charges for orders over ₦5,000 this week',
        discount: 0,
        status: 'active',
        startDate: now,
        endDate: nextWeek,
        targetTier: 'member',
        code: 'FREESHIP',
        minPurchase: 5000,
      },
      {
        title: 'New Member Welcome Bonus - 15% Off',
        description: 'Welcome to NCDFCOOP! Get 15% off your first order',
        discount: 15,
        status: 'active',
        startDate: now,
        endDate: nextWeek,
        targetTier: 'member',
        code: 'WELCOME15',
        minPurchase: 2000,
      },
    ];

    for (const offer of offers) {
      await addDoc(offersRef, offer);
    }

    return NextResponse.json({
      success: true,
      message: 'Seeded data successfully',
      products: products.length,
      offers: offers.length,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
