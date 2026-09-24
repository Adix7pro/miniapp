<template>
  <div class="home-page uy-home">
    <!-- ② Banner karusel -->
    <section class="uy-banner" aria-roledescription="carousel" :aria-label="t('news')"
      @touchstart.passive="stopBannerAuto" @touchend.passive="startBannerAuto">
      <div class="uy-banner-track" ref="bannerTrack" @scroll.passive="onBannerScroll">
        <button v-for="(b, idx) in banners" :key="b.id" type="button"
          class="uy-banner-slide" :class="'theme-' + (b.theme || 'orange')" @click="openBanner(b)"
          :aria-label="t(b.titleKey)">
          <img v-if="b.image" :src="bannerSrc(b)" :alt="t(b.titleKey)" class="uy-banner-img" loading="lazy" />
          <template v-else>
            <span class="uy-banner-copy">
              <span class="uy-banner-title">{{ t(b.titleKey) }}</span>
              <span class="uy-banner-sub">{{ t(b.subtitleKey) }}</span>
            </span>
            <span class="uy-banner-art" aria-hidden="true" v-html="b.theme === 'peach' ? giftArt : deliveryArt"></span>
          </template>
        </button>
      </div>
      <div class="uy-banner-dots" aria-hidden="true">
        <span v-for="(b, idx) in banners" :key="'d' + b.id" :class="{ active: idx === bannerIndex }"></span>
      </div>
    </section>

    <!-- Hero / Points card -->
    

    <!-- Bonus cards section -->
    <bonus-card 
      v-if="userData?.data" 
      :monthly-percent="monthlyPercent" 
      :quarterly-percent="quarterlyPercent" 
      :monthly-bonus="userData.data.saleMonthly" 
      :quarterly-bonus="userData.data.saleQuarterly"
      :bonus-value="userData.data.balance" >
    </bonus-card>

    <!-- ④ Saralangan bo'limlar -->
    <section class="uy-cats" v-if="categoriesLoading || featuredCategories.length">
      <div class="uy-section-head">
        <h2>{{ t('featured_categories') }}</h2>
        <router-link to="/categories" class="uy-see-all">{{ t('see_all') }}</router-link>
      </div>
      <div class="uy-cats-grid">
        <template v-if="categoriesLoading">
          <div v-for="n in 8" :key="'sk' + n" class="uy-cat">
            <span class="uy-cat-tile uy-skeleton"></span>
            <span class="uy-cat-name uy-skeleton-line"></span>
          </div>
        </template>
        <button v-else v-for="cat in featuredCategories" :key="cat.id" type="button" class="uy-cat" @click="openCategory(cat)">
          <span class="uy-cat-tile" v-html="categoryIcon(cat.name)"></span>
          <span class="uy-cat-name">{{ cat.name }}</span>
        </button>
      </div>
    </section>

    <!-- ⑤ ⑥ Qaynoq chegirmalar, Mijozlar tanlovi -->
    <collection v-if="userData?.data" :receipts="receipts" :current-receipt="currentReceipt" />

    <!-- ⑦ Vakansiyalar banneri -->
    <button type="button" class="uy-vacancy" @click="$router.push('/jobs')">
      <img src="../assets/img/uyda_vacation.png" :alt="t('vacancies_alt')" />
    </button>

    <!-- News Modal -->
    <div v-if="showNewsModal" class="news-modal" @click="closeNewsModal">
          <div class="news-content" @click.stop
            @touchstart.passive="onTouchStart"
            @touchmove.passive="onTouchMove"
            @touchend.prevent="onTouchEnd($event)"
            @mousedown.prevent="onMouseDown"
            @mousemove.prevent="onMouseMove"
            @mouseup.prevent="onMouseUp"
            :style="newsContentStyle">
        <!-- Progress bars -->
        <div class="progress-container">
          <div 
            v-for="(item, index) in newsItems" 
            :key="item.id" 
            class="story-progress">
            <div 
              class="progress-bar" 
              :style="{ width: getProgressWidth(index) }">
            </div>
          </div>
        </div>

        <!-- Close button -->
        <button
          class="close-btn"
          aria-label="close"
          @click.stop="closeNewsModal"
          @touchend.stop.prevent="closeNewsModal"
          @mousedown.stop="closeNewsModal"
        >&times;</button>

        <!-- News Content -->
        <div class="news-carousel">
          <transition name="news-fade" mode="out-in">
            <div class="news-item" :key="currentNewsIndex">
              <img :src="currentNews.image" :alt="currentNews.title">
              <div class="news-info">
                <h3>{{ currentNews.title }}</h3>
                <p>{{ currentNews.description }}</p>
              </div>
            </div>
          </transition>
        </div>

        <!-- Navigation Buttons -->
              <button class="nav-btn nav-btn-prev" @click="prevNews" @touchstart.stop @touchend.stop.prevent="prevNews" :title="t('prev')">
          <span>‹</span>
        </button>
              <button class="nav-btn nav-btn-next" @click="nextNews" @touchstart.stop @touchend.stop.prevent="nextNews" :title="t('next')">
          <span>›</span>
        </button>
      </div>
    </div>
    <!-- Feedback / Overview modal trigger -->
    <div class="trigger-container">

    </div>
    
    <!-- <over-view-modal v-model="showOverviewModal" @submit="submitOverview" v-if="showOverviewModal"/> -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import VanillaTilt from 'vanilla-tilt'
