<template>
    <div class="categories-container">
        
        <!-- Sticky Header with Search -->
        <div class="sticky-header" style="margin-top: 20px;">
            <div class="header-content">
                <!-- Back Button & Breadcrumb -->
                <div class="header-top">
                    <button 
                        v-if="breadcrumb.length > 0"
                        class="back-button"
                        @click="goBack"
                        :aria-label="$t('back') || 'Go back'"
                        title="Go back"
                        
                    >
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <div v-if="breadcrumb.length > 0" class="breadcrumb-path" role="navigation" aria-label="breadcrumb">
                        <span v-for="(item, index) in breadcrumb" :key="index" class="breadcrumb-item">
                            {{ item.name }}
                            <i v-if="index < breadcrumb.length - 1" class="fas fa-chevron-right" aria-hidden="true"></i>
                        </span>
                    </div>
                </div>
            </div>
        </div>


        <!-- Loading Shimmer State -->
        <div v-if="loading && categories.length === 0" class="categories-content">
            <transition-group name="list" tag="div" class="categories-list">
                <div v-for="i in 5" :key="`skeleton-${i}`" class="category-list-item skeleton-item">
                    <div class="skeleton-icon"></div>
                    <div class="skeleton-info">
                        <div class="skeleton-text skeleton-title"></div>
                        <div class="skeleton-text skeleton-subtitle"></div>
                    </div>
                    <div class="skeleton-badge"></div>
                </div>
            </transition-group>
        </div>

        <!-- Overlay Loader (when selecting category) -->
        <transition name="fade">
            <div v-if="loading && breadcrumb.length > 0" class="overlay-loader">
                <div class="spinner-wrapper">
                    <div class="spinner"></div>
                    <p class="loader-text">{{ $t('loading') || 'Loading...' }}</p>
                </div>
            </div>
        </transition>

        <!-- Categories List -->
        <transition :name="transitionName" v-if="!loading || categories.length > 0">
            <div v-if="filteredCategories.length > 0" class="categories-content" key="categories-view">
                <transition-group name="list" tag="div" class="categories-list">
                    <!-- All Products Button -->
                    <div
                        v-if="breadcrumb.length > 0"
                        :key="`all-products-${currentCategoryId}`"
                        class="category-list-item"
                        style="
                        margin-bottom: 20px;
                        "
                        @click="fetchAllProducts()"
                        role="button"
                        tabindex="0"
                        @keydown.enter="fetchAllProducts()"
                        @keydown.space.prevent="fetchAllProducts()"
                        :aria-label="`View all products in ${breadcrumb[breadcrumb.length - 1]?.name}`"
                    >
                        <div class="category-item-icon" aria-hidden="true">
                            <i class="fas fa-th"></i>
                        </div>
                        <div class="category-item-info">
                            <h3>{{ $t('allProducts') || 'All Products' }}</h3>
                        </div>
                        <div class="category-item-arrow" aria-hidden="true">
                            <i class="fas fa-chevron-right"></i>
                        </div>
                    </div>

                    <div
                        v-for="(category, index) in filteredCategories"
                        :key="category.id"
                        class="category-list-item"
                        :class="{ 'disabled-category': category.items === 0 }"
                        :style="{'--i': index}"
                        @click="category.items > 0 && selectCategory(category)"
                        role="button"
                        tabindex="0"
                        @keydown.enter="category.items > 0 && selectCategory(category)"
                        @keydown.space.prevent="category.items > 0 && selectCategory(category)"
                        :aria-disabled="category.items === 0"
                        :aria-label="`${category.name}, ${category.items} items`"
                    >
                        <div class="category-item-icon" aria-hidden="true">
                            <i :class="getCategoryIcon(category.name)"></i>
                        </div>
                        <div class="category-item-info">
                            <h3>{{ category.name }}</h3>
                        </div>
                        <div class="category-item-badge" aria-hidden="true" >
                            <span class="badge" style="background: var(--bs-primary);">
                            {{ category.items }}
                            </span>
                        </div>
                    </div>
                </transition-group>
            </div>
            <div v-else class="empty-state">
                <i class="fas fa-search"></i>
                <p>{{ $t('noResults') || 'No categories found' }}</p>
                <button class="clear-btn" @click="clearSearch">
                    {{ $t('clearSearch') || 'Clear Search' }}
                </button>
            </div>
        </transition>



        <!-- Category Details Modal -->
        <div v-if="selectedCategory" class="modal-overlay" @click="selectedCategory = null">
            <div class="modal-content" @click.stop role="dialog" aria-modal="true" aria-label="Category details">
                <button class="modal-close" @click="selectedCategory = null" aria-label="Close modal" title="Close">&times;</button>

                <div class="modal-header">
                    <div v-if="selectedCategory.image" class="modal-image">
                        <img :src="selectedCategory.image" :alt="selectedCategory.name" />
                    </div>
                    <div v-else class="modal-image-placeholder" aria-hidden="true">
                        <i :class="getCategoryIcon(selectedCategory.name)"></i>
                    </div>
                </div>

                <div class="modal-body">
                    <h2>{{ selectedCategory.name }}</h2>
                    <p class="modal-description">{{ selectedCategory.description || 'Category' }}</p>

                    <div class="modal-stats">
                        <div class="stat">
                            <span class="stat-value">{{ getCatalogCount(selectedCategory.id) }}</span>
                            <span class="stat-label">{{ $t('items') }}</span>
                        </div>
                    </div>

                    <p v-if="selectedCategory.details" class="modal-details">
                        {{ selectedCategory.details }}
                    </p>

                    <button class="browse-btn" @click="browseCatalog">
                        {{ $t('browseCatalog') }}
                        <i class="fas fa-chevron-right" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- Bottom Navigation Bar -->
        <nav class="bottom-navbar" role="navigation" aria-label="Main navigation">
            <button
                class="nav-item"
                :class="{ active: currentNav === 'home' }"
                @click="navigateTo('home')"
                :aria-label="`${$t('home') || 'Home'} - ${currentNav === 'home' ? 'Current page' : 'Navigate'}`"
                title="Home"
            >
                <i class="fas fa-home" aria-hidden="true"></i>
                <span class="nav-label">{{ $t('home') || 'Home' }}</span>
            </button>
            
            <button
                class="nav-item"
                :class="{ active: currentNav === 'catalog' }"
                @click="navigateTo('catalog')"
                :aria-label="`${$t('catalog') || 'Catalog'} - ${currentNav === 'catalog' ? 'Current page' : 'Navigate'}`"
                title="Catalog"
            >
                <i class="fas fa-list" aria-hidden="true"></i>
                <span class="nav-label">{{ $t('catalog') || 'Catalog' }}</span>
            </button>
            
            <button
                class="nav-item"
                :class="{ active: currentNav === 'cart' }"
                @click="navigateTo('cart')"
                :aria-label="`${$t('cart') || 'Cart'} - ${currentNav === 'cart' ? 'Current page' : 'Navigate'}`"
                title="Cart"
            >
                <i class="fas fa-shopping-cart" aria-hidden="true"></i>
                <span class="nav-label">{{ $t('cart') || 'Cart' }}</span>
                <span v-if="cartCount > 0" class="cart-badge">{{ cartCount }}</span>
            </button>
            
            <button
                class="nav-item"
                :class="{ active: currentNav === 'favorites' }"
                @click="navigateTo('favorites')"
                :aria-label="`${$t('favorites') || 'Favorites'} - ${currentNav === 'favorites' ? 'Current page' : 'Navigate'}`"
                title="Favorites"
            >
                <i class="fas fa-heart" aria-hidden="true"></i>
                <span class="nav-label">{{ $t('favorites') || 'Favorites' }}</span>
                <span v-if="favoritesCount > 0" class="favorites-badge">{{ favoritesCount }}</span>
            </button>
            
            <button
                class="nav-item"
                :class="{ active: currentNav === 'profile' }"
                @click="navigateTo('profile')"
                :aria-label="`${$t('profile') || 'Profile'} - ${currentNav === 'profile' ? 'Current page' : 'Navigate'}`"
                title="Profile"
            >
                <i class="fas fa-user" aria-hidden="true"></i>
                <span class="nav-label">{{ $t('profile') || 'Profile' }}</span>
            </button>
        </nav>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import axios from 'axios'
