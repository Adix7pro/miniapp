<template>
    <div class="product-page-container">
        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
            <div class="skeleton-product">
                <div class="skeleton-image"></div>
                <div class="skeleton-title"></div>
                <div class="skeleton-price"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-text"></div>
            </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-state">
            <i class="fas fa-exclamation-circle"></i>
            <p class="error-message">{{ error }}</p>
            <button @click="goBack" class="retry-btn">{{ $t('back') }}</button>
        </div>

        <!-- Product Details -->
        <div v-else-if="product" class="product-details">
            <!-- Header with Back Button -->
            <div class="product-header" style="position: absolute; top: 130px; background: transparent;">
                <button @click="goBack" class="back-btn" style="background-color: transparent;">
                    <i class="fas fa-arrow-left"></i>
                </button>
            </div>

            <!-- Product Image -->
            <div class="product-image-section">
                <div v-if="carouselImages.length" class="product-image">
                    <img :src="carouselImages[currentImageIndex]" :alt="`${product.name} ${currentImageIndex + 1}`" />
                    <button
                        v-if="carouselImages.length > 1"
                        class="carousel-btn prev"
                        @click="prevImage"
                        type="button"
                        aria-label="Previous image"
                    >
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <button
                        v-if="carouselImages.length > 1"
                        class="carousel-btn next"
                        @click="nextImage"
                        type="button"
                        aria-label="Next image"
                    >
                        <i class="fas fa-chevron-right"></i>
                    </button>
                    <div v-if="carouselImages.length > 1" class="carousel-dots">
                        <button
                            v-for="(image, index) in carouselImages"
                            :key="`${image}-${index}`"
                            class="carousel-dot"
                            :class="{ active: index === currentImageIndex }"
                            type="button"
                            @click="goToImage(index)"
                            :aria-label="`Image ${index + 1}`"
                        />
                    </div>
                </div>
                <div v-else class="product-image-placeholder">
                    <i class="fas fa-image"></i>
                </div>
                <div v-if="product.stock > 0" class="stock-badge in-stock">
                    {{ $t('inStock') || 'In Stock' }}
                </div>
                <div v-else class="stock-badge out-of-stock">
                    {{ $t('outOfStock') || 'Out of Stock' }}
                </div>
            </div>

            <!-- Product Info -->
            <div class="product-info">
                <!-- Title and Category -->
                <div class="product-header-info">
                    <h2 class="product-name">{{ product.name }}</h2>
                    <p class="product-category">{{ product.category }}</p>
                </div>

                <!-- Color Selection -->
                <div v-if="product.color" class="color-section">
                    <label class="section-label">{{ $t('color') || 'Color' }}:</label>
                    <p class="color-value">{{ product.color }}</p>
                </div>

                <!-- Description -->
                <div v-if="product.description" class="description-section">
                    <label class="section-label">{{ $t('description') || 'Description' }}:</label>
                    <p class="description-text">{{ product.description }}</p>
                </div>

                <!-- Properties -->
                <div v-if="hasProperties" class="properties-section">
                    <label class="section-label">{{ $t('specifications') || 'Specifications' }}:</label>
                    <div class="properties-list">
                        <div v-if="product.brand" class="property-item">
                            <span class="property-key">{{ $t('brand') || 'Brand' }}:</span>
                            <span class="property-value">{{ product.brand }}</span>
                        </div>
                        <div v-if="product.country" class="property-item">
                            <span class="property-key">{{ $t('country') || 'Country' }}:</span>
                            <span class="property-value">{{ product.country }}</span>
                        </div>
                        <div v-if="product.material" class="property-item">
                            <span class="property-key">{{ $t('material') || 'Material' }}:</span>
                            <span class="property-value">{{ product.material }}</span>
                        </div>
                        <div v-if="product.weight && product.weight > 0" class="property-item">
                            <span class="property-key">{{ $t('weight') || 'Weight' }}:</span>
                            <span class="property-value">{{ product.weight }} kg</span>
                        </div>
                        <div v-if="product.article" class="property-item">
                            <span class="property-key">{{ $t('article') || 'Article' }}:</span>
                            <span class="property-value">{{ product.article }}</span>
                        </div>
                        <div v-if="product.quantityInSet" class="property-item">
                            <span class="property-key">{{ $t('quantity') || 'Quantity in Set' }}:</span>
                            <span class="property-value">{{ product.quantityInSet }}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Spacer for fixed bottom bar -->
                <div style="height: 120px;"></div>
            </div>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
            <i class="fas fa-inbox"></i>
            <p>{{ $t('productNotFound') || 'Product not found' }}</p>
            <button @click="goBack" class="retry-btn">{{ $t('back') }}</button>
        </div>

        <!-- Fixed Bottom Bar (Price + Action Buttons) -->
        <div v-if="product" class="fixed-bottom-bar">
            <!-- Price -->
            <div class="price-section">
                <span class="price">{{ formatPrice(product.price) }}</span>
                <span v-if="product.stock > 0" class="stock-info">
                    {{ product.stock }} {{ $t('canBuy') || 'Sotib olishingiz mumkin' }}
                </span>
            </div>

            <!-- Add to Cart Button -->
            <div v-if="product.stock > 0 && productQty > 0" class="qty-control">
                <button class="qty-btn" @click="decreaseQty" :disabled="addingToCart">-</button>
                <span class="qty-value">{{ productQty }}</span>
                <button class="qty-btn" @click="increaseQty" :disabled="addingToCart || productQty >= product.stock">+</button>
            </div>
            <button
                v-else-if="product.stock > 0"
                @click="addToCart"
                class="btn btn-primary"
                :disabled="addingToCart"
            >
                <i class="fas fa-shopping-cart"></i>
                {{ addingToCart ? ($t('adding') || 'Adding...') : ($t('addToCart') || 'Add to Cart') }}
            </button>
            <button 
                v-else
                class="btn btn-disabled"
                disabled
            >
                <i class="fas fa-ban"></i>
                {{ $t('unavailable') || 'Unavailable' }}
            </button>
        <!-- Toast Notification -->
        <transition name="toast">
          <div v-if="showToast" class="toast" :class="toastType">
            {{ toastMessage }}
          </div>
        </transition>
        </div>
        </div>
