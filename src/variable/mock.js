// Mock data for development

export const mockCategories = [
  {
    id: 1,
    name: 'Electronics',
    description: 'Electronic devices and gadgets',
    categoryID: 1
  },
  {
    id: 2,
    name: 'Clothing',
    description: 'Apparel and fashion items',
    categoryID: 2
  },
  {
    id: 3,
    name: 'Home & Garden',
    description: 'Home and garden products',
    categoryID: 3
  },
  {
    id: 4,
    name: 'Sports',
    description: 'Sports and fitness equipment',
    categoryID: 4
  }
]

export const mockSubcategories = {
  1: [
    { id: 101, name: 'Phones', categoryID: 101 },
    { id: 102, name: 'Laptops', categoryID: 102 },
    { id: 103, name: 'Accessories', categoryID: 103 }
  ],
  2: [
    { id: 201, name: 'Men', categoryID: 201 },
    { id: 202, name: 'Women', categoryID: 202 },
    { id: 203, name: 'Kids', categoryID: 203 }
  ],
  3: [
    { id: 301, name: 'Furniture', categoryID: 301 },
    { id: 302, name: 'Decor', categoryID: 302 }
  ],
  4: [
    { id: 401, name: 'Equipment', categoryID: 401 },
    { id: 402, name: 'Clothing', categoryID: 402 }
  ]
}

export const mockProducts = [
  {
    id: 1,
    name: 'Wireless Headphones Pro',
    price: 199.99,
    category: 'Electronics',
    description: 'Premium wireless headphones with active noise cancellation and 30-hour battery life. Perfect for music lovers and professionals.',
    color: 'Black',
    stock: 25,
    img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
    properties: {
      brand: 'TechBrand',
      country: 'Japan',
      material: 'Aluminum & Plastic',
      weight: '250g'
    }
  },
  {
    id: 2,
    name: 'Smartphone X12',
    price: 899.99,
    category: 'Electronics',
    description: 'Latest flagship smartphone with 5G connectivity, 120Hz display, and powerful processor. Includes dual camera system.',
    color: 'Silver',
    stock: 15,
    img: 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=500&h=500&fit=crop',
    properties: {
      brand: 'PhoneMake',
      country: 'South Korea',
      material: 'Glass & Metal',
      weight: '180g'
    }
  },
  {
    id: 3,
    name: 'Ultra Book 15"',
    price: 1299.99,
    category: 'Electronics',
    description: 'Lightweight ultrabook with Intel Core i7, 16GB RAM, and SSD storage. Perfect for professionals and creatives.',
    color: 'Space Gray',
    stock: 8,
    img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop',
    properties: {
      brand: 'ComputerCo',
      country: 'USA',
      material: 'Aluminum',
      weight: '1.3kg'
    }
  },
  {
    id: 4,
    name: 'Classic T-Shirt',
    price: 29.99,
    category: 'Clothing',
    description: 'Comfortable and durable classic t-shirt made from 100% organic cotton. Available in multiple colors.',
    color: 'White',
    stock: 120,
    img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop',
    properties: {
      brand: 'FashionLine',
      country: 'Vietnam',
      material: '100% Organic Cotton',
      weight: '150g'
    }
  },
  {
    id: 5,
    name: 'Denim Jeans',
    price: 79.99,
    category: 'Clothing',
    description: 'Premium denim jeans with perfect fit and timeless style. Machine washable and fade-resistant.',
    color: 'Blue',
    stock: 45,
    img: 'https://images.unsplash.com/photo-1542272604-787c62d465d1?w=500&h=500&fit=crop',
    properties: {
      brand: 'DenimBrand',
      country: 'Turkey',
      material: '100% Denim',
      weight: '600g'
    }
  },
  {
    id: 6,
    name: 'Modern Sofa',
    price: 599.99,
    category: 'Home & Garden',
    description: 'Sleek and comfortable modern sofa with high-quality upholstery. Available in multiple colors and sizes.',
    color: 'Gray',
    stock: 5,
    img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&h=500&fit=crop',
    properties: {
      brand: 'FurniturePro',
      country: 'Sweden',
      material: 'Fabric & Wood',
      weight: '80kg'
    }
  },
  {
    id: 7,
    name: 'LED Desk Lamp',
    price: 49.99,
    category: 'Home & Garden',
    description: 'Energy-efficient LED desk lamp with adjustable brightness and color temperature. USB powered.',
    color: 'Black',
    stock: 60,
    img: 'https://images.unsplash.com/photo-1565173666747-252f520d89df?w=500&h=500&fit=crop',
    properties: {
      brand: 'LightTech',
      country: 'China',
      material: 'Plastic & Metal',
      weight: '300g'
    }
  },
  {
    id: 8,
    name: 'Yoga Mat',
    price: 34.99,
    category: 'Sports',
    description: 'Premium yoga mat made from eco-friendly materials. Non-slip surface and excellent cushioning.',
    color: 'Purple',
    stock: 40,
    img: 'https://images.unsplash.com/photo-1506241537724-a28219c75330?w=500&h=500&fit=crop',
    properties: {
      brand: 'YogaPro',
      country: 'India',
      material: 'Natural Rubber',
      weight: '1.5kg'
    }
  },
  {
    id: 9,
    name: 'Running Shoes',
    price: 119.99,
    category: 'Sports',
    description: 'Professional running shoes with advanced cushioning technology and lightweight design. Ideal for marathon training.',
    color: 'Red',
    stock: 35,
    img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop',
    properties: {
      brand: 'SportShoe',
      country: 'Indonesia',
      material: 'Mesh & Rubber',
      weight: '280g'
    }
  },
  {
    id: 10,
    name: 'Dumbbells Set',
    price: 89.99,
    category: 'Sports',
    description: 'Complete dumbbells set with 5 pairs ranging from 1kg to 5kg. Includes storage rack.',
    color: 'Black',
    stock: 12,
    img: 'https://images.unsplash.com/photo-1598289407206-37e8c3ce5a8f?w=500&h=500&fit=crop',
    properties: {
      brand: 'FitGear',
      country: 'Germany',
      material: 'Rubber Coated Metal',
      weight: '30kg'
    }
  }
]

