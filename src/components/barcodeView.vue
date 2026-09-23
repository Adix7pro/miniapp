<script setup>
import { ref, onMounted, nextTick, onBeforeUnmount, computed } from 'vue'
import JsBarcode from 'jsbarcode'
import QRCode from 'qrcode'
import { getChatID } from '../variable/chat.js'
import { t, getStoredLang } from '../variable/i18n.js'
import OverViewModal from './overViewModal.vue'
import axios from 'axios'
import { API } from '../variable/link.js'

const language = ref(getStoredLang())

const value = ref('UYDA-1234567890')
const qrValue = ref('QR-CODE-1234567890')
const svgRef = ref(null)
const qrCanvasRef = ref(null)
const mountedFlag = ref(false)
let _retryTimer = null
const showOverviewModal = ref(false)
const userProfile = ref({})
const profileImg = ref(null)

profileImg.value = window.Telegram?.WebApp?.user?.photo_url


const api = axios.create({
  baseURL: API.link,
  headers: {
    Accept: 'application/json',
    'ngrok-skip-browser-warning': '1',
    Authorization: 'Basic ' + btoa(`${API.username}:${API.password}`)
  }
})

value.value = getChatID()
qrValue.value = `${getChatID()}`

async function fetchUserProfile() {
  try {
    const chatID = getChatID()
    const resp = await api.get(`/user?chatID=${chatID}`)
    if (resp.status === 200) {
      userProfile.value = resp.data.data
    } else {
      console.error('Failed to fetch user profile:', resp.data)
    }
  } catch (err) {
    console.error('Error fetching user profile:', err)
  }
}

onMounted(() => {
  fetchUserProfile()
})


async function renderBarcode() {
  try {
    if (!svgRef.value) return
    if (!svgRef.value.isConnected) return
    JsBarcode(svgRef.value, value.value, {
      format: 'CODE128',
      width: 3.5,
      height: 100,
      displayValue: true,
      fontSize: 28,
      margin: 5,
      lineColor: '#000',
      displayValue: false
    })
  } catch (e) {
    console.error('Barcode render error', e)
  }
}

async function renderQRCode() {
  try {
    if (!qrCanvasRef.value) return
    if (!qrCanvasRef.value.isConnected) return
    await QRCode.toCanvas(qrCanvasRef.value, qrValue.value, {
      width: 180,
      margin: 2,
      color: {
        dark: '#ff5722',
        light: '#ffffff'
      }
    })
  } catch (e) {
    console.error('QR Code render error', e)
  }
}

onMounted(async () => {
  try {
    await nextTick()
    mountedFlag.value = true
    
    // Render barcode
    if (svgRef.value && svgRef.value.isConnected) {
      renderBarcode()
    } else {
      _retryTimer = setInterval(() => {
        try {
          if (svgRef.value && svgRef.value.isConnected) {
            clearInterval(_retryTimer)
            _retryTimer = null
            renderBarcode()
          }
        } catch (err) {
          console.error('JsBarcode retry error', err)
        }
      }, 50)
    }
    
    // Render QR code
    setTimeout(() => renderQRCode(), 100)
  } catch (e) {
    console.error('JsBarcode mount error', e)
  }
})

onBeforeUnmount(() => {
  if (_retryTimer) {
    clearInterval(_retryTimer)
    _retryTimer = null
  }
  const h = window.__uyda_rating_handler_barcode
  if (h) { 
    window.removeEventListener('uyda-rating', h)
    delete window.__uyda_rating_handler_barcode 
  }
})

async function regenerate() {
  if (!mountedFlag.value) {
    await nextTick()
  }
  await nextTick()
  return renderBarcode()
}

onMounted(() => {
  window.__uyda_rating_handler_barcode = (ev) => {
    try {
      const payload = ev && ev.detail
      if (!payload) return
      const myChat = getChatID()
      console.log('barcodeView: uyda-rating received', payload, 'myChat:', myChat)
      if (String(payload.chatID) === String(myChat)) {
        console.log('barcodeView: chatID matched, opening overview modal')
        showOverviewModal.value = true
      } else {
        console.log('barcodeView: chatID mismatch, ignoring event')
      }
    } catch (e) { 
      console.error('barcodeView ratingHandler error', e) 
    }
  }
  window.addEventListener('uyda-rating', window.__uyda_rating_handler_barcode)
})

const submitOverview = async (payload) => {
  try {
    const chatID = getChatID()
    const body = { chatID, rating: payload.rating, comment: payload.comment }
    const resp = await api.post('/feedback', body)
    if (resp.status === 200) {
      alert('Rahmat! Fikringiz qabul qilindi.')
    } else {
      alert(resp.data?.message || 'Server javobi kutilmagan.')
    }
  } catch (err) {
    console.error('Error submitting overview from barcodeView:', err)
    alert(err.response?.data?.message || err.message || 'Fikr yuborishda xatolik yuz berdi.')
  } finally {
    showOverviewModal.value = false
  }
}
</script>

