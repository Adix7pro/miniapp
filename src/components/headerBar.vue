<template>
  <!-- Qidiruv paneli: brend satri ostida qotib turadi -->
  <header class="uy-search-bar">
    <router-link to="/search" class="uy-search" :aria-label="t('search_placeholder')">
      <span class="uy-search-icon" v-html="icons.search"></span>
      <span class="uy-search-placeholder">{{ t('search_placeholder') }}</span>
      <span class="uy-search-camera" v-html="icons.camera"></span>
    </router-link>
    <router-link to="/map" class="uy-location" aria-label="Filiallar xaritasi">
      <span v-html="icons.pin"></span>
    </router-link>
  </header>
</template>

<style scoped>
.uy-search-bar {
  position: fixed;
  top: 70px;
  left: 0;
  right: 0;
  height: 84px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 22px 0 18px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(17, 24, 39, 0.05);
  z-index: 998;
  font-family: var(--uy-font);
}

.uy-search {
  flex: 1;
  min-width: 0;
  height: 52px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  border-radius: 18px;
  background: var(--uy-field);
  color: var(--uy-muted);
  text-decoration: none;
  transition: background 0.2s ease;
}
.uy-search:active { background: #E3E6EA; }

.uy-search-icon,
.uy-search-camera,
.uy-location span {
  display: inline-flex;
  flex-shrink: 0;
}

.uy-search-placeholder {
  flex: 1;
  min-width: 0;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.uy-location {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 44px;
  color: var(--uy-orange);
  text-decoration: none;
}
</style>

<script setup>
import { ref, onMounted } from 'vue'
import { API } from '../variable/link.js'
import axios from 'axios'
import { getChatID, getProfileImg } from '../variable/chat.js'
import { useI18n } from 'vue-i18n'
import { icons } from '../lib/uiIcons.js'

const { t } = useI18n()

const userData = ref(null)
const img = ref('https://cdn-icons-png.flaticon.com/512/149/149071.png')

img.value = getProfileImg()?.photo_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'

// API instance
console.log(getProfileImg())
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
    const chatID = getChatID() // Fallback
    if (!chatID) {
      console.warn('headerBar: chatID not found; skipping user fetch')
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

onMounted(async () => {
  await getUserData()
})
</script>