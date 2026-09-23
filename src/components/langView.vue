<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { t } from '../variable/i18n.js'
import axios from 'axios'
import { API } from '../variable/link.js'
import { getChatID } from '../variable/chat.js'

const { locale } = useI18n()
const lang = ref(locale.value)

async function setLang(l) {
  lang.value = l
  locale.value = l

  // update document lang attribute for accessibility
  try { 
    const langCode = l === 'en' ? 'en' : (l === 'ru' ? 'ru' : 'uz')
    document.documentElement.lang = langCode 
  } catch (e) {}

  // persist locally
  try { localStorage.setItem('uyda_lang', l) } catch (e) {}

  // POST language + chatID to server so user preference is stored
  try {
    const chatID = getChatID()
    if (chatID) {
      await axios.put(`${API.link}/user`, { chatID, language: l })
    }
  } catch (err) {
    console.warn('langView: failed to persist language to server', err)
  }
}
</script>

<template>
  <div class="container py-4">
    <div class="card p-4 text-center" style="max-width:480px;margin:0 auto;">
      <h5 class="mb-3">{{ t('choose_lang', lang) }}</h5>
      <div class="d-flex justify-content-center gap-2 flex-wrap">
        <button :class="['btn', lang==='uz' ? 'btn-primary' : 'btn-outline-secondary']" @click="setLang('uz')">{{ t('lang_uz', lang) }}</button>
        <button :class="['btn', lang==='ru' ? 'btn-primary' : 'btn-outline-secondary']" @click="setLang('ru')">{{ t('lang_ru', lang) }}</button>
      </div>
      <p class="mt-3 text-muted">{{ t('selected_lang', lang) }} <strong>{{ t(`lang_${lang}`, lang) }}</strong></p>
    </div>
  </div>
</template>

<style scoped>
.card { border-radius:12px }
.btn { min-width:140px }
</style>