import { useI18n } from 'vue-i18n'
import { API } from '../variable/link.js'
import axios from 'axios'
import { getChatID, getRecipientCode } from '../variable/chat.js'
import OverViewModal from './overViewModal.vue'
import BonusCard from './BonusCard.vue'
import HrPostCard from './hrPostCard.vue'
import collection from './collection.vue'
import { banners } from '../variable/banners.js'
import { categoryIcon } from '../lib/uiIcons.js'

// API instance
const api = axios.create({
  baseURL: API.link,
  headers: {
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': '1',
    'Authorization': 'Basic ' + btoa(`${API.username}:${API.password}`)
  }
})

// User data
const userData = ref(null)
const router = useRouter()

// Define getUserData function early so it can be used in onMounted
async function getUserData() {
  try {
    const chatID = getChatID()
    
    if (!chatID) {
      router.replace('/register')
      return false
    }

    const response = await api.get('/user', { params: { chatID } })
    
    if (response?.status === 200 && response.data) {
      userData.value = response.data
      return true
    }

    router.replace('/register')
    return false
  } catch (error) {
    console.error('Error fetching user data:', error.message)
    router.replace('/register')
    return false
  }
}

// Use i18n (language comes from App.vue fetching user data)
const { t } = useI18n()

// Monthly and quarterly percentages
const monthlyPercent = computed(() => {
  if (!userData.value?.data) return 0
  return (userData.value.data.saleMonthly / 1000000) * 100 // 1 million so'mga nisbatan
})

const quarterlyPercent = computed(() => {
  if (!userData.value?.data) return 0
  return (userData.value.data.saleQuarterly / 3000000) * 100 // 3 million so'mga nisbatan
})

// News modal state and data
const showNewsModal = ref(false)
const currentNewsIndex = ref(0)
let newsInterval = null

// refs to story buttons for tilt effect
const storyRefs = ref([])

function setStoryRef(el, idx) {
  // ensure array exists
  if (!storyRefs.value) storyRefs.value = []
  storyRefs.value[idx] = el

  return
}

const newsItems = [
  {
    id: 1,
    image: 'https://calm-nougat-b8b96e.netlify.app/1.jpg',
    title: '',
    description: '',
    date: ''
  },
  {
    id: 2,
    image: 'https://calm-nougat-b8b96e.netlify.app/2.jpg',
    title: '',
    description: '',
    date: ''
  },
  {
    id: 3,
    image: 'https://calm-nougat-b8b96e.netlify.app/3.jpg',
    title: '',
    description: '',
    date: ''
  },
  {
    id: 4,
    image: 'https://calm-nougat-b8b96e.netlify.app/4.jpg',
    title: '',
    description: '',
    date: ''
  },
  {
    id: 5,
    image: 'https://calm-nougat-b8b96e.netlify.app/5.jpg',
    title: '',
    description: '',
    date: ''
  },
  {
    id: 6,
    image: 'https://calm-nougat-b8b96e.netlify.app/6.jpg',
    title: '',
    description: '',
    date: ''
  }
]

const currentNews = computed(() => newsItems[currentNewsIndex.value])

// small reactive ticker so progress bars update smoothly
const now = ref(Date.now())
let progressTicker = null

