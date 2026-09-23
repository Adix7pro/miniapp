<template>
  <loading-spinner :show="loading" />
  <div class="feedback-page container py-4">
    <!-- Loading spinner -->
    <div v-if="loading" class="d-flex justify-content-center align-items-center" style="min-height: 60vh">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">{{ t('loading') }}</span>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="alert alert-danger" role="alert">
      <h5>{{ t('error_generic') }}</h5>
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="$router.back()">{{ t('cancel') }}</button>
    </div>

    <!-- Feedback form (always available when not loading/error) -->
    <div v-else class="feedback-container">
      <!-- Recipient info header (shows only if recipient loaded) -->
      <div v-if="recipient" class="recipient-card mb-4">
        <div class="d-flex align-items-center gap-3">
          <div v-if="recipient.logo" class="recipient-logo">
            <img :src="recipient.logo" :alt="recipient.name" />
          </div>
          <div>
            <h5 class="mb-1">{{ recipient.name }}</h5>
            <p class="text-muted small mb-0">{{ recipient.address || 'Manzili noma\'lum' }}</p>
          </div>
        </div>
      </div>
      <!-- If recipient isn't loaded, show the code extracted from URL -->
      <div v-else class="recipient-card mb-4">
        <div class="d-flex align-items-center gap-3">
          <div>
            <h5 class="mb-1">{{ t('recipient') }}</h5>
            <p class="text-muted small mb-0">{{ urlRecipientCode || '-' }}</p>
          </div>
        </div>
      </div>

      <!-- Rating section -->
      <div class="rating-section mb-4">
        <label class="form-label fw-semibold">{{ t('rating') }}</label>
        <div class="rating d-flex gap-3 align-items-center justify-content-center mb-3">
          <template v-for="i in 5" :key="i">
            <button
              type="button"
              class="star-btn"
              :class="{ active: i <= rating }"
              @click="setRating(i)"
              :aria-pressed="i <= rating"
              :aria-label="`Rate ${i} stars`"
            >
              <svg width="44" height="44" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 .587l3.668 7.431L23.4 9.75l-5.6 5.456L19.335 24 12 19.897 4.665 24l1.535-8.794L.6 9.75l7.732-1.732L12 .587z"/>
              </svg>
            </button>
          </template>
        </div>
        <div v-if="rating > 0" class="text-center text-primary small">
          {{ rating }} {{ rating === 1 ? t('star') : t('stars') }}
        </div>
      </div>

      <!-- Comment section -->
      <div class="comment-section mb-4">
        <label for="comment" class="form-label fw-semibold">{{ t('comment_optional') }}</label>
        <textarea
          id="comment"
          v-model="comment"
          rows="6"
          maxlength="500"
          class="form-control"
          :placeholder="t('feedback_placeholder')"
        ></textarea>
        <div class="text-end small text-muted mt-2">{{ comment.length }} / 500</div>
      </div>

      <!-- Action buttons -->
      <div class="button-group d-flex gap-2">
        <button
          class="btn btn-secondary flex-fill"
          @click="deleteRecipientCode();"
          :disabled="submitting"
        >
          {{ t('cancel') }}
        </button>
        <button
          class="btn btn-primary flex-fill"
          @click="submitFeedback"
          :disabled="submitting || rating === 0"
        >
          {{ submitting ? t('submitting') : t('submit') }}
        </button>
      </div>

      <!-- Success message -->
      <div v-if="successMessage" class="alert alert-success mt-3" role="alert">
        {{ successMessage }}
      </div>

      <!-- Success modal (overlay) -->
      <div v-if="showSuccessModal" class="feedback-modal-overlay" role="dialog" aria-modal="true">
        <div class="feedback-modal">
          <h5 class="mb-2">{{ t('thank_you') }}</h5>
          <p class="small text-muted mb-0">{{ t('feedback_received') || t('thank_you') }}</p>
        </div>
      </div>
    </div>

    <!-- (removed no-data state) -->
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { API } from '../variable/link.js'
import axios from 'axios'
import { getChatID, getRecipientCode, saveRecipientCode, deleteRecipientCode } from '../variable/chat.js'
import LoadingSpinner from './LoadingSpinner.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

// State
const loading = ref(false)
const error = ref(null)
const recipient = ref(null)
const rating = ref(0)
const comment = ref('')
const submitting = ref(false)
const successMessage = ref('')
const showSuccessModal = ref(false)
const urlRecipientCode = ref(null)

// API instance
const api = axios.create({
  baseURL: API.link,
  headers: {
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': '1',
    'Authorization': 'Basic ' + btoa(`${API.username}:${API.password}`)
  }
})

// NOTE: There is no recipient API. We intentionally do NOT fetch recipient info.

// Set rating
function setRating(i) {
  rating.value = i
}

// Submit feedback
const submitFeedback = async () => {
  if (rating.value === 0) return

  submitting.value = true
  successMessage.value = ''

  try {
    const chatID = typeof getChatID === 'function' ? getChatID() : null
    
    // Get recipient code from same sources as fetch
    let recipientCode = route.params.recipientCode || route.query.recipientCode || route.query.code
    if (!recipientCode && window.location.search) {
      const params = new URLSearchParams(window.location.search)
      recipientCode = params.get('recipientCode') || params.get('code')
    }
    
    if (!recipientCode) {
      error.value = 'Recipient code not found'
      submitting.value = false
      return
    }
    
    const body = {
      chatID,
      recipientCode,
      rating: rating.value,
      comment: comment.value,
      timestamp: new Date().toISOString()
    }

    const resp = await api.post('/feedback', body)
    
    if (resp?.status === 200) {
      successMessage.value = t('thank_you')
      rating.value = 0
      comment.value = ''
      // Show success modal then redirect to /home
      showSuccessModal.value = true
      
      // Delete recipientCode from Cloud Storage after successful submission
      deleteRecipientCode()
      console.log('RecipientCode deleted from Cloud Storage')

      const userCheck = axios.get(`${API.link}/user`, {
          params: { chatID }
        })
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } else {
      error.value = resp?.data?.message || 'Server error'
    }
  } catch (err) {
    console.error('Error submitting feedback:', err)
    error.value = err?.response?.data?.message || t('feedback_error')
  } finally {
    submitting.value = false
  }
}

