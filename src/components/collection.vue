<template>
  <div class="collections-container" :style="{ height: collections.length > 0 ? height : '0px' }">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <LoadingSpinner />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <button @click="fetchCollections" class="retry-btn">{{ $t('retry') || 'Qayta urinish' }}</button>
    </div>

    <!-- Collections List -->
    <div v-else-if="collections.length > 0" class="collections-list" :aria-disabled="!collections.length > 0">
      <div v-for="collection in collections" :key="collection.ID" class="collection-section">
        <!-- Collection Title -->
        <div class="collection-header">
            
          <h2 class="collection-title">{{ collection.name }}</h2>
          <span class="collection-badge">{{ Number(collection.items || 0) }}</span>
          <button 
            class="view-all-btn" 
            @click="goToCollection(collection.ID)"
          >
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>

        <!-- Carousel Container -->
        <div class="carousel-wrapper">
          <!-- Left Arrow -->
          <button 
            class="carousel-arrow left-arrow" 
            @click="scrollCarousel(collection.ID, -1)"
            :disabled="isAtStart(collection.ID)"
          >
            <i class="bi bi-chevron-left"></i>
          </button>

          <!-- Scrollable Products -->
          <div 
            class="carousel-container"
            :data-collection-id="collection.ID"
          >
            <div class="carousel-track">
              <!-- Products -->
              <div 
                v-for="(product, idx) in (collection.products || [])" 
                :key="product.id || idx"
                class="carousel-item"
              >
                <div class="product-image" @click="selectProduct(product)">
                  <img :src="product.img || '/placeholder.png'" :alt="product.name" />
                </div>
        <div class="product-info" @click="selectProduct(product)">
                  <div class="old-price">
                    
                  </div>
                  <h3 class="product-price" style="font-size: 20px;">{{ formatPrice(product.price) }} <span style="font-size: 10px;">UZS</span></h3>
                  <h3 v-if="product.oldPrice" class="product-price" style="font-size: 14px; text-decoration: line-through; color: #999;">
                      {{ formatPrice(product.oldPrice) }}
                    </h3>
                  <h3 class="product-name">{{ product.name }}</h3>
                </div>

                <!-- Quantity controls shown when item is already in cart -->
                <div v-if="(product.quantity || 0) > 0" class="qty-controls" :class="{ disabled: !product.stock || product.stock < 1 }" @click.stop>
                  <button
                    @click.stop="decreaseQty(product)"
                    :disabled="addingToCart[product.id] || (product.quantity || 0) <= 1"
                    aria-label="decrease"
                  >−</button>
                  <input
                    type="text"
                    v-model.number="product.quantity"
                    @change="onQtyInputChange(product)"
                    min="1"
                    disabled
                  />
                  <button
                    @click.stop="increaseQty(product)"
                    :disabled="addingToCart[product.id] || (product.quantity || 0) >= (product.stock || 9999)"
                    aria-label="increase"
                  >+</button>
                </div>

                <!-- Default: add-to-cart button -->
                <button 
                  v-else
                  class="cart-btn"
                  @click="addToCart(product, $event)"
                  :disabled="addingToCart[product.id] || !product.stock || product.stock < 1"
                  :title="$t('addToCart') || 'Savatga qo\'sh'"
                >
                  <i class="bi bi-cart-plus" style="font-size: 16px;"></i>
                </button>
              </div>
          </div>
          </div>

          <!-- Right Arrow -->
          <button 
            class="carousel-arrow right-arrow" 
            @click="scrollCarousel(collection.ID, 1)"
            :disabled="isAtEnd(collection.ID)"
          >
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && !error && collections.length === 0" class="empty-state">
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import LoadingSpinner from './LoadingSpinner.vue'
import { API } from '../variable/link.js'
import { getChatID } from '../variable/chat.js'
import Cart from '../lib/cart.js'

const router = useRouter()
const { t } = useI18n()

