<template>
  <div class="container">
    <!-- Profile Card -->
    <div v-if="userData?.data" class="card profile-card shadow-sm mb-4 mt-2">
      <div class="card-body">
        <div class="d-flex flex-column">
          <!-- User Info -->
          <div class="d-flex align-items-center mb-4">
            <img
              :src="img"
              :alt="userData.data.fullName"
              class="profile-img me-4"
            />
            <div>
              <h4 class="mb-1 fw-bold">{{ userData.data.fullName }}</h4>
              <h6 class="mb-1">{{ formatPhone(userData.data.phone) }}</h6>
            </div>
            <router-link to="/profile/edit" class="btn btn-light btn-sm ms-auto">
              <i class="bi bi-pencil"></i>
            </router-link>
          </div>

          <!-- User Details -->
          <div class="card bg-light p-4">
            <div class="row g-3">
              <div class="col-12">
                <label class="small text-muted d-block mb-1">{{ t('birthdate_label') }}</label>
                <div class="fw-medium">{{ new Date(userData.data.birthdate).toLocaleDateString("ru") }}</div>
              </div>
              
            </div>
          </div>
          <div class="col-12 dflex flex-column mt-3">
                <label class="small text-muted d-block mb-1">{{ t('choose_lang') }}</label>
                <div class="btn-group w-100" role="group" aria-label="Language selection">
                  <button
                    type="button"
                    class="btn"
                    :class="selectedLang === 'uz' ? 'btn-primary' : 'btn-outline-primary'"
                    @click="selectedLang = 'uz'"
                  >{{ t('lang_uz') }}</button>
                  <button
                    type="button"
                    class="btn"
                    :class="selectedLang === 'ru' ? 'btn-primary' : 'btn-outline-primary'"
                    @click="selectedLang = 'ru'"
                  >{{ t('lang_ru') }}</button>
                  
                </div>
              </div>
        </div>
      </div>
    </div>
  

    <!-- Loading Skeleton -->
    <div v-else class="card profile-card shadow-sm mb-4">
      <div class="card-body">
        <div class="d-flex align-items-center">
          <div class="loading-skeleton rounded-circle me-4" style="width: 100px; height: 100px;"></div>
          <div style="flex: 1;">
            <div class="loading-skeleton mb-2" style="height: 24px; width: 70%;"></div>
            <div class="loading-skeleton mb-2" style="height: 18px; width: 40%;"></div>
            <div class="loading-skeleton" style="height: 16px; width: 30%;"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Menu List -->
    <div class="card list-group shadow-sm mb-4">
      <router-link to="/branches" class="list-group-item d-flex align-items-center">
        <i class="bi bi-geo-alt-fill me-3 text-primary"></i>
        {{ t('our_stores') }}
        <i class="bi bi-chevron-right ms-auto"></i>
      </router-link>
      <button
        type="button"
        class="list-group-item d-flex align-items-center w-100 text-start contact-toggle"
        @click="isContactOpen = true"
      >
        <i class="bi bi-chat-dots-fill me-3 text-info"></i>
        Biz bilan bog'lanish
        <i class="bi bi-chevron-right ms-auto"></i>
      </button>
    </div>

    <div v-if="isContactOpen" class="contact-modal-overlay" @click.self="isContactOpen = false">
      <div class="contact-modal">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="mb-0">Biz bilan bog'lanish</h5>
          <button type="button" class="btn-close" aria-label="Close" @click="isContactOpen = false"></button>
        </div>
        <div class="contact-actions">
          <a class="btn btn-outline-primary contact-btn" :href="contactLinks.phone">
            <i class="bi bi-telephone-fill me-2"></i> Raqam
          </a>
          <a class="btn btn-outline-danger contact-btn" :href="contactLinks.instagram" target="_blank" rel="noopener noreferrer">
            <i class="bi bi-instagram me-2"></i> Instagram
          </a>
          <a class="btn btn-outline-info contact-btn" :href="contactLinks.telegram" target="_blank" rel="noopener noreferrer">
            <i class="bi bi-telegram me-2"></i> Telegram
          </a>
        </div>
      </div>
    </div>
  </div>


</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { API } from '../variable/link.js'
import axios from 'axios'
import { getChatID, getProfileImg } from '../variable/chat.js'
import { getStoredLang } from '../variable/i18n.js'

const userData = ref(null)
const img = ref('https://cdn-icons-png.flaticon.com/512/149/149071.png')

img.value = getProfileImg()?.photo_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'

// Use i18n
const { t, locale } = useI18n()
const selectedLang = ref(getStoredLang())
const isContactOpen = ref(false)
const contactLinks = {
  phone: 'tel:+998559012525',
  instagram: 'https://www.instagram.com/uyda_uz/',
  telegram: 'https://t.me/uyda_shop'
}
const formatedChat = getChatID() ? getChatID().toString() : null

// Watch for changes in selectedLang and update locale
watch(selectedLang, async (newLang) => {
  locale.value = newLang
  localStorage.setItem('uyda_lang', newLang)
  try { document.documentElement.lang = newLang } catch (e) {}

  // Persist language to server (POST /user/phone with chatID + language)
  try {
    const chatID = getChatID()
    if (chatID) {
      await api.put('/user', { chatID: formatedChat, language: newLang })
    }
  } catch (err) {
    console.warn('profileView: failed to persist language to server', err)
  }

  // Reload the page to apply the language change to all components
  // window.location.reload()
})


// API instance
const api = axios.create({
  baseURL: API.link,
  headers: {
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': '1',
    'Authorization': 'Basic ' + btoa(`${API.username}:${API.password}`)
  }
})

// Get user data from API
const getUserData = async () => {
  try {
    const chatID = getChatID() || '13192230691' // Fallback
    if (!chatID) {
      console.warn('profileView: chatID not found; skipping user fetch')
      return
    }
    const response = await api.get('/user', {
      params: { chatID }
    })
    userData.value = response.data
  } catch (error) {
    console.error('Error fetching user data:', error)
  }
}

// Format phone number
const formatPhone = (phone) => {
  if (!phone) return '-'
  return '+998 ' + phone
}

onMounted(async () => {
  await getUserData()
})
</script>

<style scoped>
.profile-card {
  border: none;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(255,255,255,0.9) 60%, rgba(227,233,247,1) 100%);
}
.profile-img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #fff;
  box-shadow: 0 2px 10px rgba(13, 110, 253, 0.12);
}
.card {
  border-radius: 18px;
}
.list-group-item {
  font-size: 1.08rem;
  font-weight: 500;
  border: none;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  transition: background 0.2s;
}
.list-group-item:last-child {
  border-bottom: none;
}
.list-group-item:active, .list-group-item:focus {
  background: rgba(13,110,253,0.04);
}
.contact-toggle {
  border: none;
  background: #fff;
}
.contact-actions {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}
.contact-btn {
  border-radius: 10px;
  width: 100%;
  text-align: left;
}
.contact-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  padding: 16px;
}
.contact-modal {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}
.btn {
  border-radius: 12px;
  font-weight: 500;
  font-size: 1rem;
}
</style>
