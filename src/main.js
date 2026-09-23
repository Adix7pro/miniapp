import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import "bootstrap-icons/font/bootstrap-icons.css"
import '@fortawesome/fontawesome-free/css/all.min.css'
import './style.css'
import './custom.scss'
import App from './App.vue'
import router from './router'
import { translations } from './variable/i18n.js'
import { init } from '@tma.js/sdk-vue'


// Determine initial locale safely (no setup context needed)
let initialLocale = 'uz'
try {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('uyda_lang') : null
  if (stored && (stored === 'uz' || stored === 'ru' || stored === 'en')) {
    initialLocale = stored
  }
} catch (e) {}

const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: 'uz',
  messages: translations
})


const app = createApp(App)

app.use(router)
app.use(i18n)
app.mount('#app')
