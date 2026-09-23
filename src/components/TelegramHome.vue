<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { initTelegram, isInTelegram } from '../lib/telegram'

const router = useRouter()

onMounted(() => {
  const tg = initTelegram()
  if (tg) {
    // Example: when main button clicked, navigate to auth
    try {
      tg.onEvent('mainButtonClicked', () => {
        router.push({ name: 'auth' })
      })
    } catch (e) {
      // ignore
    }
  }
})
</script>

<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-start mb-3">
      <div>
        <h2 class="h4 mb-1">Uyda Loyalty — Telegram Mini App</h2>
        <p class="mb-0 text-muted">This is the Telegram mini app home view.</p>
      </div>
      <div>
        <button class="btn btn-outline-primary" @click="$router.push({ name: 'auth' })">Go to Auth</button>
      </div>
    </div>

    <div v-if="!isInTelegram()" class="alert alert-warning">Notice: you're not inside Telegram Web App — behavior may differ.</div>
  </div>
</template>

<script>
export default {
  computed: {
    isInTelegram() {
      return isInTelegram()
    },
  },
}
</script>

<style scoped>
/* Using Bootstrap buttons and spacing — no custom styles required */
</style>