const startProgressTicker = () => {
  stopProgressTicker()
  now.value = Date.now()
  progressTicker = setInterval(() => { now.value = Date.now() }, 100)
}

const stopProgressTicker = () => {
  if (progressTicker) { clearInterval(progressTicker); progressTicker = null }
}

// Carousel timing (7 seconds per story)
const CYCLE_TIME = 7000
const startedAt = ref(Date.now())

const startNewsCarousel = () => {
  stopNewsCarousel()
  startedAt.value = Date.now()
  newsInterval = setInterval(() => {
    nextNews()
  }, CYCLE_TIME)
  startProgressTicker()
}

const stopNewsCarousel = () => {
  if (newsInterval) {
    clearInterval(newsInterval)
    newsInterval = null
  }
}

const showNews = (index) => {
  currentNewsIndex.value = index
  showNewsModal.value = true
  startedAt.value = Date.now()
  startNewsCarousel()
}

const closeNewsModal = () => {
  showNewsModal.value = false
  stopNewsCarousel()
  currentTranslate.value = 0
}

// ensure progress ticker stops when closed
const closeNewsModalCleanup = () => {
  stopNewsCarousel()
  stopProgressTicker()
  currentTranslate.value = 0
}

// navigation helpers
const resetCarouselTimer = () => {
  startedAt.value = Date.now()
  // always restart both carousel interval and progress ticker so manual nav resumes auto-advance
  stopNewsCarousel()
  stopProgressTicker()
  startNewsCarousel()
}

const nextNews = () => {
  console.log('HomePage: nextNews clicked')
  currentNewsIndex.value = (currentNewsIndex.value + 1) % newsItems.length
  startedAt.value = Date.now()
  resetCarouselTimer()
}

const prevNews = () => {
  console.log('HomePage: prevNews clicked')
  currentNewsIndex.value = (currentNewsIndex.value - 1 + newsItems.length) % newsItems.length
  startedAt.value = Date.now()
  resetCarouselTimer()
}

// Progress indicators for stories — use startedAt to compute elapsed
const getProgressWidth = (index) => {
  if (index < currentNewsIndex.value) return '100%'
  if (index === currentNewsIndex.value) {
    const elapsed = now.value - startedAt.value
    const pct = Math.min(100, Math.max(0, (elapsed / CYCLE_TIME) * 100))
    return pct + '%'
  }
  return '0%'
}

// Drag-to-close and swipe-to-navigate behavior
const touchStartY = ref(null)
const touchStartX = ref(null)
const isPointerDown = ref(false)
const currentTranslate = ref(0)
const newsContentStyle = computed(() => {
  const t = currentTranslate.value
  const transition = isPointerDown.value ? 'none' : 'transform 180ms ease'
  return { transform: `translateY(${t}px)`, transition }
})

const DRAG_CLOSE_THRESHOLD = 120
const SWIPE_THRESHOLD = 60

