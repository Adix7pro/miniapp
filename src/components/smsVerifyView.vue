<template>
  <div class="verify-container d-flex justify-content-center align-items-center min-vh-100">
    <div class="card shadow-lg p-4 mx-3" style="width: 100%; max-width: 400px;">
        <div v-if="error" class="alert alert-danger" role="alert">
          {{ error }}
        </div>
      <h2 class="text-center mb-2 fw-bold">{{ tr('sms_title') }}</h2>
      <p class="text-center text-muted mb-4">
        {{ tr('sms_description', { phone: phoneNumber }) }}
      </p>

      <form @submit.prevent="verifyCode" class="needs-validation">
        <div class="sms-inputs d-flex justify-content-center gap-2 mb-4">
          <input
            v-for="(digit, index) in 4"
            :key="index"
            type="text"
            maxlength="1"
            v-model="code[index]"
            @input="handleInput($event, index)"
            @keydown="handleKeydown($event, index)"
            @paste="handlePaste"
            class="form-control form-control-lg text-center"
            :id="'digit-' + index"
            required
          />
        </div>

        <button 
          type="submit" 
          class="btn btn-primary w-100 py-3 fw-semibold mb-3"
          :disabled="!isValidCode"
        >
          {{ tr('sms_submit') }}
        </button>

        <div class="text-center" v-if="countdown > 0">
          <small class="text-muted">
            {{ tr('resend_in', { count: countdown }) }}
          </small>
        </div>
        <div class="text-center" v-else>
          <button 
            type="button" 
            class="btn btn-link p-0" 
            @click="resendCode"
          >
            {{ tr('resend') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { API } from '../variable/link.js'
import { getChatID } from '../variable/chat.js'
import { t, getStoredLang } from '../variable/i18n.js'

export default {
  name: "SmsVerifyView",
  data() {
    const urlParams = new URLSearchParams(window.location.search)
    const phoneFromUrl = urlParams.get('phone') || ''
    return {
      phoneNumber: phoneFromUrl, // Read from URL query param (phone page passes it)
      code: ['', '', '', ''],
      countdown: 60,
      timer: null,
      language: urlParams.get('lang') || getStoredLang(),
      loading: false,
      error: null,
      api: axios.create({
        baseURL: API.link,
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': '1',
          'Authorization': 'Basic ' + btoa(`${API.username}:${API.password}`)
        }
      })
    };
  },
  computed: {
    isValidCode() {
      return this.code.every(digit => digit.length === 1);
    }
  },
  mounted() {
    // Focus first input on mount
    document.getElementById('digit-0')?.focus();
    this.startCountdown();
  },
  beforeUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  },
  methods: {
    tr(key, params = {}) {
      return t(key, this.language, params)
    },
    handleInput(event, index) {
      const input = event.target;
      const value = input.value;

      // Ensure only numbers
      if (!/^\d*$/.test(value)) {
        this.code[index] = '';
        return;
      }

      // Auto advance to next input
      if (value && index < 4) {
        document.getElementById(`digit-${index + 1}`)?.focus();
      }
    },
    handleKeydown(event, index) {
      // Handle backspace
      if (event.key === 'Backspace' && !this.code[index] && index > 0) {
        document.getElementById(`digit-${index - 1}`)?.focus();
      }
    },
    handlePaste(event) {
      event.preventDefault();
      const pastedText = (event.clipboardData || window.clipboardData)
        .getData('text')
        .replace(/\D/g, '') // Remove non-digits
        .slice(0, 5); // Take only first 5 digits

      if (pastedText.length === 5) {
        this.code = pastedText.split('');
        document.getElementById('digit-4')?.focus();
      }
    },
    startCountdown() {
      this.countdown = 60;
      this.timer = setInterval(() => {
        if (this.countdown > 0) {
          this.countdown--;
        } else {
          clearInterval(this.timer);
        }
      }, 1000);
    },
    async resendCode() {
      try {
        this.error = null
        const chatID = getChatID().toString()
        if (!chatID) throw new Error('ChatID not found')

        const resp = await this.api.post('/sms/resend', { chatID })
        console.log('Code resent successfully:', resp.data)
        this.startCountdown()
      } catch (err) {
        console.error('Error resending code:', err)
        if (err.response && err.response.data) {
          this.error = err.response.data.message || 'Kod qayta yuborishda xatolik yuz berdi.'
        } else {
          this.error = err.message || 'Tarmoq xatosi yuz berdi.'
        }
      }
    },
    async verifyCode() {
      if (!this.isValidCode) return

      const code = this.code.join('').slice(0, 5)
      const chatIDString = getChatID().toString()
      console.log('Verifying code:', code)

      try {
        this.loading = true
        this.error = null

        const chatID = getChatID()
        if (!chatID) throw new Error('ChatID not found')

        const payload = {
          "chatID": chatIDString,
          code
        }

        const resp = await this.api.post('/sms/code', payload)

        // Some backends return 200 on success
        if (resp.status === 200) {
          // Check if recipientCode is in URL params - if yes, redirect to feedback
          const urlParams = new URLSearchParams(window.location.search)
          const recipientCode = urlParams.get('recipientCode')
          
          if (recipientCode) {
            this.$router.push(`/feedback/${recipientCode}`)
          } else {
            this.$router.push('/home')
          }
          return
        }

        // Non-200 but successful request - show returned message
        this.error = resp.data?.message || 'Unexpected response from server.'

      } catch (err) {
        console.error('Error verifying code:', err)
        if (err.response && err.response.data) {
          // API responded with an error status and message
          this.error = err.response.data.message || 'Kod tekshirishda xatolik yuz berdi.'
        } else {
          // Network or other error
          this.error = err.message || 'Tarmoq yoki tizim xatosi yuz berdi.'
        }
      } finally {
        this.loading = false
      }
    }
  }
};
</script>

<style scoped>
.verify-container {
  background-color: #f8f9fa;
  min-height: 100vh;
}

.card {
  border-radius: 16px;
  border: none;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.sms-inputs input {
  width: 52px;
  height: 64px;
  font-size: 24px;
  border-radius: 12px;
  border: 1px solid #dee2e6;
  background: #fff;
}

.sms-inputs input:focus {
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

.btn-link {
  color: var(--bs-primary);
  text-decoration: none;
}

.btn-link:hover {
  text-decoration: underline;
}
</style>