</template> 

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import { API } from '../variable/link.js'
import Cart from '../lib/cart.js'

const apiBaseUrl = API.link

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

// State
const product = ref(null)
const loading = ref(false)
const error = ref(null)
const addingToCart = ref(false)
const isInWishlist = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
const toastTimer = ref(null)
const productQty = ref(0)
const currentImageIndex = ref(0)
const triggerToast = (msg, type = 'success', duration = 2000) => {
    toastMessage.value = msg
    toastType.value = type
    showToast.value = true
    if (toastTimer.value) clearTimeout(toastTimer.value)
    toastTimer.value = setTimeout(() => { showToast.value = false }, duration)
}

// Computed
const hasProperties = computed(() => {
    if (!product.value) return false
    return !!(
        product.value.brand ||
        product.value.country ||
        product.value.material ||
        (product.value.weight && product.value.weight > 0) ||
        product.value.article ||
        product.value.quantityInSet
    )
})

const carouselImages = computed(() => {
    if (!product.value) return []

    const images = Array.isArray(product.value.images)
        ? product.value.images
              .map((item) => {
                  if (typeof item === 'string') return item
                  if (item && typeof item === 'object') {
                      return item.url || item.img || item.image || null
                  }
                  return null
              })
              .filter(Boolean)
        : []

    if (images.length > 0) return images
    return product.value.img ? [product.value.img] : []
})

watch(carouselImages, () => {
    currentImageIndex.value = 0
})
 onMounted(() => {
    try { window.scrollTo({ top: 0, behavior: 'smooth' }) } catch (e){}
 })


// Methods
const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'UZS'
    }).format(price)
}

const fetchProduct = async () => {
    loading.value = true
    error.value = null
    try {
        const productId = route.params.id || route.query.productId
        if (!productId) {
            error.value = t('productNotFound') || 'Product not found'
            return
        }

        const response = await axios.get(
            `${API.link}/product`,
            {
                params: {
                    productID: productId
                },
                headers: {
                    'Accept': 'application/json',
                    'Authorization': 'Basic ' + btoa(`${API.username}:${API.password}`),
                    'ngrok-skip-browser-warning': '1',
                },
            },
        )

        product.value = response.data.data || response.data
        
        // Normalize product data
        if (!product.value.id) product.value.id = productId
        if (!product.value.properties) product.value.properties = {}

        console.log('Product fetched:', product.value)
        await loadProductQty()

        // Check if product is in wishlist
        checkWishlist()
    } catch (err) {
        console.error('Failed to fetch product:', err)
        error.value = t('failedToLoadProduct') || 'Failed to load product'
        
    } finally {
        loading.value = false
    }
}