function onTouchStart(e) {
  stopNewsCarousel()
  isPointerDown.value = true
  currentTranslate.value = 0
  touchStartY.value = (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY
  touchStartX.value = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX
}

function onTouchMove(e) {
  if (!isPointerDown.value || touchStartY.value === null) return
  const clientY = (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY
  const dy = Math.max(0, clientY - touchStartY.value)
  currentTranslate.value = dy
}

function onTouchEnd(event) {
  isPointerDown.value = false
  
  // Check for horizontal swipe first
  if (touchStartX.value !== null) {
    const clientX = event.changedTouches ? event.changedTouches[0].clientX : event.clientX
    const dx = clientX - touchStartX.value
    if (Math.abs(dx) >= SWIPE_THRESHOLD) {
      if (dx > 0) {
        // swiped right → go to previous
        prevNews()
      } else {
        // swiped left → go to next
        nextNews()
      }
      touchStartX.value = null
      touchStartY.value = null
      return
    }
  }
  
  // Check for vertical drag-to-close
  if (currentTranslate.value >= DRAG_CLOSE_THRESHOLD) {
    closeNewsModal()
  } else {
    // snap back
    currentTranslate.value = 0
    // resume carousel
    resetCarouselTimer()
  }
  touchStartY.value = null
  touchStartX.value = null
}

// Mouse fallbacks for desktop testing (click-drag)
function onMouseDown(e) {
  // only left button
  if (e.button !== 0) return
  onTouchStart({ touches: [{ clientY: e.clientY, clientX: e.clientX }] })
}
function onMouseMove(e) { onTouchMove({ touches: [{ clientY: e.clientY, clientX: e.clientX }], clientY: e.clientY, clientX: e.clientX }) }
function onMouseUp(e) { onTouchEnd(e) }

// Collapsible state for bonus area attached to balance
const showBonuses = ref(false)



// mock receipts for history rotation
const receipts = [
  { merchant: "Bazaar Super", when: '2 soat oldin', amount: "₸ 84,500", method: 'Card • 1234' },
  { merchant: "Coffee Hub", when: '1 kun oldin', amount: "₸ 12,800", method: 'Cash' },
  { merchant: "Green Market", when: '3 kun oldin', amount: "₸ 45,200", method: 'Card • 5678' }
]

const currentReceiptIndex = ref(0)
const currentReceipt = computed(() => receipts[currentReceiptIndex.value])

let rotateTimer = null

onMounted(async () => {
  try {
    let recipientCode = null
    
    // First, check Cloud Storage
    await new Promise((resolve) => {
      getRecipientCode((err, cloudCode) => {
        if (!err && cloudCode) {
          recipientCode = cloudCode
          console.log('RecipientCode retrieved from Cloud Storage:', cloudCode)
        }
        resolve()
      })
    })
    
    // If no code in Cloud Storage, check URL as fallback
    if (!recipientCode) {
      const urlParams = new URLSearchParams(window.location.search)
      recipientCode = urlParams.get('recipientCode') || urlParams.get('code')
      if (recipientCode) {
        console.log('RecipientCode retrieved from URL:', recipientCode)
      }
    }
    
    if (recipientCode) {
      router.push(`/feedback/${recipientCode}`)
      return
    }
  } catch (e) {
    // ignore malformed URLSearchParams
    console.error('Error checking recipientCode:', e)
  }

  const ok = await getUserData()
  if (!ok) return

  rotateTimer = setInterval(() => {
    currentReceiptIndex.value = (currentReceiptIndex.value + 1) % receipts.length
  }, 5000)
  // Listen for rating events from Socket.IO (dispatched by App.vue)
  const ratingHandler = (ev) => {
    try {
      const payload = ev && ev.detail
      if (!payload) return
      // Compare chatID from socket event with current user's chatID
      const myChat = getChatID()
      console.log('HomePage: uyda-rating received', payload, 'myChat:', myChat)
      if (String(payload.chatID) === String(myChat)) {
        console.log('HomePage: chatID matched, opening overview modal')
        showOverviewModal.value = true
      } else {
        console.log('HomePage: chatID mismatch, ignoring event')
      }
    } catch (e) { 
      console.error('HomePage ratingHandler error', e) 
    }
  }
  window.addEventListener('uyda-rating', ratingHandler)
  // Store for cleanup
  window.__uyda_rating_handler = ratingHandler

  
})
onBeforeUnmount(() => {
  if (rotateTimer) clearInterval(rotateTimer)
  // Remove rating event listener
  const h = window.__uyda_rating_handler
  if (h) { 
    window.removeEventListener('uyda-rating', h)
    delete window.__uyda_rating_handler 
  }
  // destroy VanillaTilt instances on cleanup
  try {
    (storyRefs.value || []).forEach((el) => {
      if (el && el.vanillaTilt) el.vanillaTilt.destroy()
    })
  } catch (e) { /* ignore */ }
})

// Feedback modal state and handler
const showOverviewModal = ref(false)
const submitOverview = async (payload) => {
  try {
    console.log('Overview submit payload:', payload)
    const chatID = getChatID()
    const body = { chatID, rating: payload.rating, comment: payload.comment }
    // POST to feedback endpoint (adjust path if backend differs)
    const resp = await api.post('/feedback', body)
    if (resp.status === 200) {
      // simple success notice
      alert('Rahmat! Fikringiz qabul qilindi.')
    } else {
      alert(resp.data?.message || 'Server javobi kutilmagan.')
    }
  } catch (err) {
    console.error('Error submitting overview:', err)
    alert(err.response?.data?.message || err.message || 'Fikr yuborishda xatolik yuz berdi.')
  }
}
// ---------- ② Banner karusel
const bannerTrack = ref(null)
const bannerIndex = ref(0)
let bannerTimer = null
const deliveryArt = `<svg viewBox="0 0 160 110" xmlns="http://www.w3.org/2000/svg"><circle cx="118" cy="30" r="22" fill="#FFD27A" opacity=".9"/><rect x="8" y="34" width="86" height="50" rx="8" fill="#fff"/><rect x="16" y="42" width="30" height="20" rx="4" fill="#FDE3D9"/><path d="M94 50h28l16 18v16H94z" fill="#fff"/><path d="M100 56h18l10 12h-28z" fill="#BFD7EA"/><circle cx="34" cy="88" r="11" fill="#2A2A2A"/><circle cx="34" cy="88" r="4" fill="#ddd"/><circle cx="116" cy="88" r="11" fill="#2A2A2A"/><circle cx="116" cy="88" r="4" fill="#ddd"/><path d="M128 16c-7 0-12 5-12 12 0 9 12 20 12 20s12-11 12-20c0-7-5-12-12-12z" fill="#F7B733"/><circle cx="128" cy="28" r="4.5" fill="#fff"/></svg>`
const giftArt = `<svg viewBox="0 0 180 130" xmlns="http://www.w3.org/2000/svg">
  <!-- Backdrop circle -->
  <circle cx="110" cy="65" r="62" fill="#E9582E" opacity="0.18"/>
  <!-- Large dinner plate -->
  <ellipse cx="105" cy="72" rx="44" ry="40" fill="#FBF6EF" stroke="#E6DCCB" stroke-width="2.5"/>
  <ellipse cx="105" cy="72" rx="31" ry="28" fill="none" stroke="#E6DCCB" stroke-width="1.5"/>
  <ellipse cx="105" cy="72" rx="14" ry="13" fill="none" stroke="#E6DCCB" stroke-width="1"/>
  <!-- Flower/pattern on plate -->
  <g fill="#D9534F" opacity="0.7">
    <circle cx="90" cy="58" r="2.5"/>
    <circle cx="118" cy="54" r="2.5"/>
    <circle cx="126" cy="80" r="2.5"/>
    <circle cx="96" cy="90" r="2.5"/>
    <circle cx="112" cy="88" r="2"/>
  </g>
  <!-- Small bowl (right) -->
  <ellipse cx="138" cy="90" rx="22" ry="18" fill="#FBF6EF" stroke="#E6DCCB" stroke-width="2"/>
  <ellipse cx="138" cy="90" rx="14" ry="11" fill="none" stroke="#E6DCCB" stroke-width="1"/>
  <!-- Wine glass (left) -->
  <path d="M68 38 Q76 56 80 60 L76 80 L72 80 L76 80 L76 92 L62 92 L90 92 L90 80 L86 80 L86 60 Q90 56 98 38 Z" fill="none" stroke="#E8C4B0" stroke-width="2" stroke-linejoin="round"/>
  <path d="M70 40 Q79 56 79 60 Q87 56 95 40 Z" fill="#F2DCCe" opacity="0.5"/>
  <!-- Small decorative circles -->
  <circle cx="55" cy="75" r="3" fill="#E9582E" opacity="0.3"/>
  <circle cx="160" cy="45" r="5" fill="#E9582E" opacity="0.2"/>
  <circle cx="150" cy="105" r="4" fill="#E9582E" opacity="0.25"/>
</svg>`

const onBannerScroll = () => {
  const el = bannerTrack.value
  if (!el || !el.clientWidth) return
  bannerIndex.value = Math.round(el.scrollLeft / el.clientWidth)
}
const goBanner = (i) => {
  const el = bannerTrack.value
  if (!el) return
  el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
}
const stopBannerAuto = () => { if (bannerTimer) { clearInterval(bannerTimer); bannerTimer = null } }
const startBannerAuto = () => {
  stopBannerAuto()
  if (banners.length < 2) return
  bannerTimer = setInterval(() => goBanner((bannerIndex.value + 1) % banners.length), 5000)
}
const bannerSrc = (b) => (/^(https?:|data:)/.test(b.image) ? b.image : import.meta.env.BASE_URL + String(b.image).replace(/^\//, ''))
const openBanner = (b) => {
  if (b.action === 'news') { showNews(0); return }
  if (b.link) router.push(b.link)
}

// ---------- ④ Saralangan bo'limlar (1C toifalari)
const featuredCategories = ref([])
const categoriesLoading = ref(true)
const loadFeaturedCategories = async () => {
  try {
    const response = await api.get('/category')
    const raw = response.data?.data || []
    featuredCategories.value = raw
      .map(c => ({ ...c, id: c.id || c.ID || c.categoryID }))
      .filter(c => c.id && c.name && c.items !== 0)
      .slice(0, 8)
  } catch (e) {
    console.warn('HomePage: toifalarni yuklab bo\'lmadi', e?.message)
    featuredCategories.value = []
  } finally {
    categoriesLoading.value = false
  }
}
// Toifani ochish: ichki toifalari bo'lsa Toifalar sahifasida, bo'lmasa mahsulotlar ro'yxatida
const openCategory = async (cat) => {
  try {
    const response = await api.get('/category', { params: { categoryID: cat.id } })
    const sub = (response.data?.data || []).map(c => ({ ...c, id: c.id || c.ID || c.categoryID }))
    if (!sub.length) {
      router.push({ name: 'products', params: { categoryId: cat.id } })
      return
    }
    sessionStorage.setItem('categoriesViewState', JSON.stringify({
      categories: sub, breadcrumb: [cat], currentCategoryId: cat.id, navigationDirection: 'forward'
    }))
    router.push({ name: 'categories' })
  } catch (e) {
    router.push({ name: 'products', params: { categoryId: cat.id } })
  }
}

onMounted(() => {
  loadFeaturedCategories()
  startBannerAuto()
})
onBeforeUnmount(stopBannerAuto)
</script>

<style scoped>
.bg-gradient-primary {
  background: linear-gradient(135deg, var(--color-primary) 0%, #ffb26e 100%);
}
.text-white-50 { color: rgba(255,255,255,0.85); }
.card { border-radius: 12px; }

/* Minimalist balance card */
.balance-card {
  border: none;
  box-shadow: 0 4px 12px rgba(255, 87, 34, 0.15);
}

.balance-number {
  font-size: 2rem;
  color: rgba(255, 255, 255, 0.98);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  letter-spacing: -0.5px;
}

/* Minimalist bonus card */
.bonus-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04));
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  color: white;
}

.bonus-label {
  font-size: 13px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.bonus-sublabel {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.65);
  font-weight: 500;
}

.bonus-amount {
  font-size: 18px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.98);
}

.bonus-percent {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
}

.bonus-progress {
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  overflow: hidden;
}

.bonus-bar-monthly {
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.95));
  box-shadow: 0 0 4px rgba(255, 255, 255, 0.3);
}

