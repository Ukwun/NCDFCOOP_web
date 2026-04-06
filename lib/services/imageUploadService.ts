/**
 * Firebase Storage Image Upload Service
 * Handles product image uploads, optimization, and management
 */

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { ErrorHandler } from '@/lib/error/errorHandler';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Image upload service
 */
export const imageUploadService = {
  /**
   * Compress image before upload
   */
  async compressImage(file: File, maxWidth = 2048, maxHeight = 2048): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions maintaining aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to create canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }
              resolve(blob);
            },
            file.type,
            0.8 // Quality
          );
        };

        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };

        if (event.target?.result) {
          img.src = event.target.result as string;
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  },

  /**
   * Upload product image to Firebase Storage
   */
  async uploadProductImage(
    file: File,
    productId: string,
    imageIndex: number,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    try {
      if (!storage) {
        throw new Error('Storage not initialized');
      }

      // Validate file
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid image type. Please use JPG, PNG, or WebP');
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('Image size exceeds 10MB limit');
      }

      // Compress image
      const compressedBlob = await this.compressImage(file);

      // Create file reference
      const timestamp = Date.now();
      const fileName = `${productId}-${imageIndex}-${timestamp}.${
        file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp'
      }`;

      const storageRef = ref(storage, `product-images/${productId}/${fileName}`);

      // Upload file
      const metadata = {
        contentType: file.type,
        customMetadata: {
          uploadedAt: new Date().toISOString(),
          productId: productId,
        },
      };

      const snapshot = await uploadBytes(storageRef, compressedBlob, metadata);

      // Report progress
      if (onProgress) {
        onProgress({
          loaded: file.size,
          total: file.size,
          percentage: 100,
        });
      }

      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      ErrorHandler.logError(
        'IMAGE_UPLOAD_SUCCESS',
        `Image uploaded: ${fileName}`,
        'info'
      );

      return downloadURL;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      ErrorHandler.logError('IMAGE_UPLOAD_FAILED', errorMessage, 'error');
      throw error;
    }
  },

  /**
   * Upload multiple product images
   */
  async uploadProductImages(
    files: File[],
    productId: string,
    onProgress?: (index: number, progress: UploadProgress) => void
  ): Promise<string[]> {
    try {
      const urls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const url = await this.uploadProductImage(
          files[i],
          productId,
          i,
          (progress) => {
            if (onProgress) {
              onProgress(i, progress);
            }
          }
        );
        urls.push(url);
      }

      return urls;
    } catch (error) {
      ErrorHandler.logError('IMAGE_BATCH_UPLOAD', String(error), 'error');
      throw error;
    }
  },

  /**
   * Delete product image from storage
   */
  async deleteProductImage(imageUrl: string): Promise<void> {
    try {
      if (!storage) {
        throw new Error('Storage not initialized');
      }

      // Extract path from URL
      const decodedUrl = decodeURIComponent(imageUrl);
      const pathMatch = decodedUrl.match(/\/o\/(.*?)\?/);

      if (!pathMatch || !pathMatch[1]) {
        throw new Error('Invalid image URL');
      }

      const imagePath = pathMatch[1];
      const imageRef = ref(storage, imagePath);

      await deleteObject(imageRef);

      ErrorHandler.logError(
        'IMAGE_DELETE_SUCCESS',
        `Image deleted: ${imagePath}`,
        'info'
      );
    } catch (error) {
      ErrorHandler.logError('IMAGE_DELETE_FAILED', String(error), 'error');
      throw error;
    }
  },

  /**
   * Delete multiple product images
   */
  async deleteProductImages(imageUrls: string[]): Promise<void> {
    try {
      for (const url of imageUrls) {
        await this.deleteProductImage(url);
      }
    } catch (error) {
      ErrorHandler.logError('IMAGE_BATCH_DELETE', String(error), 'error');
      throw error;
    }
  },

  /**
   * Validate image file before upload
   */
  validateImage(file: File): { valid: boolean; error?: string } {
    // Check type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid image format. Please use JPG, PNG, or WebP',
      };
    }

    // Check size
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'Image size exceeds 10MB limit',
      };
    }

    // Check name
    if (!file.name || file.name.length === 0) {
      return {
        valid: false,
        error: 'File name is required',
      };
    }

    return { valid: true };
  },

  /**
   * Get file preview before upload
   */
  getImagePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  },
};

export default imageUploadService;