import LoadingSpinner from './LoadingSpinner.vue'
import { API } from '../variable/link.js'

const { t } = useI18n()
const router = useRouter()

// State
const categories = ref([])
const catalogs = ref([])
const loading = ref(false)
const error = ref(null)
const searchQuery = ref('')
const selectedCategory = ref(null)
const breadcrumb = ref([])
const currentCategoryId = ref(null)
const navigationDirection = ref('forward')
const showRecentSearches = ref(false)
const recentSearches = ref([])
const currentNav = ref('catalog')
const cartCount = ref(0)
const favoritesCount = ref(0)
const searchTimeout = ref(null) // For debounce

const STORAGE_KEY = 'categoriesViewState'
const RECENT_SEARCHES_KEY = 'recentSearches'

// Load recent searches from localStorage
const loadRecentSearches = () => {
    try {
        const raw = localStorage.getItem(RECENT_SEARCHES_KEY)
        if (raw) {
            recentSearches.value = JSON.parse(raw).slice(0, 5) // Limit to 5
        }
    } catch (e) {
        console.warn('Failed to load recent searches', e)
    }
}

// Save recent searches to localStorage
const saveRecentSearches = () => {
    try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recentSearches.value))
    } catch (e) {
        console.warn('Failed to save recent searches', e)
    }
}

