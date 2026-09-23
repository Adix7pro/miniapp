<template>
  <div class="registration-container d-flex justify-content-center align-items-center min-vh-100">
    <!-- Loading Spinner -->
    <div v-if="loading" class="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-white bg-opacity-75">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Registration Form -->
    <div class="card shadow-lg p-4 mx-3" style="width: 100%; max-width: 400px;">
  <h2 class="text-center mb-4 fw-bold">{{ tr('register_title') }}</h2>

      <form @submit.prevent="register" class="needs-validation">
        <!-- Full Name -->
        <div class="mb-4">
          <label for="fullname" class="form-label fw-semibold">{{ tr('fullname') }}</label>
          <input
            type="text"
            id="fullname"
            v-model="form.fullname"
            class="form-control form-control-lg"
            :placeholder="tr('fullname_placeholder')"
            required
          />
        </div>

        <!-- Birth Date: day / month / year -->
        <div class="mb-4">
          <label class="form-label fw-semibold">{{ tr('birthdate') }}</label>
          <div class="d-flex gap-2">
            <input
              type="number"
              min="1"
              max="31"
              v-model.number="form.birthDay"
              class="form-control form-control-lg"
              :placeholder="tr('day')"
              required
            />
            <select v-model.number="form.birthMonth" class="form-select form-select-lg" required>
              <option disabled value="">{{ tr('month')  }}</option>
              <option v-for="(m, idx) in months" :key="idx" :value="idx+1">{{ m }}</option>
            </select>
            <input
              type="number"
              v-model.number="form.birthYear"
              class="form-control form-control-lg"
              :placeholder="tr('year')"
              min="1900"
              :max="new Date().getFullYear()"
              required
            />
          </div>
        </div>

        <!-- Gender -->
        <div class="mb-4">
          <label class="form-label fw-semibold">{{ tr('gender') }}</label>
          <select v-model="form.gender" class="form-select form-select-lg" required>
            <option disabled value="">{{ tr('gender') }}</option>
            <option value="male">{{ tr('gender_male') }}</option>
            <option value="female">{{ tr('gender_female') }}</option>
          </select>
        </div>

        <button type="submit" class="btn btn-primary w-100 py-3 fw-semibold" :disabled="loading">
          {{ tr('register_submit') }}
        </button>
      </form>
    </div>

    <!-- User Confirmation Modal -->
    <div v-if="showConfirmModal || loading" class="modal-overlay">
      <div class="modal fade show d-block position-relative">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow-lg">
            <!-- Loading State -->
            <div v-if="loading" class="modal-body py-5">
              <div class="text-center">
                <div class="spinner-border text-primary mb-3" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                  <p class="mb-0 text-muted">{{ tr('please_wait') }}</p>
              </div>
            </div>
            
            <!-- Content State -->
            <template v-else>
              <div class="modal-header border-bottom-0 pb-0">
                <h5 class="modal-title fw-bold">{{ tr('confirm') }}</h5>
                <button type="button" class="btn-close" @click="closeConfirmModal"></button>
              </div>
              <div class="modal-body py-4">
                <p v-if="existingUser" class="text-center mb-0 fs-5">
                  {{ tr('confirm') }}: <span class="fw-bold">{{ existingUser.fullName }}</span>
                </p>
              </div>
              <div class="modal-footer border-top-0 pt-0">
                <button 
                  type="button" 
                  class="btn btn-outline-secondary px-4 py-2" 
                  @click="handleConfirmNo"
                  :disabled="loading"
                >
                  {{ tr('no') }}
                </button>
                <button 
                  type="button" 
                  class="btn btn-primary px-4 py-2" 
                  @click="handleConfirmYes"
                  :disabled="loading"
                >
                  {{ tr('yes') }}
                </button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { API } from '../variable/link.js'
import { getChatID } from '../variable/chat.js'
import axios from 'axios'
import { t, getStoredLang } from '../variable/i18n.js'

