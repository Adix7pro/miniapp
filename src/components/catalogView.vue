<template>
    <div class="catalog-container">
        <!-- Header -->
        <div class="catalog-header">
            <h1>{{ $t('catalog') }}</h1>
            <p class="subtitle">{{ $t('browseCategories') }}</p>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
            <LoadingSpinner />
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-state">
            <p class="error-message">{{ error }}</p>
            <button @click="fetchData" class="retry-btn">{{ $t('retry') }}</button>
        </div>

        <!-- Categories and Catalogs -->
        <div v-else class="catalog-content">
            <!-- Categories Section -->
            <div class="categories-section">
                <h2>{{ $t('categories') }}</h2>
                <div class="categories-grid">
                    <div
                        v-for="category in categories"
                        :key="category.id"
                        class="category-card"
                        @click="selectCategory(category)"
                        :class="{ active: selectedCategory?.id === category.id }"
                    >
                        <div class="category-icon">
                            <i :class="getCategoryIcon(category.name)"></i>
                        </div>
                        <h3>{{ category.name }}</h3>
                        <p class="category-count">{{ getCatalogCount(category.id) }} {{ $t('items') }}</p>
                    </div>
                </div>
            </div>

            <!-- Catalogs Section -->
            <div class="catalogs-section" v-if="filteredCatalogs.length > 0">
                <h2>
                    <span v-if="selectedCategory">{{ selectedCategory.name }}</span>
                    <span v-else>{{ $t('allCatalogs') }}</span>
                </h2>
                <div class="catalogs-grid">
                    <div
                        v-for="catalog in filteredCatalogs"
                        :key="catalog.id"
                        class="catalog-card"
                    >
                        <div class="catalog-image">
                            <img :src="catalog.image || '/placeholder.png'" :alt="catalog.name" />
                        </div>
                        <div class="catalog-info">
                            <h3>{{ catalog.name }}</h3>
                            <p class="catalog-description">{{ catalog.description }}</p>
                            <div class="catalog-footer">
                                <span class="price">{{ catalog.price }} {{ $t('points') }}</span>
                                <button class="details-btn" @click="viewDetails(catalog)">
                                    {{ $t('view') }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Empty State -->
            <div v-else class="empty-state">
                <p>{{ $t('noCatalogsFound') }}</p>
            </div>
        </div>

        <!-- Catalog Details Modal -->
        <div v-if="selectedCatalog" class="modal-overlay" @click="selectedCatalog = null">
            <div class="modal-content" @click.stop>
                <button class="modal-close" @click="selectedCatalog = null">&times;</button>
                <img :src="selectedCatalog.image || '/placeholder.png'" :alt="selectedCatalog.name" />
                <h2>{{ selectedCatalog.name }}</h2>
                <p>{{ selectedCatalog.description }}</p>
                <div class="modal-price">{{ selectedCatalog.price }} {{ $t('points') }}</div>
                <button class="order-btn" @click="orderCatalog">{{ $t('order') }}</button>
            </div>
    </div>
    </div>
     <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 1055">
    <div 
      v-for="toast in toasts" 
      :key="toast.id"
      class="toast show align-items-center border-0 mb-2 shadow-sm"
      :class="'text-white bg-' + toast.type"
      role="alert" 
      aria-live="assertive" 
      aria-atomic="true"
    >
      <div class="d-flex">
        <div class="toast-body">
          {{ toast.message }}
        </div>
        <button 
          type="button" 
          class="btn-close btn-close-white me-2 m-auto" 
          @click="remove(toast.id)"
        ></button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import LoadingSpinner from './LoadingSpinner.vue'
import { API } from '../variable/link.js'

const { t } = useI18n()

// State
const categories = ref([])
const catalogs = ref([])
const loading = ref(false)
const error = ref(null)
const selectedCategory = ref(null)
const selectedCatalog = ref(null)
const toasts = ref([]);

// Computed
const filteredCatalogs = computed(() => {
    if (!selectedCategory.value) {
        return catalogs.value
    }
    return catalogs.value.filter(catalog => catalog.categoryId === selectedCategory.value.id)
})

// Methods
const addToast = (message, type = 'success', duration = 3000) => {
  const id = Date.now();
  toasts.value.push({ id, message, type });

  // Belgilangan vaqtdan keyin o'chirish
  setTimeout(() => {
    remove(id);
  }, duration);
};

const getCategoryIcon = (categoryName) => {
    const iconMap = {
        'Food': 'fas fa-utensils',
        'Electronics': 'fas fa-laptop',
        'Clothing': 'fas fa-shirt',
        'Home': 'fas fa-home',
        'Sports': 'fas fa-dumbbell',
        'Books': 'fas fa-book',
        'Toys': 'fas fa-gamepad',
    }
    return iconMap[categoryName] || 'fas fa-box'
}

const getCatalogCount = (categoryId) => {
    return catalogs.value.filter(c => c.categoryId === categoryId).length
}

const selectCategory = (category) => {
    selectedCategory.value = selectedCategory.value?.id === category.id ? null : category
}

const viewDetails = (catalog) => {
    selectedCatalog.value = catalog
}

const orderCatalog = () => {
    alert(`${t('order')} for ${selectedCatalog.value.name} ${t('placed')}!`)
    selectedCatalog.value = null
}

const fetchData = async () => {
    loading.value = true
    error.value = null
    try {
        // Fetch categories
        const categoryResponse = await axios.get(`${API.link}/categories`, {
            auth: {
                username: API.username,
                password: API.password
            }
        })
        categories.value = categoryResponse.data || []

        // Fetch catalogs
        const catalogResponse = await axios.get(`${API.link}/catalogs`, {
            auth: {
                username: API.username,
                password: API.password
            }
        })
        catalogs.value = catalogResponse.data || []
    } catch (err) {
        console.error('Failed to fetch data:', err)
        error.value = t('loadError') || 'Failed to load data. Please try again.'
        // Mock data for development
        categories.value = [
            { id: 1, name: 'Food' },
            { id: 2, name: 'Electronics' },
            { id: 3, name: 'Clothing' },
        ]
        catalogs.value = [
            { id: 1, categoryId: 1, name: 'Pizza', description: 'Delicious pizza', price: 500, image: null },
            { id: 2, categoryId: 1, name: 'Burger', description: 'Fresh burger', price: 300, image: null },
            { id: 3, categoryId: 2, name: 'Headphones', description: 'Premium headphones', price: 1000, image: null },
        ]
        error.value = null
    } finally {
        loading.value = false
    }
}

// Lifecycle
onMounted(() => {
    fetchData()
})
</script>

<style scoped>
.catalog-container {
    min-height: 100vh;
    background: #fffafa;
    padding: 20px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.catalog-header {
    text-align: center;
    margin-bottom: 40px;
    padding-top: 20px;
}

.catalog-header h1 {
    font-size: 32px;
    color: #2c3e50;
    margin-bottom: 10px;
    font-weight: 700;
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
    background: #fee;
    border: 1px solid #fcc;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    margin: 20px;
}

.error-message {
    color: #c33;
    margin-bottom: 15px;
}

.retry-btn {
    background: #e74c3c;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
}

.retry-btn:hover {
    background: #c0392b;
}

.catalog-content {
    max-width: 1200px;
    margin: 0 auto;
}

/* Categories Section */
.categories-section {
    margin-bottom: 50px;
}

.categories-section h2 {
    font-size: 24px;
    color: #2c3e50;
    margin-bottom: 20px;
    font-weight: 600;
}

.categories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 15px;
    margin-bottom: 30px;
}

.category-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 2px solid transparent;
}