const saveState = () => {
    try {
        const payload = {
            categories: categories.value,
            breadcrumb: breadcrumb.value,
            currentCategoryId: currentCategoryId.value,
            navigationDirection: navigationDirection.value
        }
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch (e) {
        console.warn('Failed to save categories view state', e)
    }
}

const loadState = () => {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY)
        if (!raw) return false
        const obj = JSON.parse(raw)
        if (obj?.categories) categories.value = obj.categories
        if (obj?.breadcrumb) breadcrumb.value = obj.breadcrumb
        if (obj?.currentCategoryId) currentCategoryId.value = obj.currentCategoryId
        if (obj?.navigationDirection) navigationDirection.value = obj.navigationDirection
        return true
    } catch (e) {
        console.warn('Failed to load categories view state', e)
        return false
    }
}

const clearState = () => {
    try { sessionStorage.removeItem(STORAGE_KEY) } catch (e) { /* ignore */ }
}

// Computed
const transitionName = computed(() => navigationDirection.value === 'forward' ? 'slide-right' : 'slide-left')

const filteredCategories = computed(() => {
    if (!searchQuery.value) {
        return categories.value
    }
    const query = searchQuery.value.toLowerCase()
    return categories.value.filter(category =>
        category.name.toLowerCase().includes(query) ||
        (category.description && category.description.toLowerCase().includes(query))
    )
})

// Methods
const getCategoryIcon = (categoryName) => {
    const iconMap = {
        'Food': 'fas fa-utensils',
        'Electronics': 'fas fa-laptop',
        'Clothing': 'fas fa-shirt',
        'Home': 'fas fa-home',
        'Sports': 'fas fa-dumbbell',
        'Books': 'fas fa-book',
        'Toys': 'fas fa-gamepad',
        'Fashion': 'fas fa-crown',
        'Beauty': 'fas fa-spa',
        'Health': 'fas fa-heart',
        'Travel': 'fas fa-plane',
        'Entertainment': 'fas fa-film',
    }
    return iconMap[categoryName] || 'fas fa-box'
}

const getCatalogCount = (categoryId) => {
    return catalogs.value.filter(c => c.categoryId === categoryId).length
}

// Search handling with debounce
const onSearchInput = () => {
    // Clear existing timeout
    if (searchTimeout.value) clearTimeout(searchTimeout.value)
    
    // Add to recent searches if not empty
    if (searchQuery.value && !recentSearches.value.includes(searchQuery.value)) {
        recentSearches.value.unshift(searchQuery.value)
        if (recentSearches.value.length > 5) recentSearches.value.pop()
        saveRecentSearches()
    }
    
    // Debounce search execution (300ms)
    searchTimeout.value = setTimeout(() => {
        // Filter happens automatically through computed property
        showRecentSearches.value = false
    }, 300)
}

const clearSearch = () => {
    searchQuery.value = ''
    showRecentSearches.value = false
    if (searchTimeout.value) clearTimeout(searchTimeout.value)
}