.bonus-bar-quarterly {
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.85));
  box-shadow: 0 0 4px rgba(255, 255, 255, 0.2);
}

/* Transition for the collapsible bonus area */
.slide-fade-enter-active, .slide-fade-leave-active {
  transition: all .32s cubic-bezier(.2,.8,.2,1);
}
.slide-fade-enter-from, .slide-fade-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-6px);
}
.slide-fade-enter-to, .slide-fade-leave-from {
  max-height: 480px;
  opacity: 1;
  transform: translateY(0);
}
.slide-fade-enter-active > div, .slide-fade-leave-active > div {
  transition: inherit;
}

.overflow-hidden { overflow: hidden; }

/* Stories strip */
.stories {
  -webkit-overflow-scrolling: touch;
  overflow-x: auto;
  touch-action: pan-x;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
}
.stories::-webkit-scrollbar { display: none; height: 0; }
.story { 
  min-width: 82px; 
  flex: 0 0 auto;
}

.story-button {
  border: none;
  background: transparent;
  padding: 0;
  width: 100%;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.story-button:hover {
  /* disable CSS scaling so VanillaTilt can control transform smoothly */
  transform: none;
  box-shadow: 0 6px 18px rgba(0,0,0,0.12);
}

.story-ring {
  width: 74px;
  height: 74px;
  border-radius: 50%;
  padding: 2px;
  background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
  margin: 0 auto;
}

.story-circle {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  padding: 2px;
  background: white;
}

.story-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  -webkit-user-drag: none;
  -webkit-user-select: none;
  user-select: none;
}

