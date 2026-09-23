<template>
  <div class="search-page container" style="position: absolute; top: 50px;">
    <div class="search-header">
      <button class="back" @click="router.back()"><i class="fas fa-arrow-left"></i></button>
      <input
        v-model="query"
        @keyup="runSearch"
        class="search-input"
        placeholder="Mahsulotlarni qidirish..."
        autofocus
      />
      
      <button class="clear" @click="clear"><i class="fas fa-trash-alt"></i></button>
    </div>

    <div class="search-meta" v-if="total !== null">
      <small>{{ total }} {{ $t('results') || 'results' }}</small>
    </div>

    <div v-if="loading" class="loading-state">
      <LoadingSpinner />
    </div>

    <div v-if="error" class="error-state">
      <p class="err">{{ error }}</p>
      <button class="retry" @click="runSearch">{{ $t('retry') || 'Retry' }}</button>
    </div>

    <div v-if="!loading && !error && results.length === 0 && query" class="empty">
      <p>{{ $t('noResults') || 'No results found' }}</p>
    </div>

    <div v-if="results.length > 0" class="results">
      <div v-for="(r, i) in results" :key="r.id || r.ID || i" class="result-item" @click="onSelect(r)">
        <template v-if="r.type === 'category'">
          <div class="category-card">
            <i class="fas fa-folder-open category-icon"></i>
            <div class="category-info">
              <div class="title">{{ r.name }}</div>
              <div class="hint">{{ $t('category') || 'Category' }}</div>
            </div>
            
          </div>
        </template>
        <template v-else>
          <div class="item-card">
            <img :src="r.img || placeholder" class="thumb" :alt="r.name" />
            <div class="item-info">
              <div class="title">{{ r.name }}</div>
              <div class="price">{{ r.price || '' }}</div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import LoadingSpinner from './LoadingSpinner.vue'

const STORAGE_KEY = 'search_view_state_v1'

const router = useRouter()
const query = ref('')
const type = ref('match')
const limit = ref(50)
const loading = ref(false)
const error = ref(null)
const results = ref([])
const total = ref(null)
const placeholder = '/src/assets/img/1.png'

let debounceTimer = null
let skipNextSearch = false

const saveState = () => {
  try {
    const payload = {
      query: query.value,
      type: type.value,
      limit: limit.value,
      total: total.value,
      results: results.value
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch (e) { console.warn('saveState failed', e) }
}

const loadState = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const s = JSON.parse(raw)
    skipNextSearch = true
    query.value = s.query || ''
    type.value = s.type || 'match'
    limit.value = s.limit || 50
    total.value = s.total ?? null
    results.value = s.results || []
    return true
  } catch (e) {
    console.warn('loadState failed', e)
    return false
  }
}

const runSearch = async () => {
  error.value = null
  const trimmedQuery = query.value.trim()
  if (!trimmedQuery) {
    results.value = []
    total.value = 0
    saveState()
    return
  }

  loading.value = true
  try {
    const resp = await axios.get('https://search.erkaboyev.uz/search', {
      params: {
        name: trimmedQuery,
        type: type.value,
        limit: limit.value
      }
    })

    total.value = resp.data?.total ?? (resp.data?.results?.length ?? 0)

    // Normalize: ensure items have consistent fields
    results.value = (resp.data?.results || []).map(item => ({
      ...item,
      id: item.id || item.ID || (item.ID && item.ID.toString ? item.ID.toString() : undefined),
      name: item.name,
      price: item.price,
      img: item.img
    }))

    saveState()
  } catch (err) {
    console.error('Search failed', err)
    if (err?.response?.status === 400) {
      error.value = err.response.data?.error || 'Missing required query parameter: name'
    } else if (err?.response?.status === 500) {
      error.value = err.response.data?.error || 'Server error'
    } else {
      error.value = 'Failed to perform search'
    }
  } finally {
    loading.value = false
  }
}

const onSelect = (r) => {
  if (!r) return
  if (r.type === 'category') {
    router.push({ name: 'products', params: { categoryId: r.id } })
  } else {
    const productId = r.ID || r.id || r.ID
    router.push({ name: 'product', params: { id: productId } })
  }
}

const openCategory = (r) => {
  router.push({ name: 'products', params: { categoryId: r.id } })
}

const clear = () => {
  query.value = ''
  results.value = []
  total.value = null
  error.value = null
  sessionStorage.removeItem(STORAGE_KEY)
}

// Debounce input — shorter for more responsive per-keystroke search
watch(query, (v) => {
  if (skipNextSearch) { skipNextSearch = false; return }
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    runSearch()
  }, 150)
})

watch(type, (v) => {
  if (query.value && !skipNextSearch) {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => runSearch(), 150)
  } else {
    saveState()
  }
})

onMounted(() => {
  const restored = loadState()
  if (!restored) {
    // If route has query param q, prefill and search
    const urlParams = new URLSearchParams(window.location.search)
    const q = urlParams.get('q')
    if (q) {
      query.value = q
      runSearch()
    }
  }

  window.addEventListener('beforeunload', saveState)
})

onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
  saveState()
  window.removeEventListener('beforeunload', saveState)
})
</script>

<style scoped>
.search-page { padding: 20px; }
.search-header { display:flex; gap:8px; align-items:center; position:sticky; top:0;background:#fff; padding:10px 0; z-index:10 }
.search-input { flex:1; padding:10px 12px; border-radius:8px; border:1px solid #ddd }
.search-type { padding:8px; border-radius:6px; border:1px solid #ddd }
.clear, .back { background:transparent; border:none; font-size:16px }
.results { margin-top:12px }
.result-item { margin-bottom:8px; cursor:pointer }
.category-card { display:flex; align-items:center; gap:8px; padding:8px; background:#fff; border-radius:6px; border:1px solid #eee }
.category-icon { font-size:20px; color:#ff5722 }
.category-info .title { font-weight:700; font-size:14px }
.category-info .hint { font-size:12px; color:#666 }
.item-card { display:flex; gap:8px; align-items:center; padding:8px; background:#fff; border-radius:6px; border:1px solid #eee }
.thumb { width:48px; height:48px; object-fit:cover; border-radius:6px }
.item-info .title { font-weight:600; font-size:14px }
.price { color:#ff5722; margin-top:4px; font-size:13px }
.loading-state { margin-top:20px; text-align:center }
.error-state { margin-top:20px; color:#c33 }
</style>
