<template>
  <div class="cart-container" :class="{ 'with-fixed-summary': !loading && cartItems.length > 0 }">
    <h2 class="cart-title"><i class="fas fa-shopping-cart cart-icon" aria-hidden="true"></i><span>{{ $t('cart') || 'Your Cart' }}</span></h2>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>{{ $t('loading') || 'Loading...' }}</p>
    </div>

    <div v-else-if="cartItems.length === 0" class="empty-state">
      <i class="fas fa-shopping-cart"></i>
      <p>{{ $t('cartEmpty') || "Your cart is empty" }}</p>
      <button class="view-products" @click="router.go('/home')">{{ $t('browseProducts') || 'Browse products' }}</button>
    </div>

    <div v-else class="cart-content">
      <div class="cart-list">
        <div v-for="(item, idx) in enrichedCartItems" :key="item.id || idx" class="cart-item" :class="{ 'disabled-item': isItemOutOfStock(item) }">
          <div class="item-left">
            <img v-if="getItemImage(item)" :src="getItemImage(item)" :alt="item.name || item.details?.name" class="item-image"/>
            <div v-else class="item-image placeholder"><i class="fas fa-box"></i></div>
          </div>

          <div class="item-body">
            <div class="item-head">
              <div>
                <h3 class="item-name"><i class="fas fa-box-open small-icon" aria-hidden="true"></i> {{ item.name || item.details?.name }}</h3>
                <p v-if="isItemOutOfStock(item)" class="stock-warning"><i class="fas fa-exclamation-circle"></i> {{ $t('outOfStock') || 'Out of Stock' }}</p>
              </div>
              <button class="remove-btn" @click="removeItem(item.id)" aria-label="Remove"><i class="fas fa-times" aria-hidden="true"></i></button>
            </div>
            <p class="item-price"><i class="fas fa-tag small-icon" aria-hidden="true"></i> {{ formatPrice(item.details?.price || item.price) }}</p>

            <div class="qty-controls" :class="{ disabled: isItemOutOfStock(item) }">
              <button @click="decrement(item)" :disabled="isItemOutOfStock(item)">-</button>
              <input type="number" v-model.number="item.quantity" @change="onQtyChange(item)" min="1" :disabled="isItemOutOfStock(item)" />
              <button @click="increment(item)" :disabled="isItemOutOfStock(item)">+</button>
            </div>
          </div>

         
        </div>
      </div>

      <div class="cart-summary">
        <div class="summary-row total">
          <span><i class="fas fa-wallet small-icon" aria-hidden="true"></i> {{ $t('total') || 'Total' }}</span>
          <strong>{{ formatPrice(subtotal) }}</strong>
        </div>

        <div v-if="hasOutOfStockItems" class="validation-warning">
          <i class="fas fa-warning"></i>
          {{ $t('checkoutDisabled') || 'Some items are out of stock. Please remove them to proceed.' }}
        </div>

        <div class="summary-actions">
          <button class="clear-btn" @click="clearCart"><i class="fas fa-trash-alt" aria-hidden="true"></i> <span>{{ $t('clearCart') || 'Clear' }}</span></button>
          <button class="checkout-btn" @click="checkout" :disabled="hasOutOfStockItems"><i class="fas fa-shopping-bag" aria-hidden="true"></i> <span>{{ $t('checkout') || 'Checkout' }}</span></button>
        </div> 
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import { API } from '../variable/link.js'
import Cart from '../lib/cart.js'

const { t } = useI18n()
const router = useRouter()

// Cart items structure: { id, name, price, quantity, image }
const cart = ref([])
const productDetails = ref({})
const loading = ref(false)

// Load cart from server on mount
const loadCart = async () => {
  try {
    loading.value = true
    const response = await Cart.get()

    // Normalize a few possible API shapes. The API may return:
    // - an array (old style)
    // - { data: [...] }
    // - { items: [...] }
    // - { products: [{ ID, quantity }, ...] }  <-- current server format
    let items = []

    if (Array.isArray(response)) {
      items = response
    } else if (response && Array.isArray(response.data)) {
      items = response.data
    } else if (response && Array.isArray(response.items)) {
      items = response.items
    } else if (response && Array.isArray(response.products)) {
      // Map server product shape to internal cart item shape
      items = response.products.map(p => ({
        id: p.ID || p.id,
        quantity: p.quantity || p.qty || 1,
        // price/name/image will be filled by fetchProductDetails
        price: 0,
        name: '',
        image: null
      }))
    }

    cart.value = items
    console.log('Cart loaded:', items)
  } catch (err) {
    console.error('Failed to load cart:', err)
  } finally {
    loading.value = false
  }
}

const formatPrice = (price) => {
  try {
    return new Intl.NumberFormat('uz-Latn-uz', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0
    }).format(price || 0)
  } catch (e) {
    return String(price || 0)
  }
}

const normalizeImageUrl = (value) => {
  if (!value || typeof value !== 'string') return ''
  return value.replace(/\\/g, '/')
}