.story-name { 
  max-width: 82px; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  white-space: nowrap;
  color: var(--bs-primary);
  font-size: 0.8rem;
  font-weight: 500;
}

/* rotating receipt card */
.receipt-card {
  background: rgba(255,255,255,0.06);
  border-radius: 8px;
}

/* fade transition used by receipts */
.fade-enter-active, .fade-leave-active { transition: opacity .4s ease, transform .4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(6px); }
.fade-enter-to, .fade-leave-from { opacity: 1; transform: translateY(0); }

/* ensure navbar doesn't obscure content */
@media (max-width: 767px) {
  body { padding-bottom: 4.5rem; }
}

/* News Modal Styles */
.news-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: modalFadeIn 0.3s ease;
}

.news-content {
  width: 100%;
  max-width: 420px;
  height: 100%;
  max-height: calc(100vh - 40px);
  position: relative;
  background: #000;
  border-radius: 16px;
  overflow: hidden;
  animation: modalSlideUp 0.4s cubic-bezier(0.2, 0.9, 0.3, 1);
}

@keyframes modalFadeIn {
  from { background: rgba(0, 0, 0, 0); }
  to { background: rgba(0, 0, 0, 0.95); }
}

@keyframes modalSlideUp {
  from { 
    transform: translateY(50px);
    opacity: 0;
  }
  to { 
    transform: translateY(0);
    opacity: 1;
  }
}