.category-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.category-card.active {
    border-color: #3498db;
    background: #ebf5fb;
}

.category-icon {
    font-size: 32px;
    color: #3498db;
    margin-bottom: 10px;
}

.category-card h3 {
    font-size: 14px;
    color: #2c3e50;
    margin: 10px 0;
    font-weight: 600;
}

.category-count {
    font-size: 12px;
    color: #95a5a6;
    margin: 0;
}

/* Catalogs Section */
.catalogs-section {
    margin-bottom: 40px;
}

.catalogs-section h2 {
    font-size: 24px;
    color: #2c3e50;
    margin-bottom: 20px;
    font-weight: 600;
}

.catalogs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
}

.catalog-card {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    height: 100%;
}

.catalog-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.catalog-image {
    width: 100%;
    height: 200px;
    overflow: hidden;
    background: #ecf0f1;
}

.catalog-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}

.catalog-card:hover .catalog-image img {
    transform: scale(1.1);
}

.catalog-info {
    padding: 15px;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
}

.catalog-info h3 {
    font-size: 16px;
    color: #2c3e50;
    margin: 0 0 8px 0;
    font-weight: 600;
}

.catalog-description {
    font-size: 13px;
    color: #7f8c8d;
    margin: 0 0 15px 0;
    flex-grow: 1;
}

.catalog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 10px;
    border-top: 1px solid #ecf0f1;
}

.price {
    font-size: 16px;
    font-weight: 700;
    color: #27ae60;
}

.details-btn {
    background: #3498db;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 13px;
    transition: background 0.3s ease;
}

.details-btn:hover {
    background: #2980b9;
}

/* Empty State */
.empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #7f8c8d;
    font-size: 18px;
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
}

.modal-content {
    background: white;
    border-radius: 12px;
    max-width: 500px;
    width: 100%;
    padding: 30px;
    position: relative;
    max-height: 90vh;
    overflow-y: auto;
}

.modal-close {
    position: absolute;
    top: 15px;
    right: 15px;
    background: none;
    border: none;
    font-size: 28px;
    color: #95a5a6;
    cursor: pointer;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-close:hover {
    color: #2c3e50;
}

.modal-content img {
    width: 100%;
    border-radius: 8px;
    margin-bottom: 20px;
    max-height: 300px;
    object-fit: cover;
}

.modal-content h2 {
    font-size: 24px;
    color: #2c3e50;
    margin: 20px 0 10px 0;
}

.modal-content p {
    color: #7f8c8d;
    margin-bottom: 15px;
    line-height: 1.6;
}

.modal-price {
    font-size: 24px;
    font-weight: 700;
    color: #27ae60;
    margin: 20px 0;
}

.order-btn {
    width: 100%;
    background: #27ae60;
    color: white;
    border: none;
    padding: 12px;
    border-radius: 5px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.3s ease;
}

.order-btn:hover {
    background: #229954;
}
.toast {
  min-width: 250px;
  transition: all 0.3s ease;
}

/* Responsive Design */
@media (max-width: 768px) {
    .catalog-header h1 {
        font-size: 24px;
    }

    .categories-grid {
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 10px;
    }

    .catalogs-grid {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 15px;
    }

    .catalog-image {
        height: 150px;
    }
}

@media (max-width: 480px) {
    .catalog-container {
        padding: 10px;
    }

    .catalog-header {
        margin-bottom: 30px;
        padding-top: 10px;
    }

    .catalog-header h1 {
        font-size: 20px;
    }

    .categories-grid {
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
        gap: 8px;
    }

    .catalogs-grid {
        grid-template-columns: 1fr;
    }

    .category-card {
        padding: 15px 10px;
    }

    .category-card h3 {
        font-size: 12px;
    }

    .modal-content {
        padding: 20px;
    }
}
</style>