const getItemImage = (item) => {
  const firstFromArray = Array.isArray(item?.details?.images) && item.details.images.length
    ? (item.details.images[0]?.url || item.details.images[0]?.img || item.details.images[0]?.image || item.details.images[0])
    : null

  return normalizeImageUrl(
    firstFromArray ||
    item?.details?.img ||
    item?.details?.image ||
    item?.image ||
    ''
  )
}

const findIndex = (id) => cart.value.findIndex(it => String(it.id) === String(id))

async function fetchProductDetails() {
  try {
    loading.value = true
    const ids = cart.value.map(i => i.id).filter(Boolean)
    const uniqueIds = [...new Set(ids)]
    
    const promises = uniqueIds.map(id => {
      if (productDetails.value[id]) return Promise.resolve()
      // Fetch product details including stock info
      return axios.get(`${API.link}/product?productID=${encodeURIComponent(id)}`, {
        headers: { 
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': '1',
          'Authorization': 'Basic ' + btoa(API.username + ':' + API.password)
        } 
      })
        .then(res => {
          const data = res?.data?.data || res?.data
          productDetails.value[id] = {
            ...data,
            img: normalizeImageUrl(data?.img || data?.image || ''),
            stock: data?.stock || data?.quantity || 0
          }
          console.log(`Fetched product ${id}:`, productDetails.value[id])
        }).catch(e => { 
          console.warn('Failed fetching product', id, e)
          // Set default stock of 0 if fetch fails
          productDetails.value[id] = { stock: 0 }
        })
    })
    
    await Promise.all(promises)
  } catch (e) { 
    console.warn('fetchProductDetails error', e) 
  } finally {
    loading.value = false
  }
}

// Check if item is out of stock
const isItemOutOfStock = (item) => {
  const details = productDetails.value[item.id]
  if (!details) return false
  const stock = details.stock || details.quantity || 0
  return stock < 1
}

// Check if any items are out of stock (validation)
const hasOutOfStockItems = computed(() => {
  return enrichedCartItems.value.some(item => isItemOutOfStock(item))
})

// Map cart items to include details
const enrichedCartItems = computed(() => {
  return cart.value.map(item => ({
    ...item,
    details: productDetails.value[item.id] || {}
  }))
})

// Simple cart items reference
const cartItems = computed(() => cart.value)

// Calculate subtotal (without tax/shipping)
const subtotal = computed(() => {
  return cart.value.reduce((sum, item) => {
    const priceFromDetails = productDetails.value[item.id]?.price
    const price = (typeof priceFromDetails === 'number' ? priceFromDetails : (item.price || 0))
    return sum + (price * (item.quantity || 1))
  }, 0)
})

watch(cart, () => { fetchProductDetails() }, { deep: true, immediate: true })

const removeItem = async (id) => {
  try {
    await Cart.deleteProduct(id)
    const idx = findIndex(id)
    if (idx !== -1) cart.value.splice(idx, 1)
    console.log('Item removed:', id)
  } catch (err) {
    console.error('Failed to remove item:', err)
  }
}

const clearCart = async () => {
  try {
    await Cart.reset()
    cart.value = []
    console.log('Cart cleared')
  } catch (err) {
    console.error('Failed to clear cart:', err)
  }
}

const increment = async (item) => {
  try {
    const details = productDetails.value[item.id]
    const stock = details?.stock || details?.quantity || 0
    const currentQty = item.quantity || 0
    
    // Prevent exceeding available stock via API
    if (currentQty >= stock) {
      console.warn(`Cannot exceed stock limit. Current: ${currentQty}, Stock: ${stock}`)
      return
    }
    
    await Cart.add(item.id)
    item.quantity = currentQty + 1
  } catch (err) {
    console.error('Failed to increment:', err)
  }
}

const decrement = async (item) => {
  try {
    if ((item.quantity || 0) > 1) {
      await Cart.delete(item.id)
      item.quantity -= 1
    } else {
      await removeItem(item.id)
    }
  } catch (err) {
    console.error('Failed to decrement:', err)
  }
}

const onQtyChange = async (item) => {
  if (!item.quantity || item.quantity < 1) item.quantity = 1
  
  // Validate against stock limit
  const details = productDetails.value[item.id]
  const stock = details?.stock || details?.quantity || 0
  if (item.quantity > stock) {
    item.quantity = stock
  }
}

const checkout = () => {
  // Validate: check if any items are out of stock
  if (hasOutOfStockItems.value) {
    try {
      window.Telegram?.WebApp?.showAlert?.('Please remove out of stock items before checkout')
    } catch (e) {}
    return
  }
  
  // Default behavior: navigate to checkout route
  try {
    router.push({ name: 'checkout' })
  } catch (e) {
    console.warn('Checkout navigation failed', e)
  }
}

const goToCatalog = () => router.push({ name: 'catalog' })

