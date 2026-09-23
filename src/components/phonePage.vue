<template>
  <div class="phone-container d-flex justify-content-center align-items-center min-vh-100">
    <!-- Loading Spinner -->
    <div v-if="loading" class="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-white bg-opacity-75">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div class="card shadow-lg p-4 mx-3" style="width: 100%; max-width: 400px;">
      <h2 class="text-center mb-4 fw-bold">{{ tr('phone_title', language) }}</h2>
      
      <form @submit.prevent="submitPhone" class="needs-validation">
        <div class="mb-4">
          <label for="phone" class="form-label fw-semibold">{{ tr('phone_label', language) }}</label>
          <div class="input-group input-group-lg">
            <span class="input-group-text">+998</span>
            <input
              type="tel"
              id="phone"
              v-model="phoneInput"
              @input="formatPhone"
              class="form-control form-control-lg"
              placeholder="XX XXX XX XX"
              maxlength="12"
              required
            />
          </div>
          <div class="form-text text-muted">
            {{ tr('phone_example', language) }}
          </div>
        </div>

        <button 
          type="submit" 
          class="btn btn-primary w-100 py-3 fw-semibold"
          :disabled="!isValidPhone || isSubmitting"
        >
          {{ tr('phone_continue', language) }}
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import { API } from '../variable/link.js'
import axios from 'axios'
import { getChatID } from '../variable/chat.js'
import { t, getStoredLang } from '../variable/i18n.js'

export default {
  name: "PhonePage",
  data() {
    return {
      phoneInput: "",
      loading: false,
      isSubmitting: false,
      // language comes from URL param for phone/verify flows per requirement
      language: (new URLSearchParams(window.location.search)).get('lang') || getStoredLang(),
      api: axios.create({
        baseURL: API.link,
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': '1',
          'Authorization': 'Basic ' + btoa(`${API.username}:${API.password}`)
        }
      })
    }
  },
  async created() {
    await this.checkExistingUser()
  },

  computed: {
    isValidPhone() {
      // Remove spaces and check if we have 9 digits (not counting +998)
      return this.phoneInput.replace(/\s/g, '').length === 9
    },
    formattedPhone() {
      return '+998 ' + this.phoneInput
    }
  },
  methods: {
    async checkExistingUser() {
      try {
        this.loading = true
        
        // URL dan telefon raqamni olish
        const urlParams = new URLSearchParams(window.location.search)
        const phone = urlParams.get('phone')
        
        if (phone) {
          // Telefon raqamning oxirgi 9 raqamini olish
          const lastNineDigits = phone.toString().slice(-9)
          
          // Raqamni formatlab inputga joylashtirish
          let formatted = ''
          for (let i = 0; i < lastNineDigits.length; i++) {
            if (i === 2 || i === 5 || i === 7) {
              formatted += ' '
            }
            formatted += lastNineDigits[i]
          }
          this.phoneInput = formatted
          console.log('Phone number loaded from URL:', formatted)
        } else {
          console.log('No phone number in URL')
        }
        
      } catch (error) {
        console.error('Error loading phone number:', error)
      } finally {
        this.loading = false
      }
    },

    formatPhone(event) {
      // Remove any non-digit characters
      let cleaned = event.target.value.replace(/\D/g, '')
      
      // Apply the mask pattern XX XXX XX XX
      let formatted = ''
      for (let i = 0; i < cleaned.length; i++) {
        if (i === 2 || i === 5 || i === 7) {
          formatted += ' '
        }
        formatted += cleaned[i]
      }
      
      // Update the input value
      this.phoneInput = formatted
    },
    tr(key, params = {}) {
      return t(key, this.language, params)
    },
    
    async submitPhone() {
      try {
        if (!this.isValidPhone || this.isSubmitting) return

        this.isSubmitting = true
        this.loading = true
        
        // chatID ni helper orqali olish (URL yoki Telegram WebApp dan)
        const chatID = getChatID().toString() // Fallback default qiymat

        if (!chatID) {
          throw new Error('ChatID not found (no URL param and no Telegram context)')
        }

        // Telefon raqamni tayyorlash (faqat raqamlar va oxirgi 9 tasi)
        const cleanPhone = this.phoneInput.replace(/\D/g, '')
        const last9Digits = cleanPhone.slice(-9)
        
        // PUT so'rovni yuborish - chatID query param sifatida
        const response = await this.api.post(`/user/phone`, {
          "phone": last9Digits,
          "chatID": chatID
        })

        console.log('Phone updated successfully:', response.data)
        
        const nextPageParams = new URLSearchParams()
        nextPageParams.append('chatID', chatID)
        nextPageParams.append('phone', last9Digits)
        
        // carry through language param if present
        const urlParams = new URLSearchParams(window.location.search)
        const language = urlParams.get('lang')
        if (language) nextPageParams.append('lang', language)
        
        // carry through recipientCode param if present
        const recipientCode = urlParams.get('recipientCode')
        if (recipientCode) nextPageParams.append('recipientCode', recipientCode)

        this.$router.push(`/verify?${nextPageParams.toString()}`)
        
      } catch (error) {
        console.error('Error updating phone:', error)
        console.log(getChatID().toString())
        alert(t('phone_save_error', this.language))
        this.isSubmitting = false
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.phone-container {
  background-color: #f8f9fa;
  min-height: 100vh;
}

.card {
  border-radius: 16px;
  border: none;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.input-group-text {
  background-color: #f8f9fa;
  border-end-start-radius: 10px;
  border-start-start-radius: 10px;
  border: 1px solid #dee2e6;
  border-right: none;
  font-weight: 500;
}

.form-control {
  border-radius: 10px;
  border: 1px solid #dee2e6;
  padding: 0.75rem 1rem;
  letter-spacing: 1px;
}

.form-control:focus {
  border-color: var(--bs-primary);
  box-shadow: 0 0 0 0.25rem rgba(37, 150, 190, 0.25);
}

.btn-primary {
  border-radius: 10px;
  font-size: 1.1rem;
  transition: all 0.3s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 150, 190, 0.35);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