const selectRecentSearch = (search) => {
    searchQuery.value = search
    showRecentSearches.value = false
    onSearchInput()
}

const clearRecentSearches = () => {
    recentSearches.value = []
    saveRecentSearches()
}

const selectCategory = (category) => {
    if (category.items === 0) return // Don't select empty categories
    
    breadcrumb.value.push(category)
    const id = category.id || category.ID || category.categoryID
    currentCategoryId.value = id
    navigationDirection.value = 'forward'
    fetchSubcategories(currentCategoryId.value)
}

const browseCatalog = () => {
    router.push({
        name: 'catalog',
        query: { categoryId: selectedCategory.value.id }
    })
    selectedCategory.value = null
}

const fetchAllProducts = async () => {
    if (!currentCategoryId.value) return
    
    loading.value = true
    error.value = null
    try {
        router.push({
            name: 'products',
            params: { categoryId: currentCategoryId.value},
            query: { limit: 20, page: 2 }
        })
    } catch (err) {
        console.error('Failed to fetch all products:', err)
        error.value = t('failedToLoadProducts') || 'Failed to load products'
    } finally {
        loading.value = false
    }
}

const goBack = async () => {
    if (breadcrumb.value.length > 0) {
        navigationDirection.value = 'back'
        breadcrumb.value.pop()
        
        if (breadcrumb.value.length === 0) {
            await fetchCategories()
            currentCategoryId.value = null
            clearState()
        } else {
            const parentCategory = breadcrumb.value[breadcrumb.value.length - 1]
            const parentId = parentCategory.id || parentCategory.ID || parentCategory.categoryID
            currentCategoryId.value = parentId
            await fetchSubcategories(currentCategoryId.value)
            saveState()
        }
    }
}

const fetchCategories = async () => {
    loading.value = true
    error.value = null
    try {
        const categoryResponse = await axios.get(`${API.link}/category`, {
            auth: {
                username: API.username,
                password: API.password
            }
        })
        console.log(categoryResponse.data)
        
        const raw = categoryResponse.data.data || []
        categories.value = raw.map(item => ({ ...item, id: item.id || item.ID || item.categoryID }))
        breadcrumb.value = []
        currentCategoryId.value = null
        
        try {
            const catalogResponse = await axios.get(`${API.link}/catalogs`, {
                auth: {
                    username: API.username,
                    password: API.password
                }
            })
            catalogs.value = catalogResponse.data || []
        } catch (e) {
            console.warn('Failed to fetch catalogs for counts', e)
            catalogs.value = []
        }

        await nextTick()
        try { window.scrollTo({ top: 0, behavior: 'smooth' }) } catch (e) { /* ignore */ }
    } catch (err) {
        console.error('Failed to fetch categories:', err)
        error.value = null
    } finally {
        loading.value = false
    }
}

const fetchSubcategories = async (categoryId) => {
    loading.value = true
    error.value = null
    try {
        const response = await axios.get(`${API.link}/category?categoryID=${categoryId}`, {
            auth: {
                username: API.username,
                password: API.password
            }
        })
        
        const raw = response.data.data || []
        categories.value = raw.map(item => ({ ...item, id: item.id || item.ID || item.categoryID }))
        console.log(`Fetched subcategories for ${categoryId}:`, categories.value)

        await nextTick()
        try { window.scrollTo({ top: 0, behavior: 'smooth' }) } catch (e) { /* ignore */ }
        saveState()
        
    } catch (err) {
        if (err.response?.status === 404 || err.response?.status === 400) {
            console.log(`No subcategories for ${categoryId}, navigating to products`)
            saveState()
            router.push({ name: 'products', params: { categoryId: categoryId } })
        } else {
            console.error('Failed to fetch subcategories:', err)
            error.value = t('failedToLoadSubcategories') || 'Failed to load subcategories'
        }
    } finally {
        loading.value = false
    }
}

// Navigation 
const navigateTo = (page) => {
    currentNav.value = page
    const routeMap = {
        'home': 'home',
        'catalog': 'categories',
        'cart': 'cart',
        'favorites': 'favorites',
        'profile': 'profile'
    }
    
    if (routeMap[page]) {
        router.push({ name: routeMap[page] })
    }
}

