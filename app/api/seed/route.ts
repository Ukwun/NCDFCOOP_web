import { NextRequest, NextResponse } from 'next/server';
import { Timestamp, collection, getDocs, deleteDoc, doc, addDoc, getFirestore, query } from 'firebase/firestore';
import { getApps, initializeApp } from 'firebase/app';

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get('authorization');
    if (auth !== 'Bearer seed-key-coop-2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize Firebase client SDK for server-side use
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

    // Delete existing products
    const productsRef = collection(db, 'products');
    const productsSnapshot = await getDocs(productsRef);
    for (const docSnap of productsSnapshot.docs) {
      await deleteDoc(doc(db, 'products', docSnap.id));
    }

    // Delete existing offers
    const offersRef = collection(db, 'offers');
    const offersSnapshot = await getDocs(offersRef);
    for (const docSnap of offersSnapshot.docs) {
      await deleteDoc(doc(db, 'offers', docSnap.id));
    }

    const products = [
      {
        name: 'Fresh Tomatoes (1kg)',
        description: 'Farm-fresh, organic tomatoes delivered weekly',
        price: 1200,
        originalPrice: 1500,
        discount: 20,
        category: 'vegetables',
        sellerId: 'ncdf-seller',
        sellerName: 'NCDF Direct',
        thumbnail: '/images/products/tomatoes.jpg',
        images: ['/images/products/tomatoes.jpg'],
        stock: 500,
        rating: 4.5,
        reviews: 128,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'Premium Grains Mix (5kg)',
        description: 'Bulk grain package - rice, millet, sorghum blend',
        price: 3500,
        originalPrice: 4200,
        discount: 17,
        category: 'grains',
        sellerId: 'coop-seller-1',
        sellerName: 'Grain Cooperative',
        thumbnail: '/images/products/grains.jpg',
        images: ['/images/products/grains.jpg'],
        stock: 200,
        rating: 4.8,
        reviews: 256,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'Organic Leafy Greens Bundle',
        description: 'Spinach, kale, lettuce - fresh from farm',
        price: 1800,
        originalPrice: 2200,
        discount: 18,
        category: 'vegetables',
        sellerId: 'ncdf-seller',
        sellerName: 'NCDF Direct',
        thumbnail: '/images/products/greens.jpg',
        images: ['/images/products/greens.jpg'],
        stock: 300,
        rating: 4.7,
        reviews: 89,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'Carrots & Root Vegetables (2kg)',
        description: 'Mixed root vegetables - carrots, beetroot, parsnips',
        price: 1500,
        originalPrice: 1900,
        discount: 21,
        category: 'vegetables',
        sellerId: 'farm-seller-1',
        sellerName: 'Farm Fresh Supplies',
        thumbnail: '/images/products/carrots.jpg',
        images: ['/images/products/carrots.jpg'],
        stock: 400,
        rating: 4.6,
        reviews: 145,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'Premium Palm Oil (5L)',
        description: 'Cold-pressed, pure palm oil for cooking',
        price: 4500,
        originalPrice: 5200,
        discount: 13,
        category: 'oils',
        sellerId: 'oil-cooperative',
        sellerName: 'Oil Farmers Cooperative',
        thumbnail: '/images/products/palm-oil.jpg',
        images: ['/images/products/palm-oil.jpg'],
        stock: 150,
        rating: 4.9,
        reviews: 312,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'Dried Chili Peppers (500g)',
        description: 'Premium quality dried peppers for traditional cooking',
        price: 2200,
        originalPrice: 2800,
        discount: 21,
        category: 'spices',
        sellerId: 'spice-market',
        sellerName: 'Spice Market Traders',
        thumbnail: '/images/products/chili.jpg',
        images: ['/images/products/chili.jpg'],
        stock: 250,
        rating: 4.4,
        reviews: 76,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'Cassava Flour (10kg)',
        description: 'Processed cassava flour - traditional Nigerian staple',
        price: 3200,
        originalPrice: 3800,
        discount: 16,
        category: 'grains',
        sellerId: 'coop-seller-1',
        sellerName: 'Grain Cooperative',
        thumbnail: '/images/products/cassava.jpg',
        images: ['/images/products/cassava.jpg'],
        stock: 180,
        rating: 4.7,
        reviews: 134,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'Pure Honey (1kg)',
        description: 'Raw, unfiltered honey from local beekeepers',
        price: 5500,
        originalPrice: 6500,
        discount: 15,
        category: 'honey',
        sellerId: 'beekeepers-collective',
        sellerName: 'Beekeepers Collective',
        thumbnail: '/images/products/honey.jpg',
        images: ['/images/products/honey.jpg'],
        stock: 120,
        rating: 4.9,
        reviews: 201,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    let productsAdded = 0;
    for (const product of products) {
      await addDoc(collection(db, 'products'), product);
      productsAdded++;
    }

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const offers = [
      {
        title: 'Fresh Vegetables Bundle - 30% Off',
        description: 'Save N2,500 on fresh farm produce this week',
        discount: 30,
        status: 'active',
        startDate: now.toISOString(),
        endDate: nextWeek.toISOString(),
        targetTier: 'member',
        code: 'VEGGIES30',
        minPurchase: 5000,
      },
      {
        title: 'Premium Grains Bulk Discount - 25% Off',
        description: 'Buy in bulk at wholesale rates',
        discount: 25,
        status: 'active',
        startDate: now.toISOString(),
        endDate: nextWeek.toISOString(),
        targetTier: 'wholesale',
        code: 'GRAINS25',
        minPurchase: 10000,
      },
      {
        title: 'Double Loyalty Points Weekend',
        description: 'Earn 2 loyalty points for every N1 spent (Friday-Sunday)',
        discount: 100,
        status: 'active',
        startDate: now.toISOString(),
        endDate: tomorrow.toISOString(),
        targetTier: 'member',
        code: 'DOUBLE2X',
      },
      {
        title: 'Free Shipping on Orders N5,000+',
        description: 'No delivery charges for orders over N5,000 this week',
        discount: 0,
        status: 'active',
        startDate: now.toISOString(),
        endDate: nextWeek.toISOString(),
        targetTier: 'member',
        code: 'FREESHIP',
        minPurchase: 5000,
      },
      {
        title: 'New Member Welcome Bonus - 15% Off',
        description: 'Welcome to NCDFCOOP! Get 15% off your first order',
        discount: 15,
        status: 'active',
        startDate: now.toISOString(),
        endDate: nextWeek.toISOString(),
        targetTier: 'member',
        code: 'WELCOME15',
        minPurchase: 2000,
      },
    ];

    let offersAdded = 0;
    for (const offer of offers) {
      await addDoc(collection(db, 'offers'), offer);
      offersAdded++;
    }

    return NextResponse.json({
      success: true,
      message: 'Seeded data successfully',
      products: productsAdded,
      offers: offersAdded,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
