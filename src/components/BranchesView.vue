<template>
  <div class="branches-page">
    <section class="hero">
      <div class="hero-noise"></div>
      <div class="hero-content">
        <p class="eyebrow">{{ t('our_stores') }}</p>
        <h1>{{ t('branches_title') }}</h1>
        <p class="hero-sub">{{ t('branches_subtitle') }}</p>
        <div class="hero-actions">
          <button class="hero-btn primary" @click="openMapAll">
            <i class="bi bi-map"></i>
            {{ t('view_on_map') }}
          </button>
          <span class="branch-count">{{ stores.length }} ta filial</span>
          <span class="always-open">Dam olishsiz ishlaymiz</span>
        </div>
      </div>
      <div class="hero-orb orb-1"></div>
      <div class="hero-orb orb-2"></div>
    </section>

    <section class="branches-grid">
      <article
        v-for="(store, idx) in stores"
        :key="store.id"
        class="branch-card"
        :style="{ '--accent': accentColors[idx % accentColors.length] }"
      >
        <div class="branch-index">{{ String(idx + 1).padStart(2, '0') }}</div>
        <h3>{{ store.name }}</h3>
        <p class="address">
          <i class="bi bi-geo-alt-fill"></i>
          {{ store.address }}
        </p>
        <p class="hours">
          <i class="bi bi-clock-history"></i>
          {{ t('branches_working_hours') }}: {{ store.hours }}
        </p>
        <div class="card-actions">
          <button class="card-btn" @click="openStoreOnMap(store)">
            <i class="bi bi-compass"></i>
            {{ t('branches_open_on_map') }}
          </button>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { UYDA_STORES } from '../variable/stores.js'

const { t } = useI18n()
const router = useRouter()
const stores = ref(UYDA_STORES)
const accentColors = ['#ff7a18', '#1f7ae0', '#00a878', '#ff4d6d', '#7b61ff']

const openMapAll = () => {
  router.push({ name: 'map' })
}

const openStoreOnMap = (store) => {
  router.push({
    name: 'map',
    query: {
      lat: String(store.lat),
      lon: String(store.lon),
      name: store.name
    }
  })
}
</script>

<style scoped>
.branches-page {
  min-height: 100vh;
  padding: 12px 12px 120px;
  background:
    radial-gradient(circle at 0% 0%, rgba(255, 122, 24, 0.22), transparent 40%),
    radial-gradient(circle at 100% 0%, rgba(31, 122, 224, 0.18), transparent 42%),
    linear-gradient(160deg, #f5f7fb 0%, #f9fbff 45%, #eef4ff 100%);
}

.hero {
  position: relative;
  overflow: hidden;
  border-radius: 22px;
  padding: 20px 18px;
  color: #fff;
  background: linear-gradient(130deg, #10131d, #1a2440 55%, #273465 100%);
  box-shadow: 0 16px 44px rgba(16, 19, 29, 0.35);
}

.hero-noise {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255, 255, 255, 0.14) 0.6px, transparent 0.6px);
  background-size: 6px 6px;
  opacity: 0.35;
  pointer-events: none;
}

.hero-content {
  position: relative;
  z-index: 2;
}

.eyebrow {
  margin: 0 0 8px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 11px;
  opacity: 0.82;
}

h1 {
  margin: 0;
  font-size: 30px;
  line-height: 1.05;
  font-weight: 900;
  font-family: "Trebuchet MS", "Segoe UI", sans-serif;
}

.hero-sub {
  margin: 10px 0 0;
  max-width: 480px;
  opacity: 0.9;
}

.hero-actions {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.hero-btn {
  border: none;
  border-radius: 999px;
  padding: 10px 14px;
  display: inline-flex;
  gap: 8px;
  align-items: center;
  font-weight: 700;
  cursor: pointer;
}

.hero-btn.primary {
  background: linear-gradient(135deg, #ff7a18, #ff4d00);
  color: #fff;
}

.branch-count {
  font-size: 12px;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(4px);
}

.always-open {
  font-size: 12px;
  font-weight: 700;
  padding: 5px 10px;
  border-radius: 999px;
  color: #0d2a1f;
  background: linear-gradient(135deg, #b7ffd8, #8ff0ff);
}

.hero-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(1px);
}

.orb-1 {
  width: 140px;
  height: 140px;
  right: -28px;
  top: -30px;
  background: rgba(255, 122, 24, 0.3);
}

.orb-2 {
  width: 110px;
  height: 110px;
  right: 42px;
  bottom: -44px;
  background: rgba(123, 97, 255, 0.35);
}

.branches-grid {
  margin-top: 14px;
  display: grid;
  gap: 12px;
}

.branch-card {
  position: relative;
  border-radius: 18px;
  background: #fff;
  padding: 16px 14px 14px;
  border: 1px solid #e8edf7;
  box-shadow: 0 10px 24px rgba(18, 36, 89, 0.08);
  overflow: hidden;
}

.branch-card::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 5px;
  background: var(--accent);
}

.branch-index {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 800;
  color: #fff;
  background: var(--accent);
  margin-bottom: 8px;
}

.branch-card h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #15203c;
}

.address,
.hours {
  margin: 10px 0 0;
  display: flex;
  gap: 8px;
  color: #46506a;
  font-size: 14px;
  line-height: 1.35;
}

.address i,
.hours i {
  margin-top: 2px;
  color: var(--accent);
}

.card-actions {
  margin-top: 12px;
}

.card-btn {
  width: 100%;
  border: none;
  border-radius: 12px;
  padding: 10px 12px;
  background: linear-gradient(135deg, #eef4ff, #f8fbff);
  color: #1c2b55;
  font-weight: 700;
  display: inline-flex;
  justify-content: center;
  gap: 8px;
}

@media (min-width: 768px) {
  .branches-page {
    max-width: 980px;
    margin: 0 auto;
    padding: 20px 16px 130px;
  }

  .hero {
    padding: 28px 24px;
  }

  .branches-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