// Load mock data for badges (replace with actual API later)
const loadNavigationData = () => {
    cartCount.value = 3 // Mock data
    favoritesCount.value = 5 // Mock data
}

// Lifecycle
onMounted(() => {
    loadRecentSearches()
    loadNavigationData()
    
    const restored = loadState()
    if (!restored) fetchCategories()

})

onBeforeUnmount(() => {
    if (searchTimeout.value) clearTimeout(searchTimeout.value)
    
})
</script>

<style scoped>
:root {
    --primary: #ff5722;
}

.categories-container {
    min-height: 100vh;
    background: #ffffff;
    padding: 20px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.categories-header {
    text-align: center;
    margin-bottom: 40px;
    padding-top: 20px;
    color: #2c3e50;
}

.categories-header h1 {
    font-size: 36px;
    color: #2c3e50;
    margin-bottom: 10px;
    font-weight: 700;
    text-shadow: none;
}

.subtitle {
    color: #7f8c8d;
    font-size: 16px;
    margin: 0;
}

.loading-state {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
}

.error-state {
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 12px;
    padding: 30px;
    text-align: center;
    margin: 20px;
    backdrop-filter: blur(10px);
}

.error-message {
    color: #ff6b6b;
    margin-bottom: 15px;
    font-size: 16px;
}

.retry-btn {
    background: #ff6b6b;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s ease;
}

.retry-btn:hover {
    background: #ff5252;
    transform: translateY(-2px);
}

/* Search Container */
.search-container {
    margin-bottom: 40px;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
}

.search-box {
    position: relative;
}

.search-input {
    width: 100%;
    padding: 15px 45px 15px 20px;
    border: none;
    border-radius: 50px;
    font-size: 16px;
    background: white;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
}

.search-input:focus {
    outline: none;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
    transform: translateY(-2px);
}

.search-box i {
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--primary);
    font-size: 18px;
}

/* Categories Content */
.categories-content {
    max-width: 1200px;
    margin: 0 auto;
}

.categories-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.category-list-item {
    background: white;
    border-radius: 12px;
    padding: 10px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    cursor: pointer;
    border-left: 4px solid transparent;
    min-height: 52px;
}

.category-list-item:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    border-left-color: var(--primary);
    transform: translateX(4px);
}

.category-item-icon {
    width: 40px;
    height: 40px;
    background: var(--primary);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    color: white;
    flex-shrink: 0;
}

.category-item-info {
    flex: 1;
}

.category-item-info h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: #2c3e50;
}

.items-info {
    margin: 2px 0 0 0;
    font-size: 11px;
    color: #bdc3c7;
    display: flex;
    align-items: center;
    gap: 4px;
    opacity: 0.7;
}

.items-info i {
    color: #7f8c8d;
    font-size: 10px;
}

.category-item-arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background: #ecf0f1;
    color: var(--primary);
    font-size: 16px;
    flex-shrink: 0;
    transition: all 0.3s ease;
}

.category-list-item:hover .category-item-arrow {
    background: var(--primary);
    color: white;
}

.all-products-item {
    background: linear-gradient(135deg, #ff5722 0%, #ff7043 100%);
    color: white;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(255, 87, 34, 0.3);
}

.all-products-item:hover {
    box-shadow: 0 6px 20px rgba(255, 87, 34, 0.4);
    border-left-color: white;
}

.all-products-item .category-item-icon {
    background: rgba(255, 255, 255, 0.3);
}

.all-products-item .category-item-info h3 {
    color: white;
}

.all-products-item .items-info {
    color: rgba(255, 255, 255, 0.9);
}

.all-products-item .items-info i {
    color: rgba(255, 255, 255, 0.9);
}

.all-products-item:hover .category-item-arrow {
    background: white;
    color: var(--primary);
}

.categories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
}

.category-card-large {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    height: 100%;
}

.category-card-large:hover {
    transform: translateY(-12px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.card-image-container {
    width: 100%;
    height: 200px;
    overflow: hidden;
    background: var(--primary);
    position: relative;
}

.card-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}

.category-card-large:hover .card-image {
    transform: scale(1.1);
}

.card-image-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--primary);
    font-size: 64px;
    color: white;
}

