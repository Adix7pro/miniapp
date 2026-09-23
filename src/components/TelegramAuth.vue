<script setup>
import { onMounted, ref } from 'vue'
import { getInitData, isInTelegram, initTelegram } from '../lib/telegram'

const initData = ref(null)

onMounted(() => {
  initTelegram()
  initData.value = getInitData()
})
</script>

<template>
  <div class="container py-4">
    <div class="card">
      <div class="card-body">
        <h2 class="h5">Telegram Auth / Info</h2>
        <p v-if="!isInTelegram()" class="text-muted">Not inside Telegram Web App.</p>
        <div v-else>
          <p class="mb-1"><strong>initData:</strong></p>
          <pre class="bg-light p-3 rounded">{{ initData || 'No init data available' }}</pre>
        </div>
      </div>
    </div>
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
pre { background:#f6f8fa;padding:1rem;border-radius:6px;overflow:auto }
</style>
