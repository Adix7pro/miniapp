<template>
  <div class="welcome-container d-flex flex-column justify-content-center align-items-center min-vh-100 px-3" @load="getUser">
    <!-- Loading Spinner -->
    <LoadingSpinner :show="loading" />
    
    <!-- Error Alert -->
    <div v-if="error" class="alert alert-danger alert-dismissible fade show w-100" role="alert" style="max-width: 300px;">
      <strong>Xatolik!</strong> {{ error }}
      <button type="button" class="btn-close" @click="error = null"></button>
    </div>
    
    <!-- Logo Area -->
    <div class="text-center mb-5">
      <img src="../assets/img/logo.png" alt="Uyda Logo" class="welcome-logo mb-4" />
      <div class="welcome-carousel-container">
        <div class="welcome-carousel">
          <span class="welcome-word" :class="{ active: currentWord === 0 }">Xush kelibsiz</span>
          <span class="welcome-word" :class="{ active: currentWord === 1 }">Добро&nbspпожаловать</span>
          <span class="welcome-word" :class="{ active: currentWord === 2 }">Welcome</span>
        </div>
      </div>
      <p class="text-muted">Tilni tanlang / Выберите язык</p>
    </div>

    <!-- Language Selection -->
    <div class="language-buttons d-grid gap-3" style="width: 100%; max-width: 300px;">
      <button
        class="btn btn-outline-primary py-3 fw-semibold position-relative"
        @click="selectLanguage('uz')"
        :disabled="loading"
      >
        O'zbekcha
      </button>
      <button
        class="btn btn-outline-primary py-3 fw-semibold"
        @click="selectLanguage('ru')"
        :disabled="loading"
      >
        Русский
      </button>
      
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { API } from '../variable/link.js'
import { getChatID, saveRecipientCode } from '../variable/chat.js'
import axios from 'axios'
import LoadingSpinner from './LoadingSpinner.vue'

const router = useRouter()
const currentWord = ref(0)
const carouselInterval = ref(null)
const loading = ref(false)
const error = ref(null)
const userData = ref(null)

// Axios instance yaratish
const api = axios.create({
  baseURL: API.link,
  headers: {
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': '1',
    'Authorization': 'Basic ' + btoa(`${API.username}:${API.password}`)
  }
})

const getUser = async () => {
  console.log('getUser called')
  try {
    loading.value = true
    error.value = null

    const chatID = getChatID() // Default fallback agar getChatID null qaytarsa
    console.log('Using chatID:', chatID)

    const response = await api.get('/user', {
      params: { chatID }
    })

    console.log('API Response:', {
      status: response.status,
      data: response.data,
      dataStatus: response.data?.status
    })
    console.log(response.data?.data.verified)
    
    userData.value = response.data
    if (response.status === 200) {
      console.log('User found with status 200')
      return response
    }
    return response


  } catch (err) {
    if (err.response?.status === 404) {
      console.log('New user detected')
    } 
    else {
      error.value = err.response?.data?.message || err.message || 'Xatolik yuz berdi'
      console.error('Error:', err)
    }
    return null
  } finally {
    loading.value = false
  }
}