.card-content {
    padding: 24px;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
}

.card-content h3 {
    font-size: 20px;
    color: #2c3e50;
    margin: 0 0 8px 0;
    font-weight: 700;
}

.category-description {
    font-size: 14px;
    color: #7f8c8d;
    margin: 0 0 15px 0;
}

.category-stats {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 15px;
    padding-bottom: 15px;
    border-bottom: 1px solid #ecf0f1;
}

.items-count {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--primary);
    font-size: 13px;
    font-weight: 600;
}

.items-count i {
    font-size: 14px;
}

.view-btn {
    background: var(--primary);
    color: white;
    border: none;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: auto;
}

.view-btn:hover {
    transform: translateX(4px);
    box-shadow: 0 4px 12px rgba(255, 87, 34, 0.4);
}

/* Empty State */
.empty-state {
    text-align: center;
    padding: 80px 20px;
    color: #7f8c8d;
}

.empty-state i {
    font-size: 64px;
    opacity: 0.8;
    margin-bottom: 20px;
}

.empty-state p {
    font-size: 18px;
    margin-bottom: 20px;
}

.clear-btn {
    background: #ecf0f1;
    color: var(--primary);
    border: 2px solid var(--primary);
    padding: 10px 24px;
    border-radius: 25px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s ease;
}

.clear-btn:hover {
    background: var(--primary);
    color: white;
}

/* Modal */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
    animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

.modal-content {
    background: white;
    border-radius: 16px;
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    animation: slideUp 0.3s ease;
}

@keyframes slideUp {
    from {
        transform: translateY(30px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.modal-close {
    position: absolute;
    top: 15px;
    right: 15px;
    background: rgba(0, 0, 0, 0.1);
    border: none;
    font-size: 28px;
    color: #2c3e50;
    cursor: pointer;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    transition: all 0.3s ease;
}

.modal-close:hover {
    background: rgba(0, 0, 0, 0.2);
    transform: rotate(90deg);
}

.modal-header {
    height: 250px;
    overflow: hidden;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.modal-image {
    width: 100%;
    height: 100%;
}

.modal-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.modal-image-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 80px;
    color: white;
    background: var(--primary);
}

.modal-body {
    padding: 30px;
}

.modal-body h2 {
    font-size: 28px;
    color: #2c3e50;
    margin: 0 0 12px 0;
    font-weight: 700;
}

.modal-description {
    color: #7f8c8d;
    font-size: 16px;
    margin: 0 0 24px 0;
    line-height: 1.6;
}

.modal-stats {
    display: flex;
    gap: 20px;
    margin-bottom: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid #ecf0f1;
}

.stat {
    text-align: center;
}

.stat-value {
    display: block;
    font-size: 28px;
    font-weight: 700;
    color: var(--primary);
    margin-bottom: 4px;
}

.stat-label {
    display: block;
    font-size: 12px;
    color: #95a5a6;
    text-transform: uppercase;
    font-weight: 600;
}

.modal-details {
    color: #555;
    font-size: 14px;
    line-height: 1.8;
    margin-bottom: 24px;
}

.browse-btn {
    width: 100%;
    background: var(--primary);
    color: white;
    border: none;
    padding: 14px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
}

.browse-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(255, 87, 34, 0.4);
}

/* Responsive Design */
@media (max-width: 768px) {
    .categories-header h1 {
        font-size: 28px;
    }

    .category-list-item {
        padding: 10px 14px;
        gap: 10px;
        min-height: 48px;
    }

    .category-item-info h3 {
        font-size: 14px;
    }

    .modal-header {
        height: 200px;
    }
}

@media (max-width: 480px) {
    .categories-container {
        padding: 10px;
    }

    .categories-header {
        margin-bottom: 30px;
        padding-top: 10px;
    }

    .categories-header h1 {
        font-size: 24px;
    }

    .subtitle {
        font-size: 14px;
    }

    .category-list-item {
        padding: 8px 12px;
        gap: 8px;
        min-height: 44px;
    }

    .category-item-icon {
        width: 36px;
        height: 36px;
        font-size: 16px;
    }

    .category-item-info h3 {
        font-size: 13px;
    }

    .items-info {
        font-size: 12px;
    }

    .category-item-arrow {
        width: 28px;
        height: 28px;
        font-size: 14px;
    }

    .badge {
        min-width: 24px;
        height: 24px;
        padding: 0 6px;
        font-size: 11px;
    }

    .modal-body {
        padding: 20px;
    }

    .modal-body h2 {
        font-size: 22px;
    }

    .modal-header {
        height: 180px;
    }
}

/* Slide animations for category navigation */
.slide-right-enter-active, .slide-right-leave-active,
.slide-left-enter-active, .slide-left-leave-active {
    transition: transform 320ms ease, opacity 320ms ease;
}

.slide-right-enter-from {
    transform: translateX(30%);
    opacity: 0;
}
.slide-right-enter-to {
    transform: translateX(0);
    opacity: 1;
}
.slide-right-leave-from {
    transform: translateX(0);
    opacity: 1;
}
.slide-right-leave-to {
    transform: translateX(-20%);
    opacity: 0;
}

.slide-left-enter-from {
    transform: translateX(-30%);
    opacity: 0;
}
.slide-left-enter-to {
    transform: translateX(0);
    opacity: 1;
}
.slide-left-leave-from {
    transform: translateX(0);
    opacity: 1;
}
.slide-left-leave-to {
    transform: translateX(20%);
    opacity: 0;
}

/* Breadcrumb Navigation */
.breadcrumb-nav {
    margin-bottom: 30px;
    padding: 0 20px;
}

.breadcrumb-back {
    background: #ff5722;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    margin-bottom: 15px;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.breadcrumb-back:hover {
    background: #ff4500;
    transform: translateX(-2px);
}

.breadcrumb-path {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    padding: 10px;
    background: #f5f5f5;
    border-radius: 6px;
}

.breadcrumb-item {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #2c3e50;
    font-size: 14px;
}

.breadcrumb-item:last-child {
    font-weight: 600;
    color: #ff5722;
}

.breadcrumb-item i {
    font-size: 12px;
    color: #bdc3c7;
}

/* Overlay Loader */
.overlay-loader {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    backdrop-filter: blur(2px);
}

.spinner-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
}

.spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top: 4px solid #ff5722;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg) }
}