// Load persisted cart and fetch product details on mount
onMounted(async () => {
  await loadCart()
  window.addEventListener('cart-updated', loadCart)
  if (cart.value.length > 0) {
    await fetchProductDetails()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('cart-updated', loadCart)
})


</script>

<style scoped>
.cart-container {
  max-width: 980px;
  margin: 18px auto;
  padding: 14px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 6px 18px rgba(17,17,17,0.04);
  font-size: 14px;
  color: #222;
}

.loading-state {
  text-align: center;
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f0f0f0;
  border-top-color: #ff5722;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.cart-title {
  margin: 0 0 12px 0;
  font-size: 18px;
  color: #111;
  display:flex;
  align-items:center;
  gap:10px;
  font-weight:600;
}
.cart-icon { font-size:18px; color:var(--primary,#ff5722) }
.empty-state {
  text-align: center;
  padding: 32px 10px;
  color: #95a0a6;
  font-size: 13px;
}
.empty-state i { font-size: 44px; margin-bottom: 10px; display: block }
.view-products {
  margin-top: 12px;
  background: var(--primary, #ff5722);
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  font-size:13px;
} 
.cart-content { display: flex; gap: 20px; flex-wrap: wrap }
.cart-list { flex: 1 1 60%; min-width: 280px }
.cart-summary { flex: 0 0 320px; background: #fafafa; padding: 16px; border-radius: 8px; height: fit-content }

.cart-item { 
  display: flex; 
  gap: 12px; 
  padding: 10px; 
  border-bottom: 1px solid #f3f4f6; 
  align-items: center;
  transition: opacity 0.2s;
}
.cart-item.disabled-item {
  opacity: 0.6;
  background-color: #f9f9f9;
}

.item-left { width: 72px; height: 72px; flex-shrink: 0 }
.item-image { width: 72px; height: 72px; object-fit: cover; border-radius: 8px }
.item-image.placeholder { display:flex; align-items:center; justify-content:center; background:#f0f0f0; color:#9aa5b1 }
.item-body { flex: 1 }
.item-head { display:flex; justify-content:space-between; align-items:flex-start; gap: 10px }
.item-name { margin:0; font-size:15px; font-weight:600 }
.stock-warning {
  color: #c0392b;
  margin: 4px 0 0 0;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.remove-btn { background: transparent; border: 1px solid #f0f0f0; width:34px; height:34px; border-radius:8px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#c0392b; font-size:14px; flex-shrink: 0 }
.item-price { color:#7f8c8d; margin:6px 0; font-size:13px; display:flex; align-items:center; gap:6px }
.small-icon { font-size:12px; color:#888; display:inline-flex; align-items:center }
.qty-controls { display:flex; align-items:center; gap:8px; transition: opacity 0.2s }
.qty-controls.disabled { opacity: 0.5; pointer-events: none }
.qty-controls button { width:28px; height:28px; border-radius:6px; border:1px solid #eee; background:white; font-size:14px; cursor: pointer }
.qty-controls button:disabled { opacity: 0.6; cursor: not-allowed }
.qty-controls input { width:48px; text-align:center; padding:6px; border-radius:6px; border:1px solid #eee; font-size:13px }
.qty-controls input:disabled { opacity: 0.6; cursor: not-allowed; background: #f5f5f5 }
.item-right { width:86px; text-align:right; font-weight:700; font-size:14px }
.summary-row { display:flex; justify-content:space-between; padding:6px 0; font-size:13px; color:#30343a }
.summary-row.total { font-size:16px; margin-top:8px; border-top: 1px solid #e0e0e0; padding-top: 8px }
.summary-actions { display:flex; gap:8px; margin-top:12px }
.clear-btn { flex:0 0 auto; background:#f5f5f5; border:none; padding:8px 10px; border-radius:8px; display:flex; align-items:center; gap:8px; font-size:13px; cursor: pointer }
.checkout-btn { flex:1; background:var(--primary,#ff5722); color:white; border:none; padding:8px 12px; border-radius:8px; display:flex; align-items:center; gap:8px; font-size:13px; cursor: pointer }
.checkout-btn:disabled { opacity: 0.5; cursor: not-allowed }
.clear-btn i, .checkout-btn i { font-size:14px }

.validation-warning {
  background-color: #fef3cd;
  border: 1px solid #ffc107;
  color: #856404;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 720px) {
  .cart-content { flex-direction:column }
  .cart-summary {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 64px;
    width: 100%;
    border-radius: 16px 16px 0 0;
    background: #fff;
    padding-bottom: calc(16px + env(safe-area-inset-bottom));
    box-shadow: 0 -6px 20px rgba(0, 0, 0, 0.08);
    z-index: 1000;
  }
  .with-fixed-summary .cart-list {
    padding-bottom: 250px;
  }
}

.cloud-actions { display:flex; gap:8px; align-items:center; margin-top:12px }
.cloud-actions .btn { background:#f1f1f1; border:none; padding:8px 10px; border-radius:6px }
.cloud-status { margin-left:8px }
</style>