const collections = ref([])
const loading = ref(true)
const error = ref(null)
const carouselScrollPositions = ref({})
const PAGE_SIZE = 5

// Cart
const addingToCart = ref({})
const cartMap = ref({})

// Load current cart and build a productID=>quantity map so product lists can be decorated
const loadCartMap = async () => {
  try {
    const resp = await Cart.get()
    let items = []
    if (Array.isArray(resp)) {
      items = resp
    } else if (resp && Array.isArray(resp.data)) {
      items = resp.data
    } else if (resp && Array.isArray(resp.items)) {
      items = resp.items
    } else if (resp && Array.isArray(resp.products)) {
      items = resp.products.map(p => ({ id: p.ID || p.id, quantity: p.quantity || p.qty || 1 }))
    }

    const map = {}
    items.forEach(i => {
      const id = i.id || i.ID || i.productId || i.productID
      const qty = i.quantity || i.qty || i.count || 1
      if (id) map[String(id)] = Number(qty) || 1
    })

    cartMap.value = map

    // decorate already-loaded products (if any)
    collections.value.forEach(col => {
      if (Array.isArray(col.products)) {
        col.products.forEach(p => {
          const pid = p.id || p.ID || p.productId
          const q = cartMap.value[String(pid)]
          if (q) p.quantity = q
        })
      }
    })
  } catch (e) {
    console.warn('loadCartMap failed', e)
  }
} 

// Price formatter
const formatPrice = (price) => {
  const n = Number(price) || 0
  try {
    return price.toLocaleString( {  minimumFractionDigits: 0 })
  } catch (e) {
    return String(n)
  }
}



// Helper to normalize product payloads
const normalizeProductsPayload = (payload) => {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.data)) return payload.data
  if (Array.isArray(payload.result)) return payload.result
  return []
}

// Fetch collections from API
const fetchCollections = async () => {
  try {
    loading.value = true
    error.value = null

    const api = axios.create({
      baseURL: API.link,
      headers: {
        'Accept': 'application/json',
        'ngrok-skip-browser-warning': '1',
        'Authorization': 'Basic ' + btoa(`${API.username}:${API.password}`)
      }
    })

    const response = await api.get('/collection?chatID=' + getChatID())
    const payload = response.data

    // Normalize API response: accept either an array or an object with a data/result array
    if (Array.isArray(payload)) {
      collections.value = payload
    } else if (Array.isArray(payload?.data)) {
      collections.value = payload.data
    } else if (Array.isArray(payload?.result)) {
      collections.value = payload.result
    } else {
      collections.value = []
    }

    // Initialize scroll positions and pagination state
    if (Array.isArray(collections.value)) {
      collections.value.forEach(col => {
        carouselScrollPositions.value[col.ID] = 0
        // pagination meta
        col._page = 0
        col._loading = false
        col._hasMore = true
        if (!Array.isArray(col.products)) col.products = []
      })
    }

    console.log('Collections loaded:', collections.value)

    // Attach scroll listeners after DOM is rendered
    setTimeout(() => {
      attachScrollListeners()
      // fetch first page for each collection
      collections.value.forEach(col => {
        fetchCollectionProducts(col.ID, 1)
      })
    }, 100)
  } catch (err) {
    console.error('Error fetching collections:', err)
    error.value = err.response?.data?.message || t('errorLoadingCollections') || 'Kolleksiyalarni yuklashda xato'
  } finally {
    loading.value = false
  }
}