.loader-text {
    color: white;
    font-size: 16px;
    font-weight: 500;
    margin: 0;
}

/* Fade transition for overlay */
.fade-enter-active, .fade-leave-active {
    transition: opacity 200ms ease;
}

.fade-enter-from, .fade-leave-to {
    opacity: 0;
}

/* Sticky Header Styles */
.sticky-header {
    position: sticky;
    top: 0;
    background: white;
    z-index: 100;
    padding: 12px 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    margin-bottom: 20px;
}

.header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

.header-top {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
}

.back-button {
    background: none;
    border: none;
    color: var(--primary);
    font-size: 20px;
    cursor: pointer;
    padding: 8px;
    border-radius: 6px;
    transition: all 0.3s ease;
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.back-button:hover {
    background: rgba(255, 87, 34, 0.1);
}

.breadcrumb-path {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    flex: 1;
}

.breadcrumb-item {
    font-size: 13px;
    color: #7f8c8d;
}

.breadcrumb-item:last-child {
    color: var(--primary);
    font-weight: 600;
}

/* Search Box Styles */
.search-box-wrapper {
    position: relative;
}

.search-box {
    position: relative;
    display: flex;
    align-items: center;
}

.search-input {
    width: 100%;
    padding: 12px 40px 12px 40px;
    border: 2px solid #ecf0f1;
    border-radius: 25px;
    font-size: 14px;
    background: #f9f9f9;
    transition: all 0.3s ease;
    min-height: 44px;
}

.search-input:focus {
    outline: none;
    border-color: var(--primary);
    background: white;
    box-shadow: 0 4px 12px rgba(255, 87, 34, 0.15);
}

.search-box i {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: #7f8c8d;
    font-size: 16px;
    pointer-events: none;
}

.clear-search-btn {
    position: absolute;
    right: 14px;
    background: none;
    border: none;
    color: #7f8c8d;
    font-size: 16px;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    min-height: 32px;
    border-radius: 4px;
    transition: all 0.3s ease;
}

.clear-search-btn:hover {
    color: var(--primary);
    background: rgba(255, 87, 34, 0.1);
}

/* Recent Searches Dropdown */
.recent-searches-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    margin-top: 8px;
    z-index: 200;
    overflow: hidden;
    animation: slideDown 0.2s ease;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.recent-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid #ecf0f1;
    background: #f9f9f9;
}