// Fetch recipient info (optional - doesn't block if fails)
async function fetchRecipient(recipientCode) {
  try {
    const response = await api.get('/recipient', {
      params: { code: recipientCode }
    })
    
    if (response?.status === 200 && response?.data?.data) {
      recipient.value = response.data.data
    }
  } catch (err) {
    console.log('Recipient info not available:', err?.message)
    // Don't set error - it's optional
  }
}

// Helper to extract recipient code from route or URL
function extractRecipientCode() {
  let code = route.params.recipientCode || route.query.recipientCode || route.query.code
  if (!code && typeof window !== 'undefined' && window.location.search) {
    const params = new URLSearchParams(window.location.search)
    code = params.get('recipientCode') || params.get('code')
  }
  return code
}

async function checkUser(chatID) {
  try {
    const response = await api.get('/user', {
      params: { chatID }
    })

    if ((response?.status === 200 || response?.status === 201) && response?.data?.data?.verified === true) {
      // User exists and verified - show feedback page
      
      loading.value = false
      error.value = null
      
      return
    } else if (response?.status === 201 || response?.data?.data?.verified === false) {
      // User exists but not verified - redirect to phone verification
      const code = extractRecipientCode()
      router.push({
        path: '/',
        query: { recipientCode: code }
      })
      return
    }
  } catch (err) {
    // User not found or error - redirect to welcome with recipientCode
    const code = extractRecipientCode()
    router.push({
      path: '/',
      query: { recipientCode: code }
    })
    console.error('Error checking user:', err)
  }
}

// Load recipient on mount (do not block form if recipient not found)
onMounted(async () => {
  const chatID = typeof getChatID === 'function' ? getChatID() : null
  
  // Extract recipient code first from URL/route
  let code = extractRecipientCode()
  
  // If no code in URL, try to get from Cloud Storage
  if (!code) {
    await new Promise((resolve) => {
      getRecipientCode((err, cloudCode) => {
        if (!err && cloudCode) {
          code = cloudCode
          console.log('RecipientCode retrieved from Cloud Storage:', cloudCode)
        }
        resolve()
      })
    })
  }
  
  urlRecipientCode.value = code
  
  // Save recipientCode to Cloud Storage so it persists
  if (code) {
    saveRecipientCode(code)
    console.log('RecipientCode saved to Cloud Storage:', code)
  }
  
  // Check user and redirect if needed
  await checkUser(chatID)
  
  // If we reach here, user is valid - load recipient info if available
  if (urlRecipientCode.value) {
    // Try to fetch recipient for richer UI, but it's optional
    fetchRecipient(urlRecipientCode.value)
  }
})
</script>

<style scoped>
.feedback-page {
  max-width: 600px;
  margin: 0 auto;
  padding-bottom: 80px;
}

.recipient-card {
  background: linear-gradient(135deg, #ff5722 0%, #ffb26e 100%);
  border-radius: 12px;
  padding: 20px;
  color: white;
  box-shadow: 0 4px 12px rgba(255, 87, 34, 0.15);
}

.recipient-logo {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.recipient-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.recipient-card h5 {
  color: white;
  font-weight: 600;
}

.recipient-card .text-muted {
  color: rgba(255, 255, 255, 0.8) !important;
}

.rating-section {
  text-align: center;
}

.rating {
  justify-content: center;
}

.star-btn {
  background: transparent;
  border: none;
  padding: 6px;
  color: #d1d5db;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.star-btn:hover {
  color: #ffc107;
  transform: scale(1.1);
}

.star-btn.active {
  color: #ffc107;
  filter: drop-shadow(0 4px 8px rgba(255, 160, 0, 0.18));
}

.star-btn:focus {
  outline: none;
  box-shadow: 0 0 0 4px rgba(255, 193, 7, 0.12);
}

.comment-section {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
}

.comment-section label {
  margin-bottom: 12px;
}

.comment-section textarea {
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 12px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.comment-section textarea:focus {
  border-color: #ff5722;
  box-shadow: 0 0 0 3px rgba(255, 87, 34, 0.1);
  outline: none;
}

.button-group {
  gap: 12px;
}

.button-group .btn {
  padding: 12px 24px;
  font-weight: 600;
  border-radius: 8px;
}

.button-group .btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.alert {
  border-radius: 8px;
  border: none;
}

.feedback-modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.4);
  z-index: 1050;
}

.feedback-modal {
  background: #fff;
  padding: 20px 22px;
  border-radius: 10px;
  max-width: 420px;
  width: 90%;
  text-align: center;
  box-shadow: 0 8px 28px rgba(0,0,0,0.18);
}

/* Responsive */
@media (max-width: 480px) {
  .feedback-page {
    padding: 12px;
  }

  .recipient-card {
    padding: 16px;
  }

  .star-btn svg {
    width: 36px;
    height: 36px;
  }

  .comment-section textarea {
    font-size: 16px; /* Prevent zoom on iOS */
  }

  .button-group {
    flex-direction: column;
  }
}
</style>