.progress-container {
  position: absolute;
  top: 62px;
  left: 12px;
  right: 12px;
  display: flex;
  gap: 4px;
  z-index: 1;
  padding: 0 8px;
}

.story-progress {
  height: 3px;
  flex: 1;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  backdrop-filter: blur(8px);
}

.progress-bar {
  height: 100%;
  background: #fff;
  transition: width 0.1s linear;
  border-radius: 4px;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
}

.close-btn {
  position: absolute;
  top: 66px;
  right: 16px;
  width: 32px;
  height: 32px;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: white;
  font-size: 24px;
  z-index: 10;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.7);
  transform: scale(1.1);
}

.news-carousel {
  height: 100%;
  width: 100%;
  position: relative;
}

.news-item {
  height: 100%;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.news-item img {
  width: 100%;
  height: 100%;
  object-fit:  contain;
  transition: transform 0.3s ease;
}

.news-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 32px 24px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.4) 20%, rgba(0, 0, 0, 0.8));
  color: white;
  backdrop-filter: blur(8px);
  transform: translateY(0);
  transition: transform 0.3s ease;
}

.news-info h3 {
  margin: 0 0 12px 0;
  font-size: 1.5rem;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.news-info p {
  margin: 0;
  opacity: 0.95;
  line-height: 1.5;
  font-size: 1rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.news-fade-enter-active, .news-fade-leave-active {
  transition: opacity 360ms cubic-bezier(.2,.9,.3,1), transform 360ms cubic-bezier(.2,.9,.3,1);
}
.news-fade-enter-from { opacity: 0; transform: translateY(8px) scale(0.996); }
.news-fade-enter-to { opacity: 1; transform: translateY(0) scale(1); }
.news-fade-leave-from { opacity: 1; transform: translateY(0) scale(1); }
.news-fade-leave-to { opacity: 0; transform: translateY(-8px) scale(0.996); }

/* ensure nav buttons are on top and respond to pointer events */
.news-content, .news-modal { -webkit-tap-highlight-color: transparent; }
.nav-btn { pointer-events: auto; }

/* Navigation buttons for news carousel */
.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 28px;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  backdrop-filter: blur(8px);
  transition: all 0.2s ease;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-50%) scale(1.1);
}

.nav-btn:active {
  transform: translateY(-50%) scale(0.95);
}

.nav-btn-prev {
  left: 12px;
}

.nav-btn-next {
  right: 12px;
}
.feedback-trigger{
  text-align: center;
  font-size: 28px;
}
.trigger-container{
  display: flex;
  justify-content: center;
  align-items: center;
  height: 10vh
}
.banners{
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
}

@media (max-width: 480px) {
  .nav-btn {
    width: 40px;
    height: 40px;
    font-size: 24px;
  }
}
/* ===================== Bosh sahifa · yangi dizayn ===================== */
.uy-home {
  padding: 24px 18px 24px;
  max-width: 560px;
  margin: 0 auto;
  font-family: var(--uy-font);
}

