<template>
  <transition name="slide-up">
    <div v-if="modelValue" class="overlay" @click.self="close">
      <div class="sheet">
        <div class="sheet-inner p-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h4 class="mb-0 text-center w-100">{{ t('give_feedback') }}</h4>
            <button class="btn-close ms-2" @click="close" aria-label="close"></button>
          </div>

          <div class="rating d-flex gap-3 align-items-center justify-content-center mb-4">
            <template v-for="i in 5" :key="i">
              <button
                type="button"
                class="star-btn"
                :class="{ active: i <= rating }"
                @click="setRating(i)"
                :aria-pressed="i <= rating"
                :aria-label="'Rate ' + i + ' stars'"
              >
                <svg width="44" height="44" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 .587l3.668 7.431L23.4 9.75l-5.6 5.456L19.335 24 12 19.897 4.665 24l1.535-8.794L.6 9.75l7.732-1.732L12 .587z"/>
                </svg>
              </button>
            </template>
          </div>

          <div class="mb-3">
            <label for="comment" class="form-label small text-muted">{{ t('comment_optional') }}</label>
            <textarea id="comment" v-model="comment" rows="5" maxlength="500" class="form-control comment-box" :placeholder="t('feedback_placeholder')"></textarea>
            <div class="text-end small text-muted mt-1">{{ comment.length }} / 500</div>
          </div>

          <div class="d-flex gap-2">
            <button class="btn btn-secondary w-50" @click="close">{{ t('cancel') }}</button>
            <button class="btn btn-primary w-50" :disabled="submitting || rating === 0" @click="onSubmit">
              {{ submitting ? t('submitting') : t('submit') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { API } from '../variable/link.js'
import axios from 'axios'
import { getChatID } from '../variable/chat.js'

const { t } = useI18n()

const props = defineProps({
  modelValue: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue', 'submit'])

const rating = ref(0)
const comment = ref('')
const submitting = ref(false)

const api = axios.create({
  baseURL: API.link,
  headers: {
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': '1',
    'Authorization': 'Basic ' + btoa(`${API.username}:${API.password}`)
  }
})

watch(() => props.modelValue, (val) => {
  if (!val) {
    rating.value = 0
    comment.value = ''
    submitting.value = false
  }
})

function setRating(i) {
  rating.value = i
}

function close() {
  emit('update:modelValue', false)
}

async function onSubmit() {
  if (rating.value === 0) return
  submitting.value = true
  try {
    const chatID = typeof getChatID === 'function' ? getChatID() : null
    const body = { chatID, rating: rating.value, comment: comment.value }
    const resp = await api.post('/feedback', body)
    if (resp?.status === 200) {
      alert('Rahmat! Fikringiz qabul qilindi.')
      // Prevent duplicate POST: parent may also listen to `submit` and post.
      // We only close the modal here; parent can listen to `update:modelValue` if needed.
      emit('update:modelValue', false)
    } else {
      alert(resp?.data?.message || 'Server javobi kutilmagan.')
    }
  } catch (err) {
    console.error('Feedback submit error', err)
    alert(err?.response?.data?.message || 'Tarmoq xatosi yuz berdi.')
  } finally {
    submitting.value = false
  }
}

</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 3000;
}
.sheet {
  width: 100%;
  max-width: 920px;
  border-top-left-radius: 14px;
  border-top-right-radius: 14px;
  background: transparent;
  padding: 0 12px 18px;
}
.sheet-inner {
  background: #fff;
  border-radius: 12px 12px 0 0;
  box-shadow: 0 -12px 36px rgba(0,0,0,0.16);
}
.rating { gap: 12px; }
.rating .star-btn {
  background: transparent;
  border: none;
  padding: 6px;
  color: #d1d5db;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.rating .star-btn svg { transform: translateY(2px); }
.rating .star-btn.active { color: #ffc107; filter: drop-shadow(0 4px 8px rgba(255,160,0,0.18)); }
.star-btn:focus { outline: none; box-shadow: 0 0 0 4px rgba(255,193,7,0.12); }
.comment-box { min-height: 120px; }
.slide-up-enter-active, .slide-up-leave-active { transition: all 240ms ease; }
.slide-up-enter-from { transform: translateY(100%); opacity: 0 }
.slide-up-enter-to { transform: translateY(0); opacity: 1 }
.slide-up-leave-from { transform: translateY(0); opacity: 1 }
.slide-up-leave-to { transform: translateY(100%); opacity: 0 }
</style>