export default {
  name: "RegisterPage",
  setup() {
    const router = useRouter()
    return { router }
  },
  data() {
    return {
      form: {
        fullname: "",
        birthdate: "",
        birthDay: null,
        birthMonth: null,
        birthYear: null,
        gender: "",
        chatID: getChatID(), // getChatID null bo'lsa default qiymat
        language: this.$route.query.lang?.replace(/['"]/g, '') || getStoredLang(),
        recipientCode: this.$route.query.recipientCode || null // recipientCode parametrini saqlaymiz
      },
      loading: false,
      showConfirmModal: false,
      existingUser: null,
      api: axios.create({
        baseURL: API.link,
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': '1',
          'Authorization': 'Basic ' + btoa(`${API.username}:${API.password}`)
        }
      })
      ,
      months: ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"],
    };
  },
  async created() {
    await this.checkExistingUser()
  },
  methods: {
    parseBirthDate(dateStr) {
      if (!dateStr) return { d: null, m: null, y: null }
      // Accept dd/mm/yyyy, yyyy-mm-dd, or ISO-like formats
      try {
        if (dateStr.includes('/')) {
          const parts = dateStr.split('/')
          if (parts.length >= 3) return { d: Number(parts[0]), m: Number(parts[1]), y: Number(parts[2]) }
        }
        if (dateStr.includes('-')) {
          const parts = dateStr.split('-')
          if (parts.length >= 3) return { d: Number(parts[2]), m: Number(parts[1]), y: Number(parts[0]) }
        }
        // fallback: try Date parsing
        const dt = new Date(dateStr)
        if (!isNaN(dt)) return { d: dt.getDate(), m: dt.getMonth() + 1, y: dt.getFullYear() }
      } catch (e) { /* ignore */ }
      return { d: null, m: null, y: null }
    },
    tr(key, params = {}) {
      return t(key, this.form.language, params)
    },
    getLast9(phone) {
      // Return only digits and take the last 9 characters (or fewer if shorter)
      if (phone === null || phone === undefined) return ''
      const digits = String(phone).replace(/\D/g, '')
      return digits.length <= 9 ? digits : digits.slice(-9)
    },

    async checkExistingUser() {
      try {
        this.loading = true
        const chatID = getChatID() 

        const response = await this.api.get('/user', {
          params: { chatID }
        })

        // Response strukturasini to'liq ko'rish
        console.log('Full API Response:', JSON.stringify(response, null, 2))
        
        // HTTP status
        console.log('HTTP Status:', response.status)
        
        // Response data strukturasi
        if (response.data) {
          console.log('Response Data Structure:', {
            keys: Object.keys(response.data),
            fullData: response.data
          })
        }

        // Status tekshirish
        if (response.status === 201) {
          console.log('201 HTTP status detected, showing modal')
          this.existingUser = response.data.data
          // ChatID ni formaga saqlaymiz
          this.form.chatID = chatID
          this.showConfirmModal = true
          console.log('Modal state:', {
            showConfirmModal: this.showConfirmModal,
            existingUser: this.existingUser
          })
        } else {
          console.log('HTTP Status is not 201:', response.status)
        }
        
      } catch (error) {
        if (error.response?.status === 404) {
          console.log('404: New user detected')
        } else {
          console.error('Error checking user:', error)
        }
      } finally {
        this.loading = false
      }
    },

    async handleConfirmYes() {
      if (!this.existingUser) {
        console.error('No existing user data found')
        return
      }

      // Mavjud foydalanuvchi ma'lumotlarini formga ko'chirish
      const parsed = this.parseBirthDate(this.existingUser.birthDate)
      this.form = {
        ...this.form,
        chatID: this.existingUser.chatID,
        fullname: this.existingUser.fullName,
        birthdate: this.existingUser.birthDate,
        birthDay: parsed.d,
        birthMonth: parsed.m,
        birthYear: parsed.y,
        gender: this.existingUser.gender,
        phone: this.getLast9(this.existingUser.phone),
        isOld: true // Mavjud foydalanuvchi ekanligini belgilaymiz
      }
      
      console.log("Form data updated:", this.form)
      this.closeConfirmModal()
    },

    async handleConfirmNo() {
      try {
        this.loading = true
        const chatID = getChatID() || 1476135311

        // Eski foydalanuvchini o'chirish
        await this.api.delete('/user', {
          params: { chatID }
        })

        // isOld = false bilan yangi forma yaratish
        this.form = {
          ...this.form,
          fullname: "",
          birthdate: "",
          birthDay: null,
          birthMonth: null,
          birthYear: null,
          gender: "",
          isOld: false // Yangi foydalanuvchi ekanligini belgilaymiz
        }
        
      } catch (error) {
        console.error('Error deleting user:', error)
      } finally {
        this.loading = false
        this.closeConfirmModal()
      }
    },

    closeConfirmModal() {
      this.showConfirmModal = false
      this.existingUser = null
    },

    async register() {
      try {
        this.loading = true
        console.log("User data:", this.form)
        
        // Validate birthdate fields (month range and day fits month)
        const day = Number(this.form.birthDay)
        const month = Number(this.form.birthMonth)
        const year = Number(this.form.birthYear)

        function daysInMonth(m, y) {
          if (!m || !y) return 31
          return new Date(y, m, 0).getDate()
        }

        if (!day || !month || !year || year < 1900 || month < 1 || month > 12) {
          alert(t('invalid_birthdate', this.form.language) || 'Please enter a valid birthdate')
          this.loading = false
          return
        }

        const maxDay = daysInMonth(month, year)
        if (day < 1 || day > maxDay) {
          alert(t('invalid_birthdate', this.form.language) || 'Please enter a valid birthdate')
          this.loading = false
          return
        }

        // Serverga jo'natiladigan ma'lumotlarni tayyorlash
        // compose birthdate as dd/mm/yyyy
        let birthDateStr = this.form.birthdate
        if (this.form.birthDay && this.form.birthMonth && this.form.birthYear) {
          const dd = String(this.form.birthDay).padStart(2, '0')
          const mm = String(this.form.birthMonth).padStart(2, '0')
          const yyyy = String(this.form.birthYear)
          birthDateStr = `${dd}/${mm}/${yyyy}`
        }

        const userData = {
          chatID: this.form.chatID,
          fullName: this.form.fullname,
          birthDate: birthDateStr,
          gender: this.form.gender,
          language: this.form.language, // Tilni qo'shamiz
          isOld: this.form.isOld || false, // isOld parametrini qo'shamiz, default = false
          phone: ' ' // Bo'sh phone maydoni bilan boshlaymiz
        }

        // Agar mavjud foydalanuvchi bo'lsa, phone ni qo'shamiz (oxirgi 9ta raqam)
        if (this.form.isOld && this.form.phone) {
          userData.phone = this.getLast9(this.form.phone)
        }

  console.log("Sending to server:", userData)
        
        // Serverga ma'lumotlarni yuborish
        const response = await this.api.post('/user', userData)
        
        // Telefon raqam kiritish sahifasiga o'tish
        // Ma'lumotlarni query parameter sifatida uzatish
        const queryParams = new URLSearchParams()
        const phoneFromResponse = response.data?.phone
        const phoneForQuery = phoneFromResponse ? this.getLast9(phoneFromResponse) : (this.form.phone ? this.getLast9(this.form.phone) : null)
        if (phoneForQuery) {
          queryParams.append('phone', phoneForQuery)
        }
        // ChatID va language ni har doim qo'shamiz
        queryParams.append('chatID', this.form.chatID)
        queryParams.append('lang', this.form.language)
        
        // recipientCode ni agar mavjud bo'lsa qo'shamiz
        if (queryParams.has('recipientCode')) {
          queryParams.append('recipientCode', queryParams.get('recipientCode'))
        }
        
  this.router.push(`/phone?${queryParams.toString()}`)
        
      } catch (error) {
        console.error('Error registering:', error)
        alert(t('error_generic', this.form.language))
      } finally {
        this.loading = false
      }
    },
  },
};
</script>

<style scoped>
.registration-container {
  background-color: #f8f9fa;
  min-height: 100vh;
}

.card {
  border-radius: 16px;
  border: none;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.form-control, .form-select {
  border-radius: 10px;
  border: 1px solid #dee2e6;
  padding: 0.75rem 1rem;
}

.form-control:focus, .form-select:focus {
  border-color: var(--bs-primary);
  box-shadow: 0 0 0 0.25rem rgba(37, 150, 190, 0.25);
}

.btn-primary {
  border-radius: 10px;
  font-size: 1.1rem;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 150, 190, 0.35);
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  z-index: 1050;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
  transition: all 0.3s ease;
}

/* Spinner styles */
.spinner-border {
  width: 3rem;
  height: 3rem;
}

.modal-body .spinner-border {
  color: var(--bs-primary);
}

.modal-content {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px !important;
  backdrop-filter: blur(10px);
}

.modal-header .btn-close {
  background-size: 0.8em;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.modal-header .btn-close:hover {
  opacity: 1;
}

.modal-footer .btn {
  border-radius: 8px;
  font-weight: 500;
  min-width: 100px;
}

.modal-footer .btn-primary {
  box-shadow: 0 2px 6px rgba(37, 150, 190, 0.2);
}

.modal-footer .btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 150, 190, 0.3);
}

.modal-footer .btn-outline-secondary:hover {
  transform: translateY(-1px);
  background-color: #f8f9fa;
  border-color: #dee2e6;
}
</style>