const addToCart = async () => {
    await increaseQty()
}

const parseCartItems = (resp) => {
    let items = []
    if (Array.isArray(resp)) items = resp
    else if (resp && Array.isArray(resp.products)) items = resp.products
    else if (resp && Array.isArray(resp.data)) items = resp.data
    else if (resp && Array.isArray(resp.items)) items = resp.items
    return items
}

const loadProductQty = async () => {
    if (!product.value) return
    try {
        const resp = await Cart.get()
        const items = parseCartItems(resp)
        const currentId = String(product.value.id || product.value.ID || '')
        const found = items.find((it) => String(it.ID || it.id || '') === currentId)
        productQty.value = Number(found?.quantity || found?.qty || found?.count || 0) || 0
    } catch (e) {
        console.warn('Failed to load product qty', e)
        productQty.value = 0
    }
}

const increaseQty = async () => {
    if (!product.value) return
    if (!product.value.stock || product.value.stock < 1) {
        triggerToast(t('outOfStock') || 'Out of Stock', 'error')
        return
    }
    if (productQty.value >= Number(product.value.stock || 0)) {
        triggerToast(t('outOfStock') || 'Out of Stock', 'error')
        return
    }
    addingToCart.value = true
    try {
        const productID = product.value.id || product.value.ID
        await Cart.add(productID)
        productQty.value += 1
        triggerToast(`${product.value.name} ${t('addedToCart') || 'added to cart'}`)
    } catch (err) {
        console.error('Failed to add to cart:', err)
        triggerToast(t('failedToAddCart') || 'Failed to add to cart', 'error')
    } finally {
        addingToCart.value = false
    }
}

const decreaseQty = async () => {
    if (!product.value || productQty.value < 1) return
    addingToCart.value = true
    try {
        const productID = product.value.id || product.value.ID
        await Cart.delete(productID)
        productQty.value = Math.max(0, productQty.value - 1)
        triggerToast(t('delete') || 'Removed')
    } catch (err) {
        console.error('Failed to decrease from cart:', err)
        triggerToast(t('error_generic') || 'Error', 'error')
    } finally {
        addingToCart.value = false
    }
}

const nextImage = () => {
    if (carouselImages.value.length <= 1) return
    currentImageIndex.value = (currentImageIndex.value + 1) % carouselImages.value.length
}

const prevImage = () => {
    if (carouselImages.value.length <= 1) return
    currentImageIndex.value =
        (currentImageIndex.value - 1 + carouselImages.value.length) % carouselImages.value.length
}

const goToImage = (index) => {
    currentImageIndex.value = index
}

const toggleWishlist = async () => {
    if (!product.value) return
    
    try {
        if (isInWishlist.value) {
            // Remove from wishlist
            await axios.delete(
                `${API.link}/wishlist/${product.value.id}`,
                {
                    auth: {
                        username: API.username,
                        password: API.password
                    }
                }
            )
            isInWishlist.value = false
        } else {
            // Add to wishlist
            await axios.post(
                `${API.link}/wishlist`,
                { productId: product.value.id },
                {
                    auth: {
                        username: API.username,
                        password: API.password
                    }
                }
            )
            isInWishlist.value = true
        }
    } catch (err) {
        console.error('Failed to update wishlist:', err)
    }
}

const checkWishlist = async () => {
    if (!product.value) return
    
    try {
        const response = await axios.get(
            `${API.link}/wishlist`,
            {
                auth: {
                    username: API.username,
                    password: API.password
                }
            }
        )
        
        const wishlist = response.data.data || response.data
        isInWishlist.value = wishlist.some(item => item.productId === product.value.id)
    } catch (err) {
        console.warn('Failed to check wishlist:', err)
    }
}

const goBack = async () => {
    router.back()
}

// Lifecycle
onMounted(() => {
    fetchProduct()
})

onBeforeUnmount(() => {
    if (toastTimer.value) clearTimeout(toastTimer.value)
})

</script>

<style scoped>
:root {
    --primary: #ff5722;
    --secondary: #f5f5f5;
}

