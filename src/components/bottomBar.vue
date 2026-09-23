<template>
  <!-- Suzib turuvchi pastki menyu -->
  <nav class="uy-nav" aria-label="Asosiy menyu">
    <router-link to="/home" class="uy-tab" active-class="active">
      <span class="uy-tab-icon" v-html="icons.home"></span>
      <span class="uy-tab-label">{{ t('home') }}</span>
    </router-link>
    <router-link to="/categories" class="uy-tab" active-class="active">
      <span class="uy-tab-icon" v-html="icons.grid"></span>
      <span class="uy-tab-label">{{ t('categories') }}</span>
    </router-link>
    <router-link to="/barcode" class="uy-qr" active-class="active" aria-label="QR · Sodiqlik kartasi">
      <span v-html="icons.qr"></span>
    </router-link>
    <router-link to="/cart" class="uy-tab" active-class="active" :aria-label="t('nav_cart')">
      <span class="uy-tab-icon">
        <span v-html="icons.cart"></span>
        <span v-if="cartCount > 0" class="uy-badge">{{ cartCount > 99 ? '99+' : cartCount }}</span>
      </span>
      <span class="uy-tab-label">{{ t('nav_cart') }}</span>
    </router-link>
    <router-link to="/profile" class="uy-tab" active-class="active">
      <span class="uy-tab-icon" v-html="icons.user"></span>
      <span class="uy-tab-label">{{ t('nav_profile') }}</span>
    </router-link>
  </nav>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import Cart from '../lib/cart.js'
import { icons } from '../lib/uiIcons.js'

export default {
  name: "BottomNavbar",
  setup() {
    const { t, locale } = useI18n()
    const cartCount = ref(0)

    const parseCartItems = (resp) => {
      let items = []
      if (Array.isArray(resp)) items = resp
      else if (resp && Array.isArray(resp.data)) items = resp.data
      else if (resp && Array.isArray(resp.items)) items = resp.items
      else if (resp && Array.isArray(resp.products)) items = resp.products.map(p => ({ id: p.ID || p.id, quantity: p.quantity || p.qty || 1 }))
      return items
    }

    const updateCartCount = async () => {
      try {
        const resp = await Cart.get()
        const items = parseCartItems(resp)
        const total = items.reduce((s, it) => s + (Number(it.quantity || it.qty || it.count || 1) || 0), 0)
        cartCount.value = total
      } catch (e) {
        console.warn('Failed to load cart count', e)
      }
    }

    onMounted(() => {
      updateCartCount()
      window.addEventListener('cart-updated', updateCartCount)
    })

    onBeforeUnmount(() => {
      window.removeEventListener('cart-updated', updateCartCount)
    })

    return { locale, t, cartCount, icons }
  }
};
</script>

<style scoped>
.uy-nav {
  position: fixed;
  left: 10px;
  right: 10px;
  bottom: calc(10px + env(safe-area-inset-bottom, 0px));
  height: 84px;
  max-width: 520px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  border-radius: 40px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 8px 28px rgba(17, 24, 39, 0.12);
  z-index: 1000;
  font-family: var(--uy-font);
}

.uy-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: var(--uy-muted);
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
}
.uy-tab.active { color: var(--uy-orange); }

.uy-tab-icon {
  position: relative;
  display: inline-flex;
}

.uy-tab-label {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  white-space: nowrap;
}

.uy-badge {
  position: absolute;
  top: -7px;
  right: -9px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 9px;
  background: #E53935;
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  line-height: 18px;
  text-align: center;
  box-shadow: 0 0 0 2px #fff;
}

.uy-qr {
  flex-shrink: 0;
  width: 76px;
  height: 76px;
  margin: 0 4px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--uy-orange);
  color: #fff;
  border: 5px solid #fff;
  box-shadow: 0 6px 18px rgba(239, 78, 36, 0.35);
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.15s ease;
}
.uy-qr:active { transform: scale(0.95); }
.uy-qr span { display: inline-flex; }

@media (max-width: 360px) {
  .uy-tab-label { font-size: 9.5px; letter-spacing: 0.2px; }
  .uy-qr { width: 66px; height: 66px; }
}
</style>
