<template>


    <!-- Main header -->
    <header class="modern-header">
      <div class="header-content">
        <router-link to="/search" class="search-link" title="Search">
          <input type="text" placeholder="Mahsulotlarni qidirish..." class="search-input" />
        </router-link>
        <router-link to="/search" class="search-link" title="Search">
          <i class="fas fa-search" style="font-size:20px;color:#444;margin-right:20px;"></i>
        </router-link>
        <router-link to="/map" class="profile-link">
          <i class="bi bi-geo-alt-fill" style="font-size:20px;color:#444;"></i>
        </router-link>
      </div>
    </header>
</template>

<style scoped>
/* Brand bar at top */


/* Modern header */
.modern-header {
  position: fixed;
  top: 70px;
  left: 0;
  right: 0;
  height: 70px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-bottom: 1px solid #e9ecef;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  z-index: 998;
}

.header-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.logo-img {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  object-fit: cover;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.user-name {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.loading-skeleton {
  width: 160px;
  height: 20px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
}

.profile-link {
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.profile-img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e9ecef;
  transition: all 200ms ease;
  cursor: pointer;
}

.profile-img:hover {
  border-color: #ff5722;
  box-shadow: 0 4px 12px rgba(255, 87, 34, 0.2);
  transform: scale(1.05);
}
.search-input {
  min-width: 250px;
  width: 80%;
  padding: 8px 12px;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  transition: all 200ms ease;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>

<script setup>
import { ref, onMounted } from 'vue'
import { API } from '../variable/link.js'
import axios from 'axios'
import { getChatID, getProfileImg } from '../variable/chat.js'

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