/* ② Banner */
.uy-banner { position: relative; margin-bottom: 32px; }
.uy-banner-track {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  border-radius: 22px;
  scrollbar-width: none;
  -ms-overflow-style: none;
  box-shadow: 0 10px 26px rgba(239, 78, 36, 0.16);
}
.uy-banner-track::-webkit-scrollbar { display: none; }
.uy-banner-slide {
  position: relative;
  flex: 0 0 100%;
  aspect-ratio: 376 / 224;
  scroll-snap-align: start;
  border: 0;
  padding: 0;
  display: flex;
  align-items: stretch;
  overflow: hidden;
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.uy-banner-img { width: 100%; height: 100%; object-fit: cover; }
.theme-orange { background: radial-gradient(120% 90% at 50% 120%, #E2421A 0%, #F05A2E 55%, #F47A4E 100%); color: #fff; }
.theme-peach { background: linear-gradient(90deg, #F2C694 0%, #F4A866 100%); color: #2A2A2A; }
.theme-promo { background: linear-gradient(120deg, #FFF3EC 0%, #FDE3D9 100%); color: #2A2A2A; }
.uy-banner-copy {
  position: relative;
  z-index: 1;
  width: 58%;
  padding: 22px 0 22px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.uy-banner-title { font-size: 26px; font-weight: 900; line-height: 1.08; letter-spacing: -0.3px; }
.theme-peach .uy-banner-title { color: #E9582E; }
.theme-promo .uy-banner-title { color: var(--uy-orange); }
.uy-banner-sub { font-size: 13px; font-weight: 700; line-height: 1.3; opacity: 0.92; }
.uy-banner-art {
  position: absolute;
  right: -10px;
  bottom: -4px;
  width: 54%;
  height: 92%;
  display: flex;
  align-items: flex-end;
}
.uy-banner-art :deep(svg) { width: 100%; height: 100%; }
.uy-banner-collage {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
}
.uy-banner-collage img {
  width: 78px;
  height: 78px;
  object-fit: cover;
  border-radius: 16px;
  border: 3px solid #fff;
  margin-left: -26px;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
}
.uy-banner-collage img:nth-child(2) { transform: translateY(-14px); }
.uy-banner-dots {
  position: absolute;
  left: 50%;
  bottom: 12px;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
  padding: 7px 10px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.25);
  pointer-events: none;
}
.uy-banner-dots span { width: 6px; height: 6px; border-radius: 3px; background: rgba(255, 255, 255, 0.6); transition: width 0.25s ease; }
.uy-banner-dots span.active { width: 18px; background: #fff; }

/* Bo'lim sarlavhasi */
.uy-section-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
.uy-section-head h2 { margin: 0; font-size: 22px; font-weight: 900; color: var(--uy-text); letter-spacing: -0.2px; }
.uy-see-all { font-size: 16px; font-weight: 900; color: var(--uy-orange); text-decoration: none; }

/* ④ Saralangan bo'limlar */
.uy-cats { margin-bottom: 32px; }
.uy-cats-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px 12px; }
.uy-cat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--uy-text);
  -webkit-tap-highlight-color: transparent;
}
.uy-cat-tile {
  width: 100%;
  max-width: 82px;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  background: #fff;
  color: var(--uy-orange);
  box-shadow: 0 4px 14px rgba(17, 24, 39, 0.05);
  transition: transform 0.15s ease;
}
.uy-cat:active .uy-cat-tile { transform: scale(0.95); }
.uy-cat-name {
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
  text-align: center;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}
.uy-skeleton { background: linear-gradient(90deg, #fff 25%, #f3f3f5 50%, #fff 75%); background-size: 200% 100%; animation: uy-shimmer 1.4s infinite; box-shadow: none; }
.uy-skeleton-line { width: 70%; height: 12px; border-radius: 6px; background: #eceef1; }
@keyframes uy-shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }

/* ⑦ Vakansiyalar */
.uy-vacancy {
  display: block;
  width: 100%;
  margin: 8px 0 0;
  padding: 0;
  border: 0;
  background: none;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 10px 24px rgba(240, 83, 58, 0.22);
  -webkit-tap-highlight-color: transparent;
}
.uy-vacancy img { display: block; width: 100%; height: auto; }
</style>