// Attach scroll listeners to carousels
const attachScrollListeners = () => {
  collections.value.forEach(col => {
    const container = document.querySelector(`[data-collection-id="${col.ID}"]`)
    if (!container) return

    const carousel = container.querySelector('.carousel-track')
    if (!carousel) return

    // Remove existing listener if any
    carousel.removeEventListener('scroll', null)

    // Throttled scroll handler
    let scrollTimeout
    const handleScroll = () => {
      carouselScrollPositions.value[col.ID] = carousel.scrollLeft

      // If near the end and more pages exist, load next page
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        const nearEnd = carousel.scrollLeft + carousel.offsetWidth >= carousel.scrollWidth - 50
        if (nearEnd && col._hasMore && !col._loading) {
          const nextPage = (col._page || 0) + 1
          fetchCollectionProducts(col.ID, nextPage)
        }
      }, 300)
    }

    carousel.addEventListener('scroll', handleScroll, { passive: true })
  })
}

// Fetch products for a collection with pagination
const fetchCollectionProducts = async (collectionId, page = 1) => {
  try {
    const col = collections.value.find(c => c.ID === collectionId)
    if (!col) {
      return
    }
    if (col._loading) {
      return
    }

    col._loading = true
    
    const api = axios.create({
      baseURL: API.link,
      headers: {
        'Accept': 'application/json',
        'ngrok-skip-browser-warning': '1',
        'Authorization': 'Basic ' + btoa(`${API.username}:${API.password}`)
      }
    })

    const resp = await api.get(`/collectionProducts?collectionID=${encodeURIComponent(collectionId)}&page=${page}&limit=${PAGE_SIZE}`)
    const productsPayload = resp.data
    let items = normalizeProductsPayload(productsPayload)
    
    // sanitize image URLs (replace backslashes with slashes) and attach cart quantity if present
    items = items.map(it => ({
      ...it,
      img: typeof it.img === 'string' ? it.img.replace(/\\/g, '/') : it.img,
      quantity: cartMap.value[String(it.id || it.ID || it.productId)] || it.quantity || 0
    }))

    // update products reactively - use Vue-friendly mutations
    if (!Array.isArray(col.products)) {
      col.products = []
    }
    
    if (page === 1) {
      // clear and replace for first page
      col.products.splice(0, col.products.length, ...items)
    } else {
      // append for subsequent pages
      col.products.push(...items)
    }
    
    col._page = page
    col._hasMore = items.length >= 1
    col._loading = false
    
    // Trigger reactivity by updating collections array
    collections.value = [...collections.value]
  } catch (e) {
    console.error('Error loading collection products for', collectionId, e)
    const col = collections.value.find(c => c.ID === collectionId)
    if (col) col._loading = false
  }
}

// Scroll carousel with better state tracking
const scrollCarousel = async (collectionId, direction) => {
  await nextTick()
  
  const container = document.querySelector(`[data-collection-id="${collectionId}"]`)
  if (!container) return

  const carousel = container.querySelector('.carousel-track')
  if (!carousel) return

  const itemWidth = carousel.querySelector('.carousel-item')?.offsetWidth || 170
  const gap = 16 // Updated gap size
  const scrollAmount = (itemWidth + gap) * 2 // scroll 2 items at a time

  carousel.scrollBy({
    left: scrollAmount * direction,
    behavior: 'smooth'
  })

  // Update state after scroll completes
  setTimeout(() => {
    carouselScrollPositions.value[collectionId] = carousel.scrollLeft
  }, 400)
}

// Check if carousel is at start with real-time check
const isAtStart = (collectionId) => {
  const container = document.querySelector(`[data-collection-id="${collectionId}"]`)
  if (!container) return true

  const carousel = container.querySelector('.carousel-track')
  if (!carousel) return true

  return carousel.scrollLeft <= 5
}

// Check if carousel is at end with real-time check
const isAtEnd = (collectionId) => {
  const container = document.querySelector(`[data-collection-id="${collectionId}"]`)
  if (!container) return false

  const carousel = container.querySelector('.carousel-track')
  if (!carousel) return false

  return carousel.scrollLeft + carousel.offsetWidth >= carousel.scrollWidth - 10
}

// Select product - navigate to product page
const selectProduct = (product) => {
  router.push(`/product/${product.id}`)
}

