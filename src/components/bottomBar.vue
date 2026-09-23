<template>
  <!-- Floating QR code button at top-center -->
  <router-link to="/barcode" class="qr-button" active-class="qr-button-active" title="QR Code">
    <i class="bi bi-qr-code"></i>
  </router-link>

  <!-- Compact bottom navigation bar -->
  <nav class="navbar fixed-bottom navbar-light bg-light shadow-sm">
    <div class="container-fluid d-flex justify-content-around align-items-center">
      <router-link to="/home" class="nav-link" active-class="active">
        <i class="bi bi-house-door"></i>
        <div class="nav-label">{{ t('home') }}</div>
      </router-link>
      <router-link to="/categories" class="nav-link text-center" active-class="active">
        <i class="bi bi-list-ul"></i>
        <div class="nav-label">{{ t('categories') }}</div>
      </router-link>
      <div style="flex: 0.5"></div> <!-- Spacer for QR button -->
      <router-link to="/cart" class="nav-link text-center" active-class="active" aria-label="Cart">
        <i class="bi bi-cart"></i>
        <span v-if="cartCount > 0" class="cart-badge">{{ cartCount }}</span>
        <div class="nav-label">{{ t('cart') }}</div>
      </router-link>
      <router-link to="/profile" class="nav-link text-center" active-class="active">
        <i class="bi bi-person-circle"></i>
        <div class="nav-label">{{ t('map_nav') }}</div>
      </router-link>
    </div>
  </nav>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import Cart from '../lib/cart.js'

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

    return { locale, t, cartCount }
  }
};
</script>

<style scoped>
/* Compact bottom navigation bar */
.navbar {
  height: 60px;
  border-radius: 20px 20px 0 0;
  margin: 0 auto;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.98) !important;
  border-top: 1px solid #e9ecef;
}

.navbar .container-fluid {
  padding: 0.5rem 1rem;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.nav-link {
  position: relative;
  color: #6c757d;
  padding: 0.25rem 0.75rem;
  font-size: 0.9rem;
  transition: color 200ms ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.nav-link.active, .nav-link.router-link-exact-active {
  color: #0d6efd;
}

.nav-link i {
  font-size: 1.3rem;
  display: block;
}

.nav-label {
  font-size: 11px;
  font-weight: 500;
  flex: 1;
}

.cart-badge {
  position: absolute;
  top: 4px;
  right: 12px;
  background: #ff3b30;
  color: #fff;
  border-radius: 999px;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 700;
  min-width: 18px;
  text-align: center;
  box-shadow: 0 1px 2px rgba(0,0,0,0.12);
}

/* Floating QR code button at top-center */
.qr-button {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #ff5722;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(255, 87, 34, 0.3);
  text-decoration: none;
  transition: all 200ms ease;
  z-index: 1050;
}

.qr-button:hover {
  transform: translateX(-50%) scale(1.1);
  box-shadow: 0 6px 16px rgba(255, 87, 34, 0.4);
  color: white;
  background: #e64a19;
}

.qr-button:active {
  transform: translateX(-50%) scale(0.95);
}

.qr-button.qr-button-active {
  background: #e64a19;
}

.qr-button i {
  font-size: 1.8rem;
  display: block;
}
</style>