<template>
  <div class="home-page container py-4">
    <!-- Yangiliklar (news) -->
    <section class="mb-3">
      <h6 class="mb-2">{{ t('news') }}</h6>
      <div class="stories d-flex gap-3 overflow-auto py-2">
        <div v-for="(item, idx) in newsItems" :key="idx" class="story text-center">
          <button 
            class="story-button"
            type="button" 
            @click="showNews(idx)"
            @touchend.stop.prevent="showNews(idx)"
            :ref="el => setStoryRef(el, idx)"
          >
            <div class="story-ring">
              <div class="story-circle">
                <img :src="item.image" :alt="item.title" class="story-img" />
              </div>
            </div>
            <div class="story-name small mt-1">{{ item.title }}</div>
          </button>
        </div>
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
  

    <collection v-if="userData?.data" :receipts="receipts" :current-receipt="currentReceipt" />
    <!-- HR Jobs List View -->
     <div class="banners">
      <div class="banner" @click="$router.push('/jobs')">
        <img src="../assets/img/uyda_vacation.png" alt="" style="width: 350px; height: 100px;">
      </div>
     </div>

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
</style>
