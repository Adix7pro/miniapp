<template>
  <div class="container py-4" style="padding: 0 !important;">
    <div class="card shadow-sm rounded-4">
      <div class="card-body p-4">
        <!-- Header -->
        <div class="mb-4">
          <h5 class="fw-bold mb-1">{{ t('edit_profile') }}</h5>
          <p class="text-muted small">{{ t('update_your_info') }}</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="submitForm" v-if="formData">
          <!-- Full Name -->
          <div class="mb-3">
            <label for="fullName" class="form-label fw-medium">{{ t('fullname') }}</label>
            <input
              v-model="formData.fullName"
              type="text"
              id="fullName"
              class="form-control form-control-lg"
              :placeholder="t('fullname')"
              required
            />
          </div>

          <!-- Phone Number (Read-only) -->
          <div class="mb-3">
            <label for="phone" class="form-label fw-medium">{{ t('phone_label_profile') }}</label>
            <input
              v-model="formData.phone"
              type="tel"
              id="phone"
              class="form-control form-control-lg"
              disabled
              :title="t('phone_cannot_change')"
            />
            <small class="text-muted d-block mt-1">{{ t('phone_cannot_change') }}</small>
          </div>

          <!-- Birthdate -->
          <div class="mb-4">
            <label class="form-label fw-medium">{{ t('birthdate_label') }}</label>
            <div class="row g-2">
              <!-- Day -->
              <div class="col-4">
                <input
                  v-model.number="formData.birthDay"
                  type="number"
                  min="1"
                  max="31"
                  class="form-control form-control-lg"
                  placeholder="DD"
                  required
                />
                <small class="text-muted d-block mt-1 text-center">{{ t('day') }}</small>
              </div>
              <!-- Month -->
              <div class="col-4">
                <input
                  v-model.number="formData.birthMonth"
                  type="number"
                  min="1"
                  max="12"
                  class="form-control form-control-lg"
                  placeholder="MM"
                  required
                />
                <small class="text-muted d-block mt-1 text-center">{{ t('month') }}</small>
              </div>
              <!-- Year -->
              <div class="col-4">
                <input
                  v-model.number="formData.birthYear"
                  type="number"
                  min="1900"
                  :max="new Date().getFullYear()"
                  class="form-control form-control-lg"
                  placeholder="YYYY"
                  required
                />
                <small class="text-muted d-block mt-1 text-center">{{ t('year') }}</small>
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="btn btn-primary btn-lg w-100 fw-bold"
            :disabled="isLoading"
          >
            <span v-if="!isLoading">{{ t('save_changes') }}</span>
            <span v-else>
              <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              {{ t('saving') }}
            </span>
          </button>

          <!-- Cancel Button -->
          <button
            type="button"
            @click="goBack"
            class="btn btn-outline-secondary btn-lg w-100 fw-bold mt-2"
          >
            {{ t('cancel') }}
          </button>
        </form>

        <!-- Loading State -->
        <div v-else class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { API } from '../variable/link.js'
import { getChatID } from '../variable/chat.js'
import axios from 'axios'

const router = useRouter()
const { t } = useI18n()

const formData = ref(null)
const isLoading = ref(false)

// API instance
const api = axios.create({
  baseURL: API.link,
  headers: {
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': '1',
    'Authorization': 'Basic ' + btoa(`${API.username}:${API.password}`)
  }
})

// Fetch user data on mount
const loadUserData = async () => {
  try {
    const chatID = getChatID()
    if (!chatID) {
      console.warn('profileEditView: chatID not found')
      return
    }

    const response = await api.get('/user', {
      params: { chatID }
    })

    const userData = response.data?.data
    if (userData) {
      // Parse birthdate (format: YYYY-MM-DD or similar)
      let birthDay = 1
      let birthMonth = 1
      let birthYear = 2000

      if (userData.birthdate) {
        const date = new Date(userData.birthdate)
        birthDay = date.getDate()
        birthMonth = date.getMonth() + 1
        birthYear = date.getFullYear()
      }

      formData.value = {
        fullName: userData.fullName || '',
        phone: userData.phone || '',
        birthDay,
        birthMonth,
        birthYear
      }
    }
  } catch (error) {
    console.error('Error loading user data:', error)
    alert(t('error_loading_data') || 'Failed to load profile data')
  }
}

// Submit form
const submitForm = async () => {
  try {
    isLoading.value = true

    if (!formData.value.fullName.trim()) {
      alert(t('fullname_required') || 'Full name is required')
      return
    }

    // Validate birthdate (ensure month <= 12 and day fits month, handle Feb leap years)
    const day = Number(formData.value.birthDay)
    const month = Number(formData.value.birthMonth)
    const year = Number(formData.value.birthYear)

    function daysInMonth(m, y) {
      if (!m || !y) return 31
      // JS months are 0-based for Date: pass (m, y) as 1-based month
      return new Date(y, m, 0).getDate()
    }

    if (!day || !month || !year || year < 1900 || month < 1 || month > 12) {
      alert(t('invalid_birthdate') || 'Please enter a valid birthdate')
      return
    }

    const maxDay = daysInMonth(month, year)
    if (day < 1 || day > maxDay) {
      alert(t('invalid_birthdate') || 'Please enter a valid birthdate')
      return
    }

    const chatID = getChatID()
    const birthDateStr = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`

    const updateData = {
      chatID,
      fullName: formData.value.fullName.trim(),
      birthDate: birthDateStr
    }

    const response = await api.put('/user', updateData)

    if (response.status === 200) {
      alert(t('profile_updated') || 'Profile updated successfully')
      router.push('/profile')
    } else {
      alert(response.data?.message || (t('update_failed') || 'Failed to update profile'))
    }
  } catch (error) {
    console.error('Error updating profile:', error)
    alert(error.response?.data?.message || (t('update_error') || 'Error updating profile'))
  } finally {
    isLoading.value = false
  }
}

// Go back to profile
const goBack = () => {
  router.push('/profile')
}

onMounted(() => {
  loadUserData()
})
</script>

<style scoped>
.form-control, .form-control-lg {
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  font-size: 1rem;
  padding: 0.75rem 1rem;
}

.form-control:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

.form-control:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.form-label {
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.btn {
  border-radius: 12px;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: #0d6efd;
  border-color: #0d6efd;
}

.btn-primary:hover {
  background-color: #0b5ed7;
  border-color: #0a58ca;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-outline-secondary {
  color: #6c757d;
  border-color: #dee2e6;
}

.btn-outline-secondary:hover {
  background-color: #e2e3e5;
  border-color: #adb5bd;
}

.spinner-border {
  width: 1.25rem;
  height: 1.25rem;
}

.card {
  border: none;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(255,255,255,0.95) 60%, rgba(227,233,247,1) 100%);
}

.text-muted {
  color: #6c757d !important;
  font-size: 0.875rem;
}
</style>
