// Product catalog types and interfaces

import { Timestamp } from 'firebase/firestore';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number; // For discounts
  category: string;
  subcategory?: string;
  images: string[];
  thumbnail?: string;
  stock: number;
  sellerId: string;
  sellerName?: string;
  rating?: number;
  reviews?: number;
  minOrder?: number;
  maxOrder?: number;
  unit?: string; // e.g., "kg", "per piece", "per carton"
  weight?: number; // in kg
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  tags?: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  isActive?: boolean;
  isFeatured?: boolean;
  discount?: number; // percentage
  wholesalePrice?: number;
  bulkPrices?: BulkPrice[];
  attributes?: ProductAttribute[];
  certifications?: string[];
  warranty?: string;
  returnPolicy?: string;
  shippingInfo?: ShippingInfo;
}

export interface BulkPrice {
  minQuantity: number;
  maxQuantity?: number;
  price: number;
}

export interface ProductAttribute {
  name: string;
  value: string;
}

export interface ShippingInfo {
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  shippingCost: number;
  deliveryDays: {
    min: number;
    max: number;
  };
  freeShippingThreshold?: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  image?: string;
  subcategories?: string[];
  productCount: number;
}

export interface ProductFilter {
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  inStock?: boolean;
  tags?: string[];
  search?: string;
  sortBy?: 'price-low' | 'price-high' | 'newest' | 'popular' | 'rating';
  limit?: number;
  offset?: number;
}

export interface ProductSearchResult {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  helpful: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CartItem {
  id?: string; // userId_productId
  userId?: string;
  productId: string;
  productName?: string;
  quantity: number;
  price: number;
  image?: string;
  addedAt: Timestamp;
  productData?: Product; // Optional full product data
}

export interface Cart {
  userId: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  updatedAt: Timestamp;
  expiresAt?: Timestamp;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number; // Total order amount including tax and shipping
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: 'flutterwave' | 'bank_transfer' | 'cash_on_delivery';
  shippingAddress: string; // JSON string of Address
  billingAddress?: string; // JSON string of Address
  paymentReference?: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  estimatedDelivery?: Timestamp;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal?: number;
  productImage?: string; // Optional product image URL
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded';

export interface Address {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface Seller {
  id: string;
  userId: string;
  storeName: string;
  storeDescription?: string;
  storeImage?: string;
  rating: number;
  reviews: number;
  productCount: number;
  followers: number;
  since: Date;
  isVerified: boolean;
  responseTime?: number; // in hours
  productQuality: number;
  shippingSpeed: number;
  sellerType: 'individual' | 'business' | 'franchise';
  certifications?: string[];
  about?: string;
}
