<template>
  <div class="collections-container">
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
                  <h3 class="product-price">{{ formatPrice(product.price) }} <span>UZS</span></h3>
                  <h3 v-if="product.oldPrice" class="product-old-price">
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
// Narxni "24 000" ko'rinishida chiqaradi (1C narxni son yoki "24 000" matni sifatida berishi mumkin)
const formatPrice = (price) => {
  const n = Number(String(price ?? '').replace(/[^\d.]/g, ''))
  if (!Number.isFinite(n)) return String(price ?? '')
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
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
/* Bosh sahifa · "Qaynoq chegirmalar", "Mijozlar tanlovi" karusellari */
.collections-container { padding: 0; margin-bottom: 32px; font-family: var(--uy-font); }

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  min-height: 200px;
}
.error-message { color: #d32f2f; margin-bottom: 16px; text-align: center; }
.retry-btn { padding: 10px 20px; background: var(--uy-orange-strong); color: #fff; border: none; border-radius: 12px; font-weight: 800; }

.collections-list { display: flex; flex-direction: column; gap: 32px; }
.collection-section { display: flex; flex-direction: column; gap: 16px; }

.collection-header { display: flex; align-items: center; gap: 10px; }
.collection-title {
  flex: 1;
  margin: 0;
  font-size: 22px;
  font-weight: 900;
  color: var(--uy-text);
  letter-spacing: -0.2px;
}
.collection-badge {
  flex-shrink: 0;
  min-width: 34px;
  height: 28px;
  padding: 0 10px;
  border-radius: 10px;
  background: var(--uy-orange-soft);
  color: var(--uy-orange);
  font-size: 14px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.view-all-btn {
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  border: none;
  border-radius: 50%;
  background: #E9E9EE;
  color: #374151;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Karusel: barmoq bilan suriladi, strelkalar kerak emas */
.carousel-wrapper { position: relative; margin: 0 -18px; }
.carousel-arrow { display: none; }
.carousel-container { overflow: visible; }
.carousel-track {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  scroll-behavior: smooth;
  scroll-snap-type: x proximity;
  scroll-padding-left: 18px;
  padding: 4px 18px 20px;
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.carousel-track::-webkit-scrollbar { display: none; }

.carousel-item {
  /* Bootstrap'ning .carousel-item uslubini (margin-right: -100%, float) bekor qilamiz */
  margin-right: 0 !important;
  float: none;
  transition: none;
  flex: 0 0 168px;
  display: flex;
  flex-direction: column;
  scroll-snap-align: start;
  background: #fff;
  border-radius: 22px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(239, 78, 36, 0.1);
  position: relative;
}

.product-image {
  width: 100%;
  height: 150px;
  flex-shrink: 0;
  background: #fff;
  overflow: hidden;
}
.product-image img { width: 100%; height: 100%; object-fit: cover; }

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px 8px;
}
.product-price {
  margin: 0;
  font-size: 17px;
  font-weight: 900;
  color: var(--uy-orange);
  font-family: var(--uy-font);
}
.product-price span { font-size: 12px; font-weight: 800; }
.product-old-price { margin: 0; font-size: 13px; font-weight: 700; color: #9CA3AF; text-decoration: line-through; }
.product-name {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.25;
  color: #1F2937;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Savatga qo'shish */
.cart-btn {
  margin: 4px 12px 12px;
  height: 48px;
  border: none;
  border-radius: 14px;
  background: var(--uy-orange-strong);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  transition: transform 0.15s ease, opacity 0.2s ease;
}
.cart-btn i { font-size: 20px !important; }
.cart-btn:active:not(:disabled) { transform: scale(0.97); }
.cart-btn:disabled { opacity: 0.5; }

/* Miqdor stepperi (mahsulot savatchada bo'lsa) */
.qty-controls {
  margin: 4px 12px 12px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 6px 0 8px;
  border-radius: 14px;
  background: var(--uy-orange-soft);
}
.qty-controls.disabled { opacity: 0.5; pointer-events: none; }
.qty-controls button {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: var(--uy-orange);
  font-size: 20px;
  font-weight: 900;
  line-height: 1;
}
.qty-controls button:last-child { background: #fff; }
.qty-controls button:disabled { opacity: 0.45; }
.qty-controls input {
  width: 36px;
  border: none;
  background: transparent;
  text-align: center;
  font-size: 16px;
  font-weight: 900;
  color: var(--uy-orange);
  font-family: var(--uy-font);
}
</style>
