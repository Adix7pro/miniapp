<script setup>
import bottomBar from './components/bottomBar.vue';
import { onMounted, computed, ref, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n'
import headerBar from './components/headerBar.vue';
import { isTelegramWebApp, enterTelegramFullscreen } from './variable/telegram.js'
import { getChatID } from './variable/chat.js'
import axios from 'axios'
import { API } from './variable/link.js'


const route = useRoute();
const router = useRouter();
const { locale } = useI18n()
const userLanguage = ref(null)
const showBars = computed(() => !['/register', '/phone', '/verify','/','/barcode','feedback','/sms','/smsVerify'].includes(route.path));
const showTopBars = computed(() => !['/register', '/phone', '/verify','/','/barcode','feedback','/sms','/smsVerify','/search'].includes(route.path) && !route.path.startsWith('/collection') && !route.path.startsWith('/product/') && !route.path.startsWith('/profile'));
const showBottomBars = computed(() => !['/register', '/phone', '/verify','/',"feedback",'/product','/sms','/smsVerify'].includes(route.path) && !route.path.startsWith('/product/'));
const runningInsideTelegram = ref(true)
const deviceAllowed = ref(true)
const chatID = getChatID()
const devOverride = (route.query?.dev || new URLSearchParams(window.location.search).get('dev'))?.toString() === '1'

let pointerListenerAdded = false
const tg = window?.Telegram?.WebApp



// Pages where back button should not be visible
const noBackButtonPages = ['/register', '/phone', '/verify', '/', '/barcode', '/sms', '/smsVerify']



let socket = null
let socketReconnectTimer = null

const setupTelegramIntegration = () => {
  if (!window.Telegram || !window.Telegram.WebApp) return false

  const WebApp = window.Telegram.WebApp

  // Check platform and disallow desktop/unknown platforms
  const platform = (WebApp.platform || '').toString().toLowerCase()
  if (platform === 'tdesktop' || platform === 'unknown') {
    console.warn('App.vue: Telegram WebApp platform not supported for full app:', platform)
    // mark as not running inside supported Telegram environment so UI will show the block
    runningInsideTelegram.value = false
    return false
  }

  // Mark app as ready
  WebApp.ready?.()

  // Enable viewport expansion
  WebApp.expand?.()

  // Set app background color
  WebApp.setBackgroundColor?.('#f8f9fa')
  WebApp.setHeaderColor?.('#ffffff')


  // Handle viewport changes
  WebApp.onViewportChanged?.((data) => {
    console.log('Viewport changed')
  })

  // Disable swipe
  WebApp.disableSwipeGesture?.()

  runningInsideTelegram.value = true
  console.log('App.vue: Telegram integration successful')
  return true
}

// Default back handler used for Telegram BackButton
const defaultBackHandler = () => {
  try {
    router.go(-1)
  } catch (e) {
    try { router.back() } catch (e2) { console.warn('App.vue: Back navigation failed', e2) }
  }
}

// Update Telegram WebApp BackButton to match router state
function updateTelegramBackButton() {
  try {
    const WebApp = (window.Telegram || window.TelegramWebviewProxy)?.WebApp
    if (!WebApp || !WebApp.BackButton) return

    // If current page should not show back button, hide and remove handler
    if (noBackButtonPages.includes(route.path)) {
      WebApp.BackButton.hide?.()
      WebApp.BackButton.offClick?.(defaultBackHandler)
      return
    }

    // Attach our handler and show the button
    WebApp.BackButton.offClick?.(defaultBackHandler)
    WebApp.BackButton.onClick?.(defaultBackHandler)
    WebApp.BackButton.show?.()
  } catch (e) {
    console.warn('App.vue: Failed to update Telegram BackButton', e)
  }
}

// Try to enter browser fullscreen using Fullscreen API
const enterBrowserFullscreen = async () => {
  try {
    if (document.fullscreenElement) return true
    const el = document.documentElement
    if (el.requestFullscreen) {
      await el.requestFullscreen()
      return true
    }
    // vendor prefixed fallbacks
    if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen()
      return true
    }
    if (el.msRequestFullscreen) {
      el.msRequestFullscreen()
      return true
    }
  } catch (e) {
    console.warn('enterBrowserFullscreen failed', e)
  }
  return false
}



const onFirstUserGesture = async () => {
  if (pointerListenerAdded) {
    try { await enterBrowserFullscreen() } finally {
      document.removeEventListener('pointerdown', onFirstUserGesture)
      pointerListenerAdded = false
    }
  }
}