// Add to cart function + quantity helpers
const addToCart = async (product, event) => {
  event.stopPropagation()
  if (!product) return

  try {
    addingToCart.value[product.id] = true
    const productID = product.id || product.ID

    const resp = await Cart.add(productID)
    const qtyFromResp = resp && (resp.quantity ?? resp.qty) ? Number(resp.quantity ?? resp.qty) : ((Number(product.quantity) || 0) + 1)

    product.quantity = qtyFromResp
    cartMap.value[String(productID)] = product.quantity
    console.log('Added to cart:', productID, 'qty:', product.quantity)
  } catch (err) {
    console.error('Failed to add to cart:', err)
  } finally {
    addingToCart.value[product.id] = false
  }
}

const increaseQty = async (product) => {
  if (!product) return
  try {
    addingToCart.value[product.id] = true
    const resp = await Cart.add(product.id || product.ID)
    const qty = resp && (resp.quantity ?? resp.qty) ? Number(resp.quantity ?? resp.qty) : ((Number(product.quantity) || 0) + 1)
    product.quantity = qty
    cartMap.value[String(product.id || product.ID)] = product.quantity
  } catch (err) {
    console.error('Failed to increase qty:', err)
  } finally {
    addingToCart.value[product.id] = false
  }
}

const decreaseQty = async (product) => {
  if (!product) return
  try {
    addingToCart.value[product.id] = true
    if ((product.quantity || 0) > 1) {
      const resp = await Cart.delete(product.id || product.ID)
      const qty = resp && (resp.quantity ?? resp.qty) ? Number(resp.quantity ?? resp.qty) : ((Number(product.quantity) || 1) - 1)
      product.quantity = qty
      if (product.quantity <= 0) {
        delete product.quantity
        delete cartMap.value[String(product.id || product.ID)]
      } else {
        cartMap.value[String(product.id || product.ID)] = product.quantity
      }
    } else {
      await Cart.deleteProduct(product.id || product.ID)
      delete product.quantity
      delete cartMap.value[String(product.id || product.ID)]
    }
  } catch (err) {
    console.error('Failed to decrease qty:', err)
  } finally {
    addingToCart.value[product.id] = false
  }
}

const onQtyInputChange = async (product) => {
  if (!product) return
  let newQty = Number(product.quantity) || 1
  if (newQty < 1) newQty = 1
  const currentQty = Number(cartMap.value[String(product.id || product.ID)] || product.quantity || 0)
  const diff = newQty - currentQty
  if (diff === 0) return
  try {
    addingToCart.value[product.id] = true
    if (diff > 0) {
      for (let i = 0; i < diff; i++) await Cart.add(product.id || product.ID)
    } else {
      for (let i = 0; i < Math.abs(diff); i++) await Cart.delete(product.id || product.ID)
    }
    await loadCartMap()
  } catch (err) {
    console.error('Failed to set qty:', err)
  } finally {
    addingToCart.value[product.id] = false
  }
} 

// Go to collection - navigate to collection page
const goToCollection = (collectionId) => {
  router.push(`/collection/${collectionId}`)
}

// Lifecycle
onMounted(async () => {
  // ensure we know what's already in cart before loading product pages
  await loadCartMap()
  fetchCollections()
})
</script>

<style scoped>
.collections-container {
  padding: 16px;
}

/* Loading and Error States */
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  min-height: 300px;
}

.error-message {
  color: #d32f2f;
  margin-bottom: 20px;
  text-align: center;
}

.retry-btn {
  padding: 10px 20px;
  background: #ff5722;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.retry-btn:hover {
  background: #e64a19;
}

.empty-state i {
  font-size: 48px;
  color: #ccc;
  margin-bottom: 16px;
}

.empty-state p {
  color: #666;
  font-size: 14px;
}

