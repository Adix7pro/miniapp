<template>
  <div class="collection-view-container" style="margin-top: 60px;">
    <!-- Header -->
    <div class="collection-header">
      <button class="back-btn" @click="router.back()">
        <i class="bi bi-arrow-left"></i>
      </button>
      <h1 class="collection-name"></h1>
      <div style="width: 40px;"></div> <!-- Spacer for alignment -->
    </div>

    <!-- Loading State -->
    <div v-if="loading && products.length === 0" class="loading-state">
      <LoadingSpinner />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <button @click="fetchProducts" class="retry-btn">{{ $t('retry') || 'Qayta urinish' }}</button>
    </div>

    <!-- Products Grid -->
    <div v-else-if="products.length > 0" class="products-grid" ref="scrollContainer">
      <div
        v-for="(product, idx) in products"
        :key="product.id || idx"
        class="product-card"
        style="position: relative;"
      >
        <div class="product-image" @click="selectProduct(product)">
          <img :src="product.img || '/placeholder.png'" :alt="product.name" />
        </div>
        <div class="product-info" @click="selectProduct(product)" >
          <h3 style="margin-top: 5px;">{{ formatPrice(product.price) }} <span style="font-size: 10px;">UZS</span></h3>
          <h3 v-if="product.oldPrice" class="product-price" style="font-size: 14px; text-decoration: line-through; color: #999;">
                      {{ formatPrice(product.oldPrice) }}
          </h3>
          
          <h3 class="product-name">{{ product.name }}</h3>
        </div>
        <div
          v-if="(product.quantity || 0) > 0"
          class="qty-controls"
          :class="{ disabled: !product.stock || product.stock < 1 }"
          @click.stop
        >
          <button
            @click.stop="decreaseQty(product)"
            :disabled="addingToCart[product.id || product.ID] || (product.quantity || 0) <= 1"
            aria-label="decrease"
          >-</button>
          <input
            type="text"
            v-model.number="product.quantity"
            @change="onQtyInputChange(product)"
            min="1"
            disabled
          />
          <button
            @click.stop="increaseQty(product)"
            :disabled="addingToCart[product.id || product.ID] || (product.quantity || 0) >= (product.stock || 9999)"
            aria-label="increase"
          >+</button>
        </div>
        <button
          v-else
          class="add-to-cart-btn"
          @click.stop="addToCart(product)"
          :disabled="addingToCart[product.id || product.ID] || !product.stock || product.stock < 1"
        >
          <i class="fas fa-shopping-cart"></i>
        </button>
      </div>
      <!-- Sentinel element for Intersection Observer -->
      <div v-if="hasMore" ref="sentinelElement" class="sentinel"></div>
    </div>

    <!-- Loading More Indicator -->
    <div v-if="loadingMore" class="loading-more">
      <div class="spinner"></div>
      <p>{{ $t('loading') || 'Yuklanmoqda...' }}</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="products.length === 0" class="empty-state">
      <i class="fas fa-inbox"></i>
      <p>{{ $t('noProductsFound') || 'Mahsulotlar topilmadi' }}</p>
    </div>

    <!-- End of List Message -->
    <div v-if="!hasMore && products.length > 0" class="end-message">
      <p>{{ $t('noMoreProducts') || "Ko'proq mahsulot yo'q" }}</p>
    </div>

    <!-- Toast Notification -->
    <div v-if="showToast" class="toast-notification">
      <i class="fas fa-check-circle"></i>
      {{ toastMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import LoadingSpinner from './LoadingSpinner.vue'
import { API } from '../variable/link.js'
import { getChatID } from '../variable/chat.js'
import Cart from '../lib/cart.js'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const products = ref([])
const collectionName = ref('')
const loading = ref(true)
const loadingMore = ref(false)
const error = ref(null)
const hasMore = ref(true)
const currentPage = ref(0)
const PAGE_SIZE = 10
const scrollContainer = ref(null)
const sentinelElement = ref(null)
let observer = null

// Cart sync map (keeps product.quantity in product lists in sync with server)
const cartMap = ref({})

const loadCartMap = async () => {
  try {
    const resp = await Cart.get()
    let items = []
    if (Array.isArray(resp)) items = resp
    else if (resp && Array.isArray(resp.data)) items = resp.data
    else if (resp && Array.isArray(resp.items)) items = resp.items
    else if (resp && Array.isArray(resp.products)) items = resp.products.map(p => ({ id: p.ID || p.id, quantity: p.quantity || p.qty || 1 }))

    const map = {}
    items.forEach(i => {
      const id = i.id || i.ID || i.productId || i.productID
      const qty = i.quantity || i.qty || i.count || 1
      if (id) map[String(id)] = Number(qty) || 1
    })

    cartMap.value = map

    // Decorate currently loaded products
    products.value.forEach(p => {
      const pid = p.id || p.ID || p.productId
      const q = cartMap.value[String(pid)]
      if (q) p.quantity = q
      else delete p.quantity
    })
  } catch (e) {
    console.warn('loadCartMap failed (collectionView)', e)
  }
} 

// Fetch products for collection with pagination
const fetchProducts = async (page = 1, append = false) => {
  try {
    if (page === 1) {
      loading.value = true
    } else {
      loadingMore.value = true
    }
    error.value = null

    const collectionId = route.params.id
    if (!collectionId) {
      error.value = 'Collection ID not found in route'
      return
    }

    const api = axios.create({
      baseURL: API.link,
      headers: {
        'Accept': 'application/json',
        'ngrok-skip-browser-warning': '1',
        'Authorization': 'Basic ' + btoa(`${API.username}:${API.password}`)
      }
    })

    // Fetch products
    const resp = await api.get(
      `/collectionProducts?collectionID=${encodeURIComponent(collectionId)}&page=${page}&limit=${PAGE_SIZE}&chatID=${getChatID()}`
    )

    let items = []
    const payload = resp.data

    // Normalize response
    if (Array.isArray(payload)) {
      items = payload
    } else if (Array.isArray(payload.data)) {
      items = payload.data
    } else if (Array.isArray(payload.result)) {
      items = payload.result
    }

    // Sanitize image URLs and attach cart quantity if present
    items = items.map(it => ({
      ...it,
      img: typeof it.img === 'string' ? it.img.replace(/\\/g, '/') : it.img,
      quantity: cartMap.value[String(it.id || it.ID || it.productId)] || it.quantity || 0
    }))

    // Set collection name from route or API (if available)
    if (!collectionName.value) {
      collectionName.value = route.query.name || t('collection') || 'Kolleksiya'
    }

    // Append or set products
    if (page === 1 || !append) {
      products.value = items
    } else {
      products.value = [...products.value, ...items]
    }

    currentPage.value = page
    // If received less than page size, no more items
    hasMore.value = items.length >= 1

    console.log(`[CollectionView] Loaded page ${page}, total items: ${products.value.length}, hasMore: ${hasMore.value}`)
  } catch (err) {
    console.error('Error fetching collection products:', err)
    error.value = err.response?.data?.message || t('errorLoading') || 'Mahsulotlarni yuklashda xato'
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}
const formatPrice = (price) => {
  if (typeof price !== 'number' || isNaN(price)) return '0'
  return price.toLocaleString({ minimumFractionDigits: 0 }) 
}

const addingToCart = ref({})
const toastMessage = ref('')
const showToast = ref(false)

const triggerToast = (msg) => {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 2000)
}

const addToCart = async (product) => {
  if (!product) return

  try {
    const productID = product.id || product.ID
    addingToCart.value[productID] = true
    
    // Use Cart API to add product
    const resp = await Cart.add(productID)
    const qtyFromResp = resp && (resp.quantity ?? resp.qty) ? Number(resp.quantity ?? resp.qty) : ((Number(product.quantity) || 0) + 1)
    product.quantity = qtyFromResp
    cartMap.value[String(productID)] = product.quantity

    console.log('Added to cart:', productID)
    triggerToast(`${product.name} ${t('addedToCart') || 'savatga qo\'shildi'}`)
  } catch (err) {
    console.error('Failed to add to cart:', err)
    triggerToast(t('failedToAddCart') || 'Qo\'shishda xato')
  } finally {
    addingToCart.value[product.id || product.ID] = false
  }
}

const increaseQty = async (product) => {
  if (!product) return
  const productID = product.id || product.ID
  try {
    addingToCart.value[productID] = true
    const resp = await Cart.add(productID)
    const qty = resp && (resp.quantity ?? resp.qty) ? Number(resp.quantity ?? resp.qty) : ((Number(product.quantity) || 0) + 1)
    product.quantity = qty
    cartMap.value[String(productID)] = product.quantity
  } catch (err) {
    console.error('Failed to increase qty:', err)
  } finally {
    addingToCart.value[productID] = false
  }
}

const decreaseQty = async (product) => {
  if (!product) return
  const productID = product.id || product.ID
  try {
    addingToCart.value[productID] = true
    if ((product.quantity || 0) > 1) {
      const resp = await Cart.delete(productID)
      const qty = resp && (resp.quantity ?? resp.qty) ? Number(resp.quantity ?? resp.qty) : ((Number(product.quantity) || 1) - 1)
      product.quantity = qty
      if (product.quantity <= 0) {
        delete product.quantity
        delete cartMap.value[String(productID)]
      } else {
        cartMap.value[String(productID)] = product.quantity
      }
    } else {
      await Cart.deleteProduct(productID)
      delete product.quantity
      delete cartMap.value[String(productID)]
    }
  } catch (err) {
    console.error('Failed to decrease qty:', err)
  } finally {
    addingToCart.value[productID] = false
  }
}

const onQtyInputChange = async (product) => {
  if (!product) return
  let newQty = Number(product.quantity) || 1
  if (newQty < 1) newQty = 1
  const productID = product.id || product.ID
  const currentQty = Number(cartMap.value[String(productID)] || product.quantity || 0)
  const diff = newQty - currentQty
  if (diff === 0) return
  try {
    addingToCart.value[productID] = true
    if (diff > 0) {
      for (let i = 0; i < diff; i++) await Cart.add(productID)
    } else {
      for (let i = 0; i < Math.abs(diff); i++) await Cart.delete(productID)
    }
    await loadCartMap()
  } catch (err) {
    console.error('Failed to set qty:', err)
  } finally {
    addingToCart.value[productID] = false
  }
}
// Setup Intersection Observer for infinite scroll
const setupIntersectionObserver = () => {
  if (observer) observer.disconnect()
  
  const options = {
    root: scrollContainer.value,
    rootMargin: '200px',
    threshold: 0.01
  }
  
  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && hasMore.value && !loadingMore.value && !loading.value) {
        console.log('[CollectionView] Sentinel visible, loading next page...')
        fetchProducts(currentPage.value + 1, true)
      }
    })
  }, options)
  
  // Start observing the sentinel when it becomes available
  if (sentinelElement.value) {
    observer.observe(sentinelElement.value)
  }
}