onMounted(() => {
  // detect device (mobile/tablet) and attach resize listener
  const detectDevice = () => {
    try {
      // userAgent check for mobile/tablet
      const ua = navigator.userAgent || ''
      const mobileRegex = /Mobi|Android|iPhone|iPad|iPod|Tablet|Windows Phone|webOS/i
      const isMobileUA = mobileRegex.test(ua)
      // also allow by viewport width (tablets) - treat <= 1024px as mobile/tablet
      const isNarrow = typeof window !== 'undefined' && window.innerWidth <= 1024
      deviceAllowed.value = isMobileUA || isNarrow || devOverride
    } catch (e) {
      deviceAllowed.value = devOverride
    }
  }
  detectDevice()
  const onResize = () => detectDevice()
  window.addEventListener('resize', onResize)

  // Try to initialize TMA.js SDK only if detected in Telegram
  // (Note: Using native Telegram WebApp API instead now, which is more reliable)
  const initTMASDK = () => {
    // TMA.js SDK initialization moved to setupTelegramIntegration for better error handling
    return true
  }

  const tryDetect = () => {
    const found = isTelegramWebApp()
    if (found) {
      // let setupTelegramIntegration determine whether the platform is supported
      const ok = setupTelegramIntegration()
      if (ok) {
        initTMASDK()
        enterTelegramFullscreen()
        // also request browser fullscreen as best-effort
        enterBrowserFullscreen()
        return true
      }
      return false
    }
    return false
  }

  if (tryDetect()) return

  let attempts = 0
  const maxAttempts = 10
  const interval = setInterval(() => {
    attempts += 1
    if (tryDetect() || attempts >= maxAttempts) {
      clearInterval(interval)
      if (attempts >= maxAttempts && !runningInsideTelegram.value) {
        runningInsideTelegram.value = false
          // not inside Telegram — try browser fullscreen; browsers often require a user gesture
          enterBrowserFullscreen().then((ok) => {
            if (!ok && !pointerListenerAdded) {
              // attach one-time listener to request fullscreen on first user gesture
              document.addEventListener('pointerdown', onFirstUserGesture, { passive: true })
              pointerListenerAdded = true
            }
          })
      }
    }
  }, 200)


  // Apply language preference: URL lang param takes precedence, otherwise user lang
  applyLangFromUrlOrUser()
})

const fetchUserLanguage = async () => {
  try {
    const chatID = getChatID()
    if (!chatID) {
      console.log('App.vue: chatID not available, skipping user language fetch')
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

    const response = await api.get('/user', {
      params: { chatID }
    })
    // Set i18n locale from user data if available and remember it
    if (response.data?.data?.language) {
      const userLang = response.data.data.language
      if (userLang === 'uz' || userLang === 'ru' || userLang === 'en') {
        userLanguage.value = userLang
        console.log('App.vue: fetched user language:', userLang)
        return userLang
      }
    }
    return null
  } catch (error) {
    console.error('App.vue: Error fetching user language:', error)
  }
}

// Decide language based on URL param first, then user language from server
const applyLangFromUrlOrUser = async () => {
  try {
    const urlLang = (route.query?.lang || new URLSearchParams(window.location.search).get('lang'))?.toString()?.replace(/['"]/g, '')
    const valid = (l) => l === 'uz' || l === 'ru' || l === 'en'

    if (urlLang && valid(urlLang)) {
      if (locale.value !== urlLang) {
        locale.value = urlLang
        console.log('App.vue: locale set from URL param:', urlLang)
      }
      return
    }

    // If no valid URL lang, use cached userLanguage or fetch it
    if (!userLanguage.value) {
      const fetched = await fetchUserLanguage()
      if (fetched && valid(fetched)) {
        locale.value = fetched
        console.log('App.vue: locale set from fetched user language:', fetched)
      }
      return
    }

    if (valid(userLanguage.value) && locale.value !== userLanguage.value) {
      locale.value = userLanguage.value
      console.log('App.vue: locale set from cached user language:', userLanguage.value)
    }
  } catch (e) {
    console.error('App.vue: applyLangFromUrlOrUser error', e)
  }
}

// Re-run language selection and update back button on every route change
watch(() => route.fullPath, () => {
  applyLangFromUrlOrUser()
}, { immediate: false })

onBeforeUnmount(() => {
  if (pointerListenerAdded) {
    try { document.removeEventListener('pointerdown', onFirstUserGesture) } catch (e) {}
  }
  try {
    window.removeEventListener('resize', () => {})
  } catch (e) {}
  // cleanup websocket
  try { if (socket) { socket.close(); socket = null } } catch (e) {}
  try { if (socketReconnectTimer) { clearTimeout(socketReconnectTimer); socketReconnectTimer = null } } catch (e) {}
})
</script>

<template>
    <div class="header" v-if="showBars">
      <div class="brand-bar">
        <p>Uyda Loyalty</p>
      </div>

      <div class="header-spacer" v-if="!route.path.startsWith('/collection') && !route.path.startsWith('/product/')"></div>
    </div>
    <headerBar v-if="showTopBars" style="position: fixed;"/>
    <router-view />
    <div class="_bottom-space"></div>
    <bottomBar v-if="showBottomBars" />
  <!-- </div> -->
  <!-- <div v-else class="telegram-block d-flex justify-content-center align-items-center">
    <div class="card p-4 text-center" style="max-width:480px;">
      <div v-if="!deviceAllowed">
        <h4 class="mb-3">Iltimos, ilovani mobil qurilmada yoki planshetda oching</h4>
        <p class="mb-3">Bu ilova faqat mobil telefonlar va planshetlar uchun mo'ljallangan. Iltimos, mobil qurilmadan oching.</p>
      </div>
      <div v-else>
        <h4 class="mb-3">Iltimos, ilovani Telegram ichida oching</h4>
        <p class="mb-3">Bu ilova faqat Telegram WebApp muhiti uchun mo'ljallangan. </p>
      </div>
      
    </div> -->
  <!-- </div> -->
</template>

<style scoped>
/* App now delegates rendering to routed views */
:host {
  display: block;
}
.active{
  visibility: inherit !important;
}
.telegram-block {
  position: fixed;
  inset: 0;
  background: #f8f9fa;
  z-index: 2000;
}
._bottom-space{
  height: 100px;
  position: relative;
}

.brand-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid #e9ecef;
  z-index: 999;
}

.brand-bar p {
  margin: 5px;
  padding-top: 18px;
  font-size: 20px;
  font-weight: 900;
  color: #ff5722;
  letter-spacing: 0.5px;
}

/* Spacer for fixed header */
.header-spacer {
  height: 120px;
}
</style>