export const mockCatalogs = mockProducts.map(p => ({
  id: p.id,
  name: p.name,
  categoryId: p.id,
  price: p.price
}))

export const mockWishlist = [
  { id: 1, productId: 1 },
  { id: 2, productId: 5 }
]

export const mockCart = [
  {
    id: 1,
    productId: 1,
    name: 'Wireless Headphones Pro',
    price: 199.99,
    quantity: 1,
    img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop'
  }
]

export const mockUserProfile = {
  id: '12345',
  name: 'John Doe',
  phone: '+1234567890',
  email: 'john.doe@example.com',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop',
  loyaltyPoints: 1250,
  tier: 'Gold'
}

export const mockReceipts = [
  {
    id: 1,
    date: '2024-01-20',
    total: 299.98,
    items: 2,
    store: 'Main Store'
  },
  {
    id: 2,
    date: '2024-01-15',
    total: 79.99,
    items: 1,
    store: 'Downtown Store'
  },
  {
    id: 3,
    date: '2024-01-10',
    total: 1299.99,
    items: 1,
    store: 'Tech Hub'
  }
]

// Helper to get mock product by ID
export function getMockProductById(id) {
  return mockProducts.find(p => p.id === parseInt(id))
}

// Helper to get mock categories with subcategories
export function getMockCategoryWithSubcategories(categoryId) {
  return {
    ...mockCategories.find(c => c.id === parseInt(categoryId)),
    subcategories: mockSubcategories[categoryId] || []
  }
}

// Helper to get products by category
export function getMockProductsByCategory(categoryId) {
  if (!categoryId) return mockProducts
  const categoryName = mockCategories.find(c => c.id === parseInt(categoryId))?.name
  return mockProducts.filter(p => p.category === categoryName)
}