.product-page-container {
    min-height: 100vh;
    background: #ffffff;
    padding-bottom: 80px;
}

/* Header */
.product-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: white;
    border-bottom: 1px solid #ecf0f1;
    position: sticky;
    top: 0;
    z-index: 100;
}

.product-header h1 {
    margin: 0;
    font-size: 20px;
    color: #2c3e50;
    font-weight: 600;
    flex: 1;
    text-align: center;
}

.back-btn {
    background: none;
    border: none;
    color: #2c3e50;
    font-size: 20px;
    cursor: pointer;
    padding: 8px;
    border-radius: 6px;
    transition: all 0.3s ease;
    width: 44px;
    height: 44px;
    position: absolute;
    left: 12px;
    top: -52px
}

.back-btn:hover {
    background: var(--secondary);
    color: var(--primary);
}

.header-spacer {
    width: 44px;
}

/* Loading State */
.loading-state {
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
}

.skeleton-product {
    width: 100%;
    max-width: 500px;
}

.skeleton-image {
    height: 300px;
    background: linear-gradient(90deg, #f0f0f0 0%, #e6e6e6 50%, #f0f0f0 100%);
    background-size: 200% 100%;
    border-radius: 12px;
    margin-bottom: 20px;
    animation: shimmer 1.2s linear infinite;
}

.skeleton-title, .skeleton-price, .skeleton-text {
    height: 16px;
    background: linear-gradient(90deg, #f0f0f0 0%, #e6e6e6 50%, #f0f0f0 100%);
    background-size: 200% 100%;
    border-radius: 6px;
    margin-bottom: 12px;
    animation: shimmer 1.2s linear infinite;
}

.skeleton-price {
    width: 60%;
}

.skeleton-text:last-child {
    width: 80%;
}

@keyframes shimmer {
    0% { background-position: 200% 0 }
    100% { background-position: -200% 0 }
}

/* Error State */
.error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    padding: 20px;
    text-align: center;
}

.error-state i {
    font-size: 64px;
    color: #ff6b6b;
    margin-bottom: 20px;
}

.error-message {
    color: #2c3e50;
    font-size: 16px;
    margin-bottom: 20px;
}

/* Product Image Section */
.product-image-section {
    position: relative;
    width: 100%;
    min-height: 450px;
    background: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

.product-image {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
}

.product-image img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    padding: 20px;
}

.carousel-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.4);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 2;
}

.carousel-btn.prev {
    left: 10px;
}

.carousel-btn.next {
    right: 10px;
}

.carousel-dots {
    position: absolute;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 8px;
    z-index: 2;
}

.carousel-dot {
    width: 8px;
    height: 8px;
    border: none;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.25);
    cursor: pointer;
    padding: 0;
}

.carousel-dot.active {
    background: rgba(0, 0, 0, 0.5);
}

.product-image-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-size: 64px;
}

/* Stock Badge */
.stock-badge {
    position: absolute;
    top: 20px;
    right: 20px;
    padding: 8px 16px;
    border-radius: 50px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
}

.stock-badge.in-stock {
    background: rgba(76, 175, 80, 0.9);
    color: white;
}

.stock-badge.out-of-stock {
    background: rgba(244, 67, 54, 0.9);
    color: white;
}

/* Product Info */
.product-info {
    padding: 24px 20px;
}

.product-header-info {
    margin-bottom: 20px;
}

.product-name {
    font-size: 24px;
    font-weight: 700;
    color: #2c3e50;
    margin: 0 0 8px 0;
}

.product-category {
    color: #7f8c8d;
    font-size: 14px;
    margin: 0;
}

/* Price Section */
.price-section {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 5px;
    padding: 16px;
    padding-top: 20px;
    border-radius: 12px;
}

.price {
    font-size: 32px;
    font-weight: 700;
    color: var(--primary);
}

.stock-info {
    color: #7f8c8d;
    font-size: 13px;
}

/* Sections */
.section-label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

/* Color Section */
.color-section {
    margin-bottom: 20px;
}

.color-value {
    background: #f5f5f5;
    padding: 12px 16px;
    border-radius: 8px;
    color: #2c3e50;
    margin: 0;
    font-size: 14px;
}

/* Description Section */
.description-section {
    margin-bottom: 24px;
}

.description-text {
    background: #f5f5f5;
    padding: 16px;
    border-radius: 8px;
    color: #555;
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
}