const selectLanguage = async (lang) => {
  try {
    error.value = null // Avvalgi xatoni tozalash

    const response = await getUser()
    console.log('Full Response:', response)
    
    // Get recipientCode from URL if present
    const urlParams = new URLSearchParams(window.location.search)
    const recipientCode = urlParams.get('recipientCode') || urlParams.get('code')
    
    // Save recipientCode to Cloud Storage if present
    if (recipientCode) {
      saveRecipientCode(recipientCode)
      console.log('RecipientCode saved to Cloud Storage:', recipientCode)
    }
    
    // Agar response null bo'lsa yoki error bo'lsa
    if (!response) {
      console.log('No response, proceeding to register as new user')
      router.push({ path: '/register', query: { lang, isOld: 'false', recipientCode } })
      return
    }

    // Response.data borligini tekshirish
    if (!response.data) {
      console.log('No response data, proceeding to register as new user')
      router.push({ path: '/register', query: { lang, isOld: 'false', recipientCode } })
      return
    }

    // Data statusini tekshirish
    const status = response.data.status
    console.log('Checking status:', status)

    // Status bo'yicha yo'naltirish
    if (status === 200 && response.data.data.verified === true ) {
      console.log('Status 200: User exists, redirecting to home')
      const redirectPath = recipientCode ? `/feedback?recipientCode=${recipientCode}` : '/home'
      router.push(redirectPath)
      return
    } else if(status === 200 && response.data.data.verified === false) {
      console.log('Status 200: User not verified')
      router.push({path: '/phone', query: {lang, recipientCode}})
      return
    }

    const isOld = status !== 201
    if (isOld) {
      console.log('Status 201: Old user detected')
    }

    console.log('Navigating to register with:', { lang, isOld, recipientCode })
    router.push({ path: '/register', query: { lang, isOld: String(isOld), recipientCode } })
    
  } catch (err) {
    console.error('Error in selectLanguage:', err)
    // Xatolik bo'lsa error state ga o'zlamiz va shu pageda ushlab qo'lamiz
    error.value = err.response?.data?.message || err.message || 'Serverda xatolik yuz berdi. Iltimos qayta urinib ko\'ring.'
  }
}

const startCarousel = () => {
  carouselInterval.value = setInterval(() => {
    currentWord.value = (currentWord.value + 1) % 3
  }, 3000)
}

onMounted(async () => {
  startCarousel()
  // Debug: Telegram.WebApp ni console ga chiqarish
  console.log('=== Telegram WebApp Debug ===')
  console.log('window.Telegram:', window.Telegram)
  if (window.Telegram) {
    console.log('window.Telegram.WebApp:', window.Telegram.WebApp)
    if (window.Telegram.WebApp) {
      console.log('WebApp.initDataUnsafe:', window.Telegram.WebApp.initDataUnsafe)
      console.log('WebApp.initData:', window.Telegram.WebApp.initData)
      if (window.Telegram.WebApp.initDataUnsafe) {
        console.log('initDataUnsafe.user:', window.Telegram.WebApp.initDataUnsafe.user)
      }
    }
  }
  try {
    sessionStorage.removeItem('categoriesViewState')
  } catch (error) {
    console.log(error)
  }
  console.log('getChatID() result:', getChatID())
  console.log('===========================')

  const urlParams = new URLSearchParams(window.location.search)
  const recipientCode = urlParams.get('recipientCode') || urlParams.get('code')
  
  const response = await getUser()
  if (response?.status === 200 && response?.data.data.verified === true) {
    const redirectPath = recipientCode ? `/feedback/${recipientCode}` : '/home'
    router.push(redirectPath)
    return
  }else if(response?.status === 200 && response?.data.data.verified === false){
    router.push({path: "/phone", query: { recipientCode }})
    return
  }


  

})

onBeforeUnmount(() => {
  if (carouselInterval.value) {
    clearInterval(carouselInterval.value)
  }

})

</script>

<style scoped>
.welcome-container {
  background-color: #f8f9fa;
  min-height: 100vh;
}

.welcome-logo {
  width: auto;
  height: 240px;
  object-fit: contain;
}

.welcome-title {
  color: var(--bs-primary);
  font-size: 2rem;
  text-align: center;
}

.welcome-carousel-container {
  height: 45px;
  position: relative;
  margin-bottom: 0.5rem;
  width: 100%;
  max-width: 300px;
}

.welcome-carousel {
  display: block;
  height: 45px;
  position: relative;
  overflow: hidden;
  width: 100%;
}

.welcome-word {
  position: absolute;
  width: 100%;
  left: 0;
  right: 0;
  text-align: center;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.5s ease;
  font-size: 1.5rem;
  color: var(--bs-primary);
  font-weight: bold;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", system-ui, sans-serif;
  white-space: nowrap;
  padding: 0 10px;
}

.welcome-word.active {
  opacity: 1;
  transform: translateY(0);
}

.language-buttons .btn {
  border-radius: 12px;
  font-size: 1.1rem;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 150, 190, 0.35);
}

.btn-outline-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 150, 190, 0.15);
}
</style>