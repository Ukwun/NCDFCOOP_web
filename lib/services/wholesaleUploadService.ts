import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface WholesaleProductData {
  name: string;
  description: string;
  category: string;
  retailPrice: number;
  wholesalePrice: number;
  minOrderQuantity: number;
  unitOfMeasure: string;
  stockQuantity: number;
  images: string[];
  sellerId: string;
  type: 'retail' | 'wholesale' | 'both';
}

/**
 * Service to handle dual-type product uploads
 * Allows sellers to list products for both cooperative members (retail)
 * and institutional buyers (wholesale).
 */
export const uploadWholesaleProduct = async (productData: WholesaleProductData) => {
  try {
    const productRef = collection(db, 'products');
    
    const docData = {
      ...productData,
      status: 'pending', // Requires admin approval for real-world safety
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Intelligence metrics
      views: 0,
      salesCount: 0,
      rating: 0,
      reviewCount: 0
    };

    const docRef = await addDoc(productRef, docData);
    
    // Log activity for the intelligence system
    console.log(`Product ${docRef.id} uploaded as ${productData.type}`);
    
    return {
      success: true,
      id: docRef.id
    };
  } catch (error) {
    console.error("Error uploading wholesale product:", error);
    throw error;
  }
};