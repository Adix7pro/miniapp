<template>
  <div class="product-list-container">
    <!-- Header with Back Button -->
      <div class="product-header">
        <h1 style="padding-top: 20px;"><i class="bi bi-arrow-left" @click="router.go(-1)" style="padding-right: 15px;"></i>{{ categoryName }}</h1>
      <p class="product-count">{{ products.length }} {{ $t('items') || 'items' }}</p>
    </div>

    <!-- Loading More Indicator -->
    <div v-if="loadingMore" class="loading-more" style="text-align:center; padding:16px;">
      <div class="small-spinner" style="width:30px;height:30px;border:4px solid #eee;border-top-color:var(--primary,#ff5722);border-radius:50%;margin:0 auto;animation:spin 1s linear infinite"></div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <LoadingSpinner />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <button @click="fetchProducts" class="retry-btn">{{ $t('retry') || 'Retry' }}</button>
    </div>

    <!-- Products Grid -->
    <div v-else-if="products.length > 0" class="products-grid">
      <div
        v-for="(product, index) in products.filter(Boolean)"
        :key="product.id || index"
        class="product-card"
        @click="product && selectProduct(product.id)"
      >
        <div class="product-image">
          <img :src="product.img || '../assets/img/1.png'" :alt="product.name" />
        </div>
        <div class="product-info">
          <h3 class="product-name">{{ product.name }}</h3>
          <div class="product-price">
            <span class="price">{{ product.price }}</span>
            <span class="currency">{{ $t('sum') || 'so`m' }}</span>
          </div>
          <div v-if="getProductQty(product) > 0" class="qty-control" @click.stop>
            <button class="qty-btn" @click.stop="decreaseQty(product)">-</button>
            <span class="qty-value">{{ getProductQty(product) }}</span>
            <button class="qty-btn" @click.stop="increaseQty(product)" :disabled="!product.stock || getProductQty(product) >= product.stock">+</button>
          </div>
          <button v-else class="add-btn" @click.stop="addToCart(product)" :disabled="!product.stock || product.stock < 1">
            <i class="fas fa-shopping-cart"></i>
            {{ $t('add') || 'Add' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <i class="fas fa-inbox"></i>
      <p>{{ $t('noProductsFound') || 'No products found' }}</p>
    </div>

    <!-- Product Details Modal -->
    <div v-if="selectedProduct" class="modal-overlay" @click="selectedProduct = null">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="selectedProduct = null">&times;</button>
        <div class="modal-body">
          <img :src="selectedProduct.image || '/placeholder.png'" :alt="selectedProduct.name" class="modal-image" />
          <div class="modal-info">
            <h2>{{ selectedProduct.name }}</h2>
            <p class="modal-description">{{ selectedProduct.description }}</p>
            <div class="modal-details">
              <p v-if="selectedProduct.category"><strong>{{ $t('category') || 'Category' }}:</strong> {{ selectedProduct.category }}</p>
              <p v-if="selectedProduct.stock"><strong>{{ $t('inStock') || 'In Stock' }}:</strong> {{ selectedProduct.stock }}</p>
            </div>
            <div class="modal-price">
              {{ selectedProduct.price }} {{ $t('sum') || 'sum' }}
            </div>
            <div v-if="getProductQty(selectedProduct) > 0" class="qty-control modal-qty">
              <button class="qty-btn" @click="decreaseQty(selectedProduct)">-</button>
              <span class="qty-value">{{ getProductQty(selectedProduct) }}</span>
              <button class="qty-btn" @click="increaseQty(selectedProduct)" :disabled="!selectedProduct.stock || getProductQty(selectedProduct) >= selectedProduct.stock">+</button>
            </div>
            <button v-else class="order-btn" @click="addToCart(selectedProduct)" :disabled="!selectedProduct.stock || selectedProduct.stock < 1">
              <i class="fas fa-shopping-cart"></i>
              {{ $t('addToCart') || 'Add to Cart' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <transition name="toast">
      <div v-if="showToast" class="toast" :class="toastType">
        {{ toastMessage }}
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import LoadingSpinner from './LoadingSpinner.vue'
import { API } from '../variable/link.js'
import Cart from '../lib/cart.js'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

// State
const products = ref([])
const category = ref(null)
const loading = ref(false)
const error = ref(null)
const selectedProduct = ref(null)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
const toastTimer = ref(null)
const cartQtyMap = ref({})

// Infinite scroll / paging state
const currentPage = ref(parseInt(route.query.page) || 1)
const limit = ref(parseInt(route.query.limit) || 40)
const loadingMore = ref(false)
const reachedEnd = ref(false)
const categoryName = ref('')


// API client
const api = axios.create({
  baseURL: API.link,
  headers: {
    Accept: 'application/json',
    'ngrok-skip-browser-warning': '1',
    Authorization: 'Basic ' + btoa(`${API.username}:${API.password}`)
  }
})
onMounted(() => {

  api.get(`/categoryByID?ID=${route.params.categoryId}`).then(response => {
    categoryName.value = response.data?.data.name || route.params.categoryId
  }).catch(() => {
    categoryName.value = route.params.categoryId
  })
})

// Methods
const goBack = () => {
  router.back()
}

const selectProduct = (productId) => {
  if (!productId) {
    console.warn('selectProduct: productId is missing', productId)
    return
  }
  router.push({ name: 'product', params: { id: productId } })
}

const parseCartItems = (resp) => {
  let items = []
  if (Array.isArray(resp)) items = resp
  else if (resp && Array.isArray(resp.products)) items = resp.products
  else if (resp && Array.isArray(resp.data)) items = resp.data
  else if (resp && Array.isArray(resp.items)) items = resp.items
  return items
}

const productKey = (product) => String(product?.id || product?.ID || '')

const getProductQty = (product) => {
  const key = productKey(product)
  if (!key) return 0
  return Number(cartQtyMap.value[key] || 0)
}

const showToastMessage = (message, type = 'success') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  if (toastTimer.value) clearTimeout(toastTimer.value)
  toastTimer.value = setTimeout(() => {
    showToast.value = false
  }, 2000)
}

const loadCartQuantities = async () => {
  try {
    const resp = await Cart.get()
    const items = parseCartItems(resp)
    const nextMap = {}
    items.forEach((it) => {
      const id = String(it.ID || it.id || '')
      if (!id) return
      nextMap[id] = Number(it.quantity || it.qty || it.count || 1) || 0
    })
    cartQtyMap.value = nextMap
  } catch (e) {
    console.warn('Failed to load cart quantities', e)
  }
}

const increaseQty = async (product) => {
  if (!product) return
  if (!product.stock || product.stock < 1) {
    showToastMessage(t('outOfStock') || 'Out of Stock', 'error')
    return
  }
  if (getProductQty(product) >= Number(product.stock || 0)) {
    showToastMessage(t('outOfStock') || 'Out of Stock', 'error')
    return
  }
  try {
    await Cart.add(product.id || product.ID)
    const key = productKey(product)
    cartQtyMap.value[key] = getProductQty(product) + 1
    showToastMessage(`${product.name} ${t('addedToCart') || 'added to cart'}`, 'success')
    if (selectedProduct.value) selectedProduct.value = { ...selectedProduct.value }
  } catch (err) {
    console.error('Failed to increase qty:', err)
    showToastMessage(t('failedToAddCart') || 'Failed to add to cart', 'error')
  }
}

const decreaseQty = async (product) => {
  if (!product) return
  const qty = getProductQty(product)
  if (qty < 1) return
  try {
    await Cart.delete(product.id || product.ID)
    const key = productKey(product)
    const nextQty = Math.max(0, qty - 1)
    if (nextQty === 0) delete cartQtyMap.value[key]
    else cartQtyMap.value[key] = nextQty
    showToastMessage(t('delete') || 'Removed', 'success')
    if (selectedProduct.value) selectedProduct.value = { ...selectedProduct.value }
  } catch (err) {
    console.error('Failed to decrease qty:', err)
    showToastMessage(t('error_generic') || 'Error', 'error')
  }
}

const addToCart = async (product) => {
  await increaseQty(product)
}

// Expose a global helper `addcart` for other scripts to call
window.addcart = (product) => addToCart(product)

const fetchProducts = async () => {
  // If this is the first load use main loader, otherwise loadingMore is used
  if (!loadingMore.value) loading.value = true
  error.value = null
  try {
    const categoryId = route.params.categoryId
    const page = currentPage.value || 1

    const response = await api.get(`/product?categoryID=${categoryId}&page=${page}&limit=${limit.value}`)
    const fetched = response.data?.data || response.data || []
    
    // Normalize product IDs - API may return ID, productId, or id
    const normalized = fetched.map(item => ({
      ...item,
      id: item.id || item.ID || item.productId || `product-${Math.random()}`
    }))

    if (loadingMore.value) {
      products.value.push(...normalized)
    } else {
      products.value = normalized
    }

    category.value = { id: categoryId, name: category.value?.name || '' }

    if (!fetched || fetched.length < limit.value) {
      reachedEnd.value = true
    }

  } catch (err) {
    console.error('Failed to fetch products:', err)
    // fallback mock only on initial load
    error.value = 'Failed to fetch products.'
  } finally {
    if (loadingMore.value) loadingMore.value = false
    else loading.value = false
  }
}

// Load next page (append)
const loadNextPage = async () => {
  if (loadingMore.value || loading.value || reachedEnd.value) return
  loadingMore.value = true
  currentPage.value = (currentPage.value || 1) + 1
  await fetchProducts()
}

// Scroll handler
const onScroll = () => {
  if (reachedEnd.value) return
  const threshold = 300
  if ((window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - threshold)) {
    loadNextPage()
  }
}

// Lifecycle
onMounted(() => {
  fetchProducts()
  loadCartQuantities()
  window.addEventListener('scroll', onScroll)
})

onBeforeUnmount(() => {
  if (toastTimer.value) clearTimeout(toastTimer.value)
  window.removeEventListener('scroll', onScroll)
})
</script>

<style scoped>
.product-list-container {
  min-height: 100vh;
  background: #fffafa;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.product-header {
  margin-bottom: 30px;
  animation: slideDown 0.4s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--primary, #ff5722);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 15px;
  transition: all 0.3s ease;
}

.back-btn:hover {
  transform: translateX(-3px);
  box-shadow: 0 4px 12px rgba(255, 87, 34, 0.3);
}

.product-header h1 {
  font-size: 28px;
  color: #2c3e50;
  margin: 0 0 8px 0;
  font-weight: 700;
}

.product-count {
  color: #7f8c8d;
  font-size: 14px;
  margin: 0;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.error-state {
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  margin: 20px 0;
}

.error-message {
  color: #c33;
  margin-bottom: 15px;
  font-size: 16px;
}

.retry-btn {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background: #c0392b;
  transform: scale(1.02);
}

/* Products Grid - 2 Columns */
.products-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-top: 20px;
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.product-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
}

.product-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.product-image {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  background: #f0f0f0;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.product-card:hover .product-image img {
  transform: scale(1.05);
}

@keyframes spin { to { transform: rotate(360deg); } }

.discount-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: var(--primary, #ff5722);
  color: white;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.product-info {
  padding: 12px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.product-name {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 4px 0;
  line-height: 1.3;
  min-height: 28px;
}

.product-description {
  font-size: 12px;
  color: #95a5a6;
  margin: 0 0 8px 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
  flex: 1;
}

.product-price {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 8px;
}

.price {
  font-size: 16px;
  font-weight: 700;
  color: var(--primary, #ff5722);
}

.currency {
  font-size: 12px;
  color: #7f8c8d;
  font-weight: 500;
}

.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: var(--primary, #ff5722);
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.3s ease;
  width: 100%;
}

.qty-control {
  display: grid;
  grid-template-columns: 34px 1fr 34px;
  align-items: center;
  gap: 8px;
}

.qty-btn {
  border: none;
  border-radius: 8px;
  width: 34px;
  height: 34px;
  background: #ffe7df;
  color: #ff5722;
  font-size: 20px;
  line-height: 1;
  font-weight: 700;
}

.qty-btn:disabled {
  opacity: 0.45;
}

.qty-value {
  text-align: center;
  font-size: 14px;
  font-weight: 700;
  color: #2c3e50;
}

.add-btn:hover {
  background: #e64a19;
  transform: scale(1.02);
}

.add-btn:active {
  transform: scale(0.98);
}

.add-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  opacity: 0.6;
}

.add-btn:disabled:hover {
  background: #bdc3c7;
  transform: scale(1);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #7f8c8d;
}

.empty-state i {
  font-size: 48px;
  color: #bdc3c7;
  margin-bottom: 15px;
  display: block;
}

.empty-state p {
  font-size: 16px;
  margin: 0;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 0.3s ease-out;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-close {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.1);
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2c3e50;
  transition: all 0.3s ease;
  z-index: 1;
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.2);
}

.modal-body {
  padding: 20px;
}

.modal-image {
  width: 100%;
  height: 300px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 20px;
}

.modal-info h2 {
  font-size: 24px;
  color: #2c3e50;
  margin: 0 0 10px 0;
  font-weight: 700;
}

.modal-description {
  color: #7f8c8d;
  margin: 0 0 15px 0;
  line-height: 1.5;
}

.modal-details {
  background: #f9f9f9;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 15px;
  font-size: 14px;
}

.modal-details p {
  margin: 6px 0;
  color: #2c3e50;
}

.modal-price {
  font-size: 28px;
  font-weight: 700;
  color: var(--primary, #ff5722);
  margin-bottom: 15px;
}

.order-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--primary, #ff5722);
  color: white;
  border: none;
  padding: 14px 20px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-qty {
  margin-top: 4px;
}

.order-btn:hover {
  background: #e64a19;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 87, 34, 0.3);
}

.order-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  opacity: 0.6;
}

.order-btn:disabled:hover {
  background: #bdc3c7;
  transform: translateY(0);
  box-shadow: none;
}

/* Toast Notification */
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 16px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 2000;
  animation: slideInUp 0.3s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.toast.success {
  background: #27ae60;
  color: white;
}

.toast.error {
  background: #e74c3c;
  color: white;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .product-header h1 {
    font-size: 24px;
  }

  .modal-content {
    max-width: 95%;
  }
}

@media (max-width: 480px) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .product-name {
    font-size: 12px;
  }

  .product-description {
    font-size: 11px;
  }

  .price {
    font-size: 14px;
  }

  .add-btn {
    padding: 6px 10px;
    font-size: 11px;
  }

  .toast {
    bottom: 10px;
    right: 10px;
    left: 10px;
    border-radius: 6px;
  }
}
</style>