/* Properties Section */
.properties-section {
    margin-bottom: 24px;
    padding: 16px;
    background: #f5f5f5;
    border-radius: 12px;
}

.properties-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.property-item {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid #ecf0f1;
}

.property-item:last-child {
    border-bottom: none;
}

.property-key {
    font-weight: 600;
    color: #2c3e50;
    font-size: 13px;
}

.property-value {
    color: #7f8c8d;
    font-size: 13px;
    text-align: right;
}

/* Action Buttons */
.action-buttons {
    display: flex;
    gap: 12px;
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid #ecf0f1;
}

.btn {
    flex: 1;
    padding: 14px 16px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.btn-primary {
    background: var(--primary);
    color: white;
}

.btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(255, 87, 34, 0.4);
}

.btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn-secondary {
    background: white;
    color: var(--primary);
    border: 2px solid var(--primary);
    flex: 0.5;
}

.btn-secondary:hover {
    background: var(--primary);
    color: white;
}

.btn-secondary.active {
    background: var(--primary);
    color: white;
}

.btn-disabled {
    background: #95a5a6;
    color: white;
    cursor: not-allowed;
    flex: 1;
}

/* Empty State */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    padding: 20px;
    text-align: center;
}

.empty-state i {
    font-size: 64px;
    color: #bdc3c7;
    margin-bottom: 20px;
}

.empty-state p {
    color: #7f8c8d;
    font-size: 16px;
    margin-bottom: 20px;
}

.retry-btn {
    background: var(--primary);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.3s ease;
}

.retry-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 87, 34, 0.4);
}

/* Responsive Design */
@media (max-width: 768px) {
    .product-info {
        padding: 16px 20px;
    }

    .product-name {
        font-size: 20px;
    }

    .price {
        font-size: 28px;
    }

    .product-image-section {
        height: 280px;
    }
}

@media (max-width: 480px) {
    .product-page-container {
        padding-bottom: 100px;
    }

    .product-image-section {
        height: 240px;
    }

    .product-info {
        padding: 14px 16px;
    }

    .product-name {
        font-size: 18px;
    }

    .price {
        font-size: 24px;
    }

    .action-buttons {
        gap: 8px;
    }

    .btn {
        padding: 12px 12px;
        font-size: 13px;
    }
}

/* Fixed Bottom Bar */
.fixed-bottom-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    border-top: 1px solid #eee;
    padding: 12px 16px;
    box-shadow: 0 -2px 8px rgba(0,0,0,0.08);
    z-index: 100;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
}

.fixed-bottom-bar .price-section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 90px;
    flex-shrink: 0;
}

.fixed-bottom-bar .price-section .price {
    font-size: 18px;
    font-weight: 700;
    color: var(--primary);
}

.fixed-bottom-bar .stock-info {
    font-size: 12px;
    color: #7f8c8d;
    margin-top: 4px;
}

.fixed-bottom-bar .btn {
    flex: 1;
    padding: 10px 16px;
    font-size: 14px;
    min-height: 44px;
}

.qty-control {
    flex: 1;
    display: grid;
    grid-template-columns: 42px 1fr 42px;
    align-items: center;
    gap: 10px;
}

.qty-btn {
    width: 42px;
    height: 42px;
    border: none;
    border-radius: 10px;
    background: #ffe8e1;
    color: var(--primary);
    font-size: 24px;
    line-height: 1;
    font-weight: 700;
}

.qty-btn:disabled {
    opacity: 0.45;
}

.qty-value {
    text-align: center;
    font-size: 18px;
    font-weight: 800;
    color: #2c3e50;
}

@media (max-width: 480px) {
    .product-page-container {
        padding-bottom: 100px;
    }

    .fixed-bottom-bar {
        flex-direction: row;
        gap: 8px;
    }

    .fixed-bottom-bar .price-section {
        min-width: 70px;
    }

    .fixed-bottom-bar .price {
        font-size: 16px;
    }

    .fixed-bottom-bar .btn {
        flex: 1;
        padding: 10px 12px;
        font-size: 13px;
    }

}

/* Toast Notification */
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 2000;
  animation: slideInUp 0.25s ease-out;
}
@keyframes slideInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.toast.success { background: #27ae60; color: white; }
.toast.error { background: #e74c3c; color: white; }
.toast-enter-active, .toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(20px); }
</style>
