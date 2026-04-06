/**
 * Testing Utilities
 * Helpers and utilities for testing
 */

import React from 'react'
import { render, RenderOptions } from '@testing-library/react'

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Mock data generators
export const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
  emailVerified: false,
  isAnonymous: false,
  metadata: {
    creationTime: new Date().toISOString(),
    lastSignInTime: new Date().toISOString(),
  },
  providerData: [],
}

export const mockProduct = {
  id: 'prod-001',
  name: 'Test Product',
  description: 'Test product description',
  price: 5000,
  originalPrice: 6000,
  category: 'Fresh Produce',
  subcategory: 'Vegetables',
  images: ['image1.jpg', 'image2.jpg'],
  thumbnail: 'thumb.jpg',
  stock: 100,
  sellerId: 'seller-001',
  sellerName: 'Test Seller',
  rating: 4.5,
  reviews: 10,
  minOrder: 1,
  maxOrder: 100,
  unit: 'kg',
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const mockOrder = {
  id: 'order-001',
  userId: 'test-user-id',
  sellerId: 'seller-001',
  items: [
    {
      productId: 'prod-001',
      productName: 'Test Product',
      quantity: 2,
      price: 5000,
      image: 'image.jpg',
    },
  ],
  subtotal: 10000,
  tax: 750,
  shipping: 500,
  total: 11250,
  status: 'pending',
  paymentMethod: 'paystack',
  shippingAddress: '123 Test Street',
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const mockCart = {
  userId: 'test-user-id',
  items: [
    {
      id: 'cart-item-001',
      userId: 'test-user-id',
      productId: 'prod-001',
      productName: 'Test Product',
      quantity: 2,
      price: 5000,
      image: 'image.jpg',
      addedAt: new Date(),
    },
  ],
  subtotal: 10000,
  tax: 750,
  shipping: 500,
  total: 11250,
  updatedAt: new Date(),
}

// Async test helper
export const waitForElement = (callback: () => any, options?: { timeout?: number }) => {
  const timeout = options?.timeout || 1000
  const startTime = Date.now()

  return new Promise((resolve, reject) => {
    const checkElement = () => {
      try {
        const element = callback()
        resolve(element)
      } catch (error) {
        if (Date.now() - startTime > timeout) {
          reject(error)
        } else {
          setTimeout(checkElement, 50)
        }
      }
    }
    checkElement()
  })
}

// API mock helper
export const mockApiResponse = (data: any, status = 200, delay = 0) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ok: status === 200,
        status,
        json: async () => data,
      })
    }, delay)
  })
}