// Watch for changes to sentinel element
watch(sentinelElement, () => {
  if (sentinelElement.value) {
    setupIntersectionObserver()
  }
})

// Select product - navigate to product page
const selectProduct = (product) => {
  router.push(`/product/${product.id}`)
}

// Cleanup observer on unmount
onBeforeUnmount(() => {
  if (observer) {
    observer.disconnect()
  }
})

// Lifecycle
onMounted(async () => {
  await loadCartMap()
  window.addEventListener('cart-updated', loadCartMap)
  fetchProducts(1)
  // Setup observer after initial fetch
  nextTick(() => {
    setupIntersectionObserver()
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('cart-updated', loadCartMap)
})
</script>

<style scoped>
.collection-view-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f8f9fa;
}

/* Header */
.collection-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: white;
  border-bottom: 1px solid #e9ecef;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.back-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: #f5f5f5;
  color: #333;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: #ff5722;
  color: white;
}

.collection-name {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  margin: 0;
  flex: 1;
  text-align: center;
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
  flex: 1;
}

.error-message {
  color: #d32f2f;
  margin-bottom: 20px;
  text-align: center;
  font-size: 14px;
}

.retry-btn {
  padding: 10px 20px;
  background: #ff5722;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
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

/* Products Grid */
.products-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 16px;
  overflow-y: auto;

  -ms-overflow-style: none;
  scrollbar-width: none;
  flex: 1;
}