/* Collections List */
.collections-list {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.collection-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.collection-header {
  padding: 0 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.collection-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  margin: 0;
  flex: 1;
}

.collection-badge {
  min-width: 28px;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: #fff1ea;
  color: #ff5722;
  border: 1px solid #ffd3c2;
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  flex-shrink: 0;
}

.view-all-btn {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f5;
  color: #ff5722;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.2s ease;
}

.view-all-btn:hover {
  background: #ff5722;
  color: white;
}

/* Carousel */
.carousel-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  height: auto;
}

.carousel-arrow {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: #f5f5f5;
  color: #ff5722;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  transition: all 0.3s ease;
  position: absolute;
  top: 50%;
  transform: translateY(-50%)
}
 .right-arrow {
  right: 10px;
}
.left-arrow {
  left: 10px;
  z-index: 11;
}

.carousel-arrow:hover:not(:disabled) {
  background: #ff5722;
  color: white;
}

.carousel-arrow:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.carousel-container {
  flex: 1;
  overflow: hidden;
  border-radius: 12px;
  min-height: 240px;
  display: flex;
  align-items: center;
  position: relative;
  width: 100%;
}

.carousel-track {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding: 8px 12px;
  height: 100%;
  min-width: 100%;
  /* Hide scrollbar */
  -ms-overflow-style: none;
  scrollbar-width: none;
  align-items: center;

}

.carousel-track::-webkit-scrollbar {
  display: none;
}

.carousel-item {
  flex-shrink: 0;
  width: 170px;
  height: auto;
  max-height: 500px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0,0,0,0.04);
  min-height: 300px;
  display: flex;
  flex-direction: column;
  margin-right: 0 !important;
  position: relative;
}


.carousel-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.carousel-item.more-item {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ff5722 0%, #ffb26e 100%);
}

.more-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: white;
  text-align: center;
}

.more-content i {
  font-size: 32px;
}

.more-content p {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
}

/* Product Image */
.product-image {
  position: relative;
  width: 100%;
  height: 220px;
  background: #f5f5f5;
  overflow: hidden;
  flex-shrink: 0;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.out-of-stock {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  padding: 8px;
}

/* Product Info */
.product-info {
  padding: 10px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.product-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-stock {
  font-size: 12px;
  color: #666;
  margin: 0;
  font-weight: 500;
}

.product-stock.low-stock {
  color: #ff9800;
  font-weight: 600;
}

/* Add to Cart Button */
.cart-btn {
  width: 100%;
  padding: 10px;
  background: #ff5722;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: none;
  border-radius: 0 0 12px 12px;
}

.cart-btn:hover:not(:disabled) {
  background: #ff7043;
  box-shadow: 0 2px 8px rgba(255, 87, 34, 0.3);
}

.cart-btn:active:not(:disabled) {
  background: #ff5722;
}

.cart-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Quantity controls for inline product cards (reuse cartView style) */
.qty-controls { display:flex; align-items:center; gap:8px; transition: opacity 0.2s; margin: auto; text-align: center; margin-bottom: 5px;}
.qty-controls.disabled { opacity: 0.5; pointer-events: none }
.qty-controls button { width:28px; height:28px; border-radius:6px; border:1px solid #eee; background:white; font-size:14px; cursor: pointer }
.qty-controls button:disabled { opacity: 0.6; cursor: not-allowed }
.qty-controls input { width:48px; text-align:center; padding:6px; border-radius:6px; border:1px solid #eee; font-size:13px; text-align: center; }



/* Responsive */
@media (max-width: 480px) {
  .collections-container {
    padding: 12px;
  }

  .collection-section {
    gap: 8px;
  }

  .carousel-arrow {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }

  .carousel-item {
    width: 140px;
  }

  .product-image {
    height: 180px;
  }

  .product-name {
    font-size: 11px;
  }

  .collection-title {
    font-size: 16px;
  }
}
.view-all-btn {
  background: none;
  border: none;
  color: #ff5722;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
