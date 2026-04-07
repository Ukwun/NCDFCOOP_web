import { collection, writeBatch, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/constants/database';

// Real product data for Nigeria's agricultural/grocery marketplace
const seedProducts = [
  {
    id: 'prod_001_tomatoes',
    name: 'Fresh Tomatoes (1kg)',
    description: 'Farm-fresh, organic tomatoes delivered twice weekly from local farms. Perfect for salads and cooking.',
    price: 850,
    originalPrice: 1200,
    discount: 29,
    category: 'vegetables',
    stock: 245,
    maxOrder: 100,
    rating: 4.8,
    reviews: 324,
    images: ['https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=Fresh+Tomatoes'],
    thumbnail: 'https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=Fresh+Tomatoes',
    sellerId: 'seller_green_valley',
    sellerName: 'Green Valley Farms',
    isFeatured: true,
    unit: 'kg',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
  },
  {
    id: 'prod_002_grains',
    name: 'Premium Grains Mix (5kg)',
    description: 'Bulk grain package containing rice, millet, and sorghum. Perfect for families. Certified organic.',
    price: 2500,
    originalPrice: 3800,
    discount: 34,
    category: 'grains',
    stock: 142,
    maxOrder: 50,
    rating: 4.9,
    reviews: 521,
    images: ['https://via.placeholder.com/400x400/D4A574/FFFFFF?text=Grain+Mix'],
    thumbnail: 'https://via.placeholder.com/400x400/D4A574/FFFFFF?text=Grain+Mix',
    sellerId: 'seller_agri_coop',
    sellerName: 'Agricultural Co-op',
    isFeatured: true,
    unit: 'kg',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)),
  },
  {
    id: 'prod_003_greens',
    name: 'Organic Leafy Greens Bundle',
    description: 'Fresh spinach, kale, and lettuce bundle. Pesticide-free, hand-picked this morning.',
    price: 1200,
    originalPrice: 1800,
    discount: 33,
    category: 'vegetables',
    stock: 187,
    maxOrder: 100,
    rating: 4.7,
    reviews: 298,
    images: ['https://via.placeholder.com/400x400/52C41A/FFFFFF?text=Leafy+Greens'],
    thumbnail: 'https://via.placeholder.com/400x400/52C41A/FFFFFF?text=Leafy+Greens',
    sellerId: 'seller_green_valley',
    sellerName: 'Green Valley Farms',
    unit: 'bundle',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)),
  },
  {
    id: 'prod_004_roots',
    name: 'Carrots & Root Vegetables (2kg)',
    description: 'Mixed root vegetables including carrots, beetroot, parsnips, and yams. Perfect for soups and stews.',
    price: 980,
    originalPrice: 1500,
    discount: 35,
    category: 'vegetables',
    stock: 203,
    maxOrder: 100,
    rating: 4.6,
    reviews: 412,
    images: ['https://via.placeholder.com/400x400/FA8C16/FFFFFF?text=Root+Veggies'],
    thumbnail: 'https://via.placeholder.com/400x400/FA8C16/FFFFFF?text=Root+Veggies',
    sellerId: 'seller_harvest_fresh',
    sellerName: 'Harvest Fresh',
    unit: 'kg',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)),
  },
  {
    id: 'prod_005_palm_oil',
    name: 'Premium Palm Oil (5L)',
    description: 'Cold-pressed, unrefined premium palm oil. No additives. Perfect for cooking and traditional dishes.',
    price: 3200,
    originalPrice: 4500,
    discount: 29,
    category: 'oils',
    stock: 89,
    maxOrder: 20,
    rating: 4.9,
    reviews: 645,
    images: ['https://via.placeholder.com/400x400/FFA940/FFFFFF?text=Palm+Oil'],
    thumbnail: 'https://via.placeholder.com/400x400/FFA940/FFFFFF?text=Palm+Oil',
    sellerId: 'seller_pure_oil',
    sellerName: 'Pure Oil Producers',
    isFeatured: true,
    unit: 'liter',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)),
  },
  {
    id: 'prod_006_chili',
    name: 'Dried Chili Peppers (500g)',
    description: 'Premium quality sun-dried chili peppers. Authentic Nigerian spice for rich, bold flavors.',
    price: 1450,
    originalPrice: 2200,
    discount: 34,
    category: 'spices',
    stock: 156,
    maxOrder: 100,
    rating: 4.7,
    reviews: 289,
    images: ['https://via.placeholder.com/400x400/F5222D/FFFFFF?text=Chili+Peppers'],
    thumbnail: 'https://via.placeholder.com/400x400/F5222D/FFFFFF?text=Chili+Peppers',
    sellerId: 'seller_spice_masters',
    sellerName: 'Spice Masters',
    unit: 'g',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)),
  },
  {
    id: 'prod_007_cassava',
    name: 'Fresh Cassava Flour (2kg)',
    description: 'Premium cassava flour milled fresh. Perfect for fufu, garri, and traditional delicacies.',
    price: 1650,
    originalPrice: 2400,
    discount: 31,
    category: 'grains',
    stock: 127,
    maxOrder: 50,
    rating: 4.6,
    reviews: 187,
    images: ['https://via.placeholder.com/400x400/FFCB69/FFFFFF?text=Cassava+Flour'],
    thumbnail: 'https://via.placeholder.com/400x400/FFCB69/FFFFFF?text=Cassava+Flour',
    sellerId: 'seller_agri_coop',
    sellerName: 'Agricultural Co-op',
    unit: 'kg',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
  },
  {
    id: 'prod_008_eggs',
    name: 'Fresh Farm Eggs (Dozen)',
    description: 'Fresh farm eggs from free-range chickens. Collected daily. Rich golden yolks.',
    price: 890,
    originalPrice: 1200,
    discount: 26,
    category: 'dairy',
    stock: 298,
    maxOrder: 100,
    rating: 4.8,
    reviews: 521,
    images: ['https://via.placeholder.com/400x400/FFF566/FFFFFF?text=Fresh+Eggs'],
    thumbnail: 'https://via.placeholder.com/400x400/FFF566/FFFFFF?text=Fresh+Eggs',
    sellerId: 'seller_harvest_fresh',
    sellerName: 'Harvest Fresh',
    isFeatured: true,
    unit: 'dozen',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
  },
  {
    id: 'prod_009_onions',
    name: 'Onions Bundle (3kg)',
    description: 'Golden, sweet onions. Perfect for all your cooking needs. No pesticides.',
    price: 750,
    originalPrice: 1100,
    discount: 32,
    category: 'vegetables',
    stock: 412,
    maxOrder: 100,
    rating: 4.5,
    reviews: 156,
    images: ['https://via.placeholder.com/400x400/DEB887/FFFFFF?text=Onions'],
    thumbnail: 'https://via.placeholder.com/400x400/DEB887/FFFFFF?text=Onions',
    sellerId: 'seller_green_valley',
    sellerName: 'Green Valley Farms',
    unit: 'kg',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)),
  },
  {
    id: 'prod_010_groundnuts',
    name: 'Premium Groundnuts (1kg)',
    description: 'Raw, high-quality groundnuts from the best farms. High protein content. Perfect for snacking or cooking.',
    price: 2100,
    originalPrice: 3200,
    discount: 34,
    category: 'grains',
    stock: 203,
    maxOrder: 50,
    rating: 4.7,
    reviews: 334,
    images: ['https://via.placeholder.com/400x400/E6B800/FFFFFF?text=Groundnuts'],
    thumbnail: 'https://via.placeholder.com/400x400/E6B800/FFFFFF?text=Groundnuts',
    sellerId: 'seller_pure_oil',
    sellerName: 'Pure Oil Producers',
    unit: 'kg',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)),
  },
  {
    id: 'prod_011_ginger_garlic',
    name: 'Ginger & Garlic Pack',
    description: 'Fresh ginger and garlic combo pack. Essential spices for every Nigerian kitchen.',
    price: 650,
    originalPrice: 950,
    discount: 32,
    category: 'spices',
    stock: 267,
    maxOrder: 100,
    rating: 4.6,
    reviews: 198,
    images: ['https://via.placeholder.com/400x400/BF8F00/FFFFFF?text=Ginger+Garlic'],
    thumbnail: 'https://via.placeholder.com/400x400/BF8F00/FFFFFF?text=Ginger+Garlic',
    sellerId: 'seller_spice_masters',
    sellerName: 'Spice Masters',
    unit: 'pack',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)),
  },
  {
    id: 'prod_012_basmati',
    name: 'Basmati Rice (10kg)',
    description: 'Premium long-grain basmati rice. Aromatic, fluffy, and delicious. Best quality.',
    price: 4200,
    originalPrice: 6500,
    discount: 35,
    category: 'grains',
    stock: 78,
    maxOrder: 30,
    rating: 4.9,
    reviews: 612,
    images: ['https://via.placeholder.com/400x400/E8D5B7/FFFFFF?text=Basmati+Rice'],
    thumbnail: 'https://via.placeholder.com/400x400/E8D5B7/FFFFFF?text=Basmati+Rice',
    sellerId: 'seller_agri_coop',
    sellerName: 'Agricultural Co-op',
    isFeatured: true,
    unit: 'kg',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)),
  },
];

export async function POST() {
  try {
    // Guard: Check if already seeded (prevent duplicates)
    // In production, you'd want better checks

    if (!db) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Firebase not initialized',
        }),
        { status: 500 }
      );
    }

    const batch = writeBatch(db);
    let addedCount = 0;

    // Add each product to Firestore
    for (const product of seedProducts) {
      const docRef = doc(collection(db, COLLECTIONS.PRODUCTS), product.id);
      batch.set(docRef, product);
      addedCount++;
    }

    // Commit the batch
    await batch.commit();

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully seeded ${addedCount} products to Firestore`,
        productsAdded: addedCount,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Seed data error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