.product-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  height: 300px;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

/* Product Image */
.product-image {
  position: relative;
  width: 100%;
  height: 360px;
  background: #f5f5f5;
  overflow: hidden;
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
  padding: 12px;
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
.add-to-cart-btn {
  width: 100%;
  padding: 10px;
  background: linear-gradient(135deg, #ff5722 0%, #ff7043 100%);
  color: white;
  border: none;
  border-radius: 0 0 12px 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.add-to-cart-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #ff7043 0%, #ff8a65 100%);
  transform: scale(1.02);
  box-shadow: 0 4px 8px rgba(255, 87, 34, 0.3);
}

.add-to-cart-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.add-to-cart-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.add-to-cart-btn i {
  font-size: 14px;
}

/* Quantity controls */
.qty-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  transition: opacity 0.2s;
  margin: auto;
  text-align: center;
  margin-bottom: 5px;
}

.qty-controls.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.qty-controls button {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #eee;
  background: white;
  font-size: 14px;
  cursor: pointer;
}

.qty-controls button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.qty-controls input {
  width: 48px;
  text-align: center;
  padding: 6px;
  border-radius: 6px;
  border: 1px solid #eee;
  font-size: 13px;
}

/* Toast Notification */
.toast-notification {
  position: fixed;
  bottom: 80px;
  left: 10%;
  right: 10%;
  transition: all 0.3s ease;
  background: #4caf50;
  color: white;
  padding: 14px 24px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
  z-index: 1000;
  animation: slideUp 0.3s ease;
}

.toast-notification i {
  font-size: 16px;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform:  translateY(20px);
  }
  to {
    opacity: 1;
    transform:  translateY(0);
  }
}

/* Loading More */
.loading-more {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: white;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 4px solid #eee;
  border-top-color: #ff5722;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-more p {
  font-size: 13px;
  color: #666;
}

/* Sentinel for infinite scroll */
.sentinel {
  height: 1px;
  grid-column: 1 / -1;
}

/* End Message */
.end-message {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 13px;
  background: white;
}

/* Responsive */
@media (max-width: 768px) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    padding: 12px;
  }

  .product-image {
    height: 140px;
  }

  .collection-name {
    font-size: 16px;
  }
}

@media (min-width: 769px) {
  .products-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .product-image {
    height: 180px;
  }
}
</style>