.recent-header h4 {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: #2c3e50;
    text-transform: uppercase;
}

.clear-recent-btn {
    background: none;
    border: none;
    color: var(--primary);
    font-size: 11px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: 600;
    transition: all 0.3s ease;
}

.clear-recent-btn:hover {
    background: rgba(255, 87, 34, 0.1);
}

.recent-list {
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: 300px;
    overflow-y: auto;
}

.recent-list li {
    border-bottom: 1px solid #ecf0f1;
}

.recent-list li:last-child {
    border-bottom: none;
}

.recent-item {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 12px 16px;
    background: none;
    border: none;
    color: #2c3e50;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: left;
    gap: 12px;
}

.recent-item:hover {
    background: #f9f9f9;
    color: var(--primary);
}

.recent-item i {
    color: #7f8c8d;
    font-size: 13px;
    min-width: 16px;
}

/* Skeleton Loading Styles */
.skeleton-item {
    pointer-events: none;
    opacity: 0.6;
}

.skeleton-icon {
    width: 50px;
    height: 50px;
    border-radius: 10px;
    background: linear-gradient(90deg, #ecf0f1 25%, #e0e0e0 50%, #ecf0f1 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
}

.skeleton-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.skeleton-text {
    height: 12px;
    background: linear-gradient(90deg, #ecf0f1 25%, #e0e0e0 50%, #ecf0f1 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
}

.skeleton-title {
    width: 60%;
    height: 16px;
}

.skeleton-subtitle {
    width: 40%;
}

.skeleton-badge {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: linear-gradient(90deg, #ecf0f1 25%, #e0e0e0 50%, #ecf0f1 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}

/* Disabled Category Styles */
.disabled-category {
    opacity: 0.5;
    cursor: not-allowed;
}

.disabled-category:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transform: none;
    border-left-color: transparent;
}

/* Category Item Badge */
.category-item-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-left: auto;
}

.badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 28px;
    padding: 0 8px;
    background: var(--primary);
    color: white;
    border-radius: 14px;
    font-size: 12px;
    font-weight: 600;
    animation: badgePulse 0.3s ease;
}

@keyframes badgePulse {
    from {
        transform: scale(0.8);
        opacity: 0;
    }
    to {
        transform: scale(1);
        opacity: 1;
    }
}

/* Bottom Navigation Bar */
.bottom-navbar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    border-top: 1px solid #ecf0f1;
    display: flex;
    justify-content: space-around;
    align-items: stretch;
    z-index: 500;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
}

.nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 8px 4px;
    background: none;
    border: none;
    color: #7f8c8d;
    cursor: pointer;
    position: relative;
    transition: all 0.3s ease;
    min-height: 60px;
    border-radius: 0;
    font-size: 0;
}

.nav-item i {
    font-size: 22px;
    transition: all 0.3s ease;
}

.nav-label {
    font-size: 11px;
    font-weight: 500;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: all 0.3s ease;
}

.nav-item.active {
    color: var(--primary);
}

.nav-item.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--primary);
}

.nav-item:hover {
    background: rgba(255, 87, 34, 0.05);
    color: var(--primary);
}

.cart-badge,
.favorites-badge {
    position: absolute;
    top: 0;
    right: 4px;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    background: #ff6b6b;
    color: white;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: badgePulse 0.3s ease;
}

/* Adjust container for bottom navbar */
.categories-container {
    padding-bottom: 80px;
}

@media (max-width: 480px) {
    .sticky-header {
        padding: 8px 0;
    }

    .search-input {
        font-size: 13px;
        padding: 10px 36px;
        min-height: 40px;
    }

    .nav-item {
        min-height: 56px;
        padding: 4px 2px;
    }

    .nav-item i {
        font-size: 20px;
    }

    .nav-label {
        font-size: 10px;
    }
}
</style>