<template>
  <div class="barcode-container">
    <!-- Premium Loyalty Card -->
    <div class="loyalty-card">
      <!-- Header: Profile Section -->
      <div class="card-header">
        <div class="profile-section">
          <img v-if="profileImg" :src="profileImg" class="profile-avatar" alt="Profile">
          <div v-else class="profile-avatar-placeholder">
            <i class="fas fa-user"></i>
          </div>
          <div class="profile-info">
            <h2 class="profile-name">{{ userProfile.fullName || 'User' }}</h2>
            <p class="profile-id">ID: {{ value }}</p>
          </div>
        </div>
      </div>

      <!-- Middle: Barcode & QR Code Section -->
      <div class="codes-section">
        <div class="code-wrapper barcode-wrapper">
          <svg ref="svgRef" class="barcode" style="color: #ff7900;"></svg>
        </div>
        <div class="divider"></div>
      </div>

      <!-- Footer: Bonus Section -->
      <div class="card-footer">
        <div class="bonus-display">
          <i class="fas fa-gift"></i>
          <div class="bonus-info">
            <span class="bonus-label">{{ t('total_Bonus') || 'Jami Bonus' }}</span>
            <span class="bonus-amount">{{ userProfile.balance || 0 }} so'm</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Overview Modal for Feedback -->
    <OverViewModal v-if="showOverviewModal" @submit="submitOverview" @close="showOverviewModal = false" />
  </div>
</template>

<style scoped>
.barcode-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.loyalty-card {
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  max-width: 500px;
  width: 100%;
  overflow: hidden;
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Header Section with Profile */
.card-header {
  background: linear-gradient(135deg, var(--primary) 0%, #e64a19 100%);
  padding: 30px 20px;
  color: white;
  border-bottom: 1px solid rgba(0, 0, 0, 0.4)
}

.profile-section {
  display: flex;
  align-items: center;
  gap: 15px;
}

.profile-avatar,
.profile-avatar-placeholder {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 3px solid rgba(255, 255, 255, 0.5);
}

.profile-avatar {
  object-fit: cover;
}

.profile-avatar-placeholder i {
  font-size: 32px;
  color: white;
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.profile-name {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  word-break: break-word;
  color: #232323;
}

.profile-id {
  margin: 5px 0 0 0;
  font-size: 12px;
  opacity: 0.9;
  color: #232323;
}

/* Codes Section */
.codes-section {
  padding: 30px 20px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 20px;
  background: #fff;
}

.code-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.code-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--primary);
  letter-spacing: 1px;
}

.barcode {
  max-width: 100%;
  height: auto;
}

.qr-code {
  border-radius: 8px;
  background: white;
  padding: 8px;
  border: 2px solid var(--primary);
}

.divider {
  width: 2px;
  height: 120px;
  background: linear-gradient(180deg, transparent, var(--primary), transparent);
  border-radius: 1px;
}

/* Footer Section - Bonus Display */
.card-footer {
  padding: 25px 20px;
  background: white;
  border-top: 2px solid #f0f0f0;
}

.bonus-display {
  display: flex;
  align-items: center;
  gap: 15px;
  justify-content: center;
  padding: 15px;
  background: linear-gradient(135deg, rgba(255, 87, 34, 0.1) 0%, rgba(255, 87, 34, 0.05) 100%);
  border-radius: 12px;
  border: 2px solid var(--primary);
}

.bonus-display i {
  font-size: 28px;
  color: var(--primary);
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.bonus-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
}

.bonus-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.bonus-amount {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary);
}

/* Responsive Design */
@media (max-width: 600px) {
  .barcode-container {
    padding: 10px;
  }

  .loyalty-card {
    max-width: 100%;
  }

  .card-header {
    padding: 20px 15px;
  }

  .profile-avatar,
  .profile-avatar-placeholder {
    width: 60px;
    height: 60px;
  }

  .profile-avatar-placeholder i {
    font-size: 28px;
  }

  .profile-name {
    font-size: 18px;
  }

  .codes-section {
    flex-direction: column;
    padding: 20px 15px;
    gap: 15px;
  }

  .divider {
    width: 60px;
    height: 2px;
    margin: 5px 0;
  }

  .bonus-display {
    flex-direction: row;
    padding: 12px;
  }

  .bonus-display i {
    font-size: 24px;
  }

  .bonus-amount {
    font-size: 20px;
  }
}

@media (max-width: 400px) {
  .codes-section {
    padding: 15px 10px;
    gap: 10px;
  }

  .barcode {
    max-width: 100%;
  }

  .qr-code {
    max-width: 140px;
  }

  .bonus-display {
    gap: 10px;
    padding: 10px;
  }

  .bonus-amount {
    font-size: 18px;
  }
}
</style>
