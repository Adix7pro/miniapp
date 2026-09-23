// Development utilities for easy mocking
import * as mockData from './mock.js'

const isDevelopment = import.meta.env.DEV
const useMockData = localStorage.getItem('useMockData') === 'true' || isDevelopment

/**
 * Enable mock data mode (persists in localStorage)
 */
export function enableMockMode() {
  localStorage.setItem('useMockData', 'true')
  console.log('✓ Mock mode enabled. Reload page to apply.')
}

/**
 * Disable mock data mode
 */
export function disableMockMode() {
  localStorage.setItem('useMockData', 'false')
  console.log('✓ Mock mode disabled. Reload page to apply.')
}

/**
 * Check if currently using mock data
 */
export function isMockMode() {
  return useMockData
}

/**
 * Mock API response with delay
 */
export function createMockResponse(data, delay = 500) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: {
          data: Array.isArray(data) ? data : data,
          success: true,
          message: 'Mock data'
        },
        status: 200
      })
    }, delay)
  })
}

/**
 * Get mock categories
 */
export function getMockCategories() {
  return createMockResponse(mockData.mockCategories)
}

/**
 * Get mock subcategories for a category
 */
export function getMockSubcategories(categoryId) {
  const subs = mockData.mockSubcategories[categoryId] || []
  return createMockResponse(subs)
}

/**
 * Get mock product by ID
 */
export function getMockProduct(productId) {
  const product = mockData.getMockProductById(productId)
  return createMockResponse(product || mockData.mockProducts[0])
}

/**
 * Get mock products by category
 */
export function getMockProductsByCategory(categoryId) {
  const products = mockData.getMockProductsByCategory(categoryId)
  return createMockResponse(products)
}

/**
 * Get all mock products
 */
export function getMockAllProducts() {
  return createMockResponse(mockData.mockProducts)
}

/**
 * Get mock wishlist
 */
export function getMockWishlist() {
  return createMockResponse(mockData.mockWishlist)
}

/**
 * Get mock cart
 */
export function getMockCart() {
  return createMockResponse(mockData.mockCart)
}

/**
 * Get mock user profile
 */
export function getMockProfile() {
  return createMockResponse(mockData.mockUserProfile)
}

/**
 * Get mock receipts
 */
export function getMockReceipts() {
  return createMockResponse(mockData.mockReceipts)
}

// Log mock data availability
console.log(`%c📋 Mock Data System`, 'color: #ff5722; font-weight: bold; font-size: 14px')
console.log(`Development Mode: ${isDevelopment ? '✓ ON' : '✗ OFF'}`)
console.log(`Mock Data Active: ${useMockData ? '✓ ON' : '✗ OFF'}`)
console.log(`Commands:`)
console.log(`  window.enableMockMode() - Enable mock data`)
console.log(`  window.disableMockMode() - Disable mock data`)
console.log(`  window.isMockMode() - Check mock status`)
console.log(`  import * as mockDev from '@/variable/mockDev.js'`)

// Expose to window for console testing
if (isDevelopment) {
  window.enableMockMode = enableMockMode
  window.disableMockMode = disableMockMode
  window.isMockMode = isMockMode
  window.mockData = mockData
}
