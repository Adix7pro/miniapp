<template>
  <div class="checkout-page">
    <div class="checkout-layout" style="margin-top: 20px;">
      <aside class="order-summary">
        <div class="summary-header">
          <h2><i class="fas fa-receipt"></i> {{ $t('order_summary') }}</h2>
        </div>

        <div v-if="cartItems.length === 0" class="empty-message">
          <i class="fas fa-shopping-cart"></i>
          <p>{{ $t('cartEmpty') }}</p>
        </div>

        <div v-else class="products-section">
          <ul class="product-list">
            <li class="product-card" v-for="(p, idx) in cartItems" :key="p.id || idx">
              <div class="card-img">
                <img :src="getOrderItemImage(p)" alt="" />
              </div>
              <div class="card-body">
                <div class="product-name">{{ p.name || $t('product') }}</div>
                <div class="product-price">{{ formatPrice(p.price || 0) }}</div>
                <div class="quantity-badge">x {{ p.quantity }}</div>
              </div>
              <div class="card-total">
                <div class="line-total">{{ formatPrice((p.price || 0) * (p.quantity || 1)) }}</div>
              </div>
            </li>
          </ul>

          <div class="summary-divider"></div>
          <div class="totals-section">
            <div class="total-row final">
              <span>{{ $t('total') }}</span>
              <strong>{{ formatPrice(subtotal) }}</strong>
            </div>
            <p v-if="isFreeDeliveryEligible" class="free-delivery-note">
              <i class="fas fa-truck"></i>
              {{ $t('free_delivery_note') }}
            </p>
          </div>
        </div>
      </aside>

      <form @submit.prevent="submitOrder" class="checkout-form">
        <section class="form-section">
          <h3 class="section-h">
            <i class="fas fa-truck"></i> {{ $t('delivery_option') }}
          </h3>
          <div class="radio-group">
            <label class="radio-card">
              <input type="radio" value="curier" v-model="deliveryType" />
              <span class="radio-dot"></span>
              <span>{{ $t('courier') }}</span>
            </label>
            <label class="radio-card">
              <input type="radio" value="pickup" v-model="deliveryType" />
              <span class="radio-dot"></span>
              <span>{{ $t('pickup') }}</span>
            </label>
          </div>
        </section>

        <section v-if="deliveryType === 'curier'" class="form-section">
          <h3 class="section-h">
            <i class="fas fa-map-marker-alt"></i> {{ $t('delivery_address') }}
            <span class="required-badge">{{ $t('required') }}</span>
          </h3>
          <div class="form-group">
            <input v-model="addressDisplay" type="text" class="form-input" :placeholder="$t('address')" readonly />
          </div>
          <div class="form-group">
            <button type="button" @click="openMapPicker" class="btn-map">
              <i class="fas fa-map"></i> {{ addressDisplay || $t('select_on_map') }}
            </button>
          </div>
          <p class="helper-required">{{ $t('choose_location_required') }}</p>
        </section>

        <section v-if="deliveryType === 'pickup'" class="form-section">
          <h3 class="section-h">
            <i class="fas fa-store"></i> {{ $t('pickup_store') }}
            <span class="required-badge">{{ $t('required') }}</span>
          </h3>
          <div class="form-group">
            <button type="button" @click="openStorePicker" class="btn-map">
              <i class="fas fa-store"></i> {{ storeDisplay || $t('choose_store') }}
            </button>
          </div>
          <p class="helper-required">{{ $t('choose_store_first') }}</p>
        </section>

        <section class="form-section">
          <h3 class="section-h"><i class="fas fa-user"></i> {{ $t('recipient_info') }}</h3>
          <p class="helper-text">{{ $t('recipient_count_hint') }}</p>

          <div v-for="(recipient, idx) in recipients" :key="idx" class="recipient-card">
            <div class="recipient-head">
              <strong>{{ $t('recipient') }} {{ idx + 1 }}</strong>
              <button v-if="recipients.length > 1" type="button" class="mini-remove" @click="removeRecipient(idx)">
                {{ $t('delete') }}
              </button>
            </div>
            <div class="form-group">
              <input v-model="recipient.fullName" type="text" class="form-input" :placeholder="$t('full_name')" />
            </div>
            <div class="form-group">
              <input v-model="recipient.phone" type="tel" class="form-input" :placeholder="$t('phone_example')" />
            </div>
          </div>

          <button type="button" class="btn-add-recipient" @click="addRecipient" :disabled="recipients.length >= 3">
            <i class="fas fa-plus"></i> {{ $t('add_recipient') }}
          </button>
        </section>

        <section v-if="deliveryType === 'curier'" class="form-section">
          <h3 class="section-h">
            <i class="fas fa-wallet"></i> {{ $t('payment_method') }}
          </h3>
          <div class="payment-info">
            <i class="fas fa-check-circle"></i>
            <span>{{ $t('transfer') }}</span>
          </div>
        </section>

        <section class="form-section">
          <h3 class="section-h">
            <i class="fas fa-sticky-note"></i> {{ $t('additional_info') }}
          </h3>
          <div class="form-group">
            <textarea v-model="description" class="form-textarea" :placeholder='$t("additional_notes")'></textarea>
          </div>
        </section>

        <button
          class="btn-checkout"
          type="submit"
          :disabled="!canSubmitOrder"
          :class="{ 'is-disabled': !canSubmitOrder }"
        >
          {{ $t('submit_order') }}
        </button>
      </form>
    </div>

    <div v-if="showMapModal" class="modal-overlay" @click.self="showMapModal = false">
      <div class="modal-box">
        <div class="modal-header">
          <h5>{{ $t('choose_location') }}</h5>
          <button class="btn-close" @click="showMapModal = false">x</button>
        </div>
        <div class="modal-body">
          <MapView :selectable="true" @select="onMapSelected" />
        </div>
      </div>
    </div>

    <div v-if="showStoreModal" class="modal-overlay" @click.self="closeStorePicker">
      <div class="modal-box">
        <div class="modal-header">
          <h5>{{ $t('choose_store') }}</h5>
          <div class="modal-actions">
            <button type="button" class="btn-map-toggle" @click="showStoreMap = !showStoreMap">
              {{ showStoreMap ? $t('store_list') : $t('view_on_map') }}
            </button>
            <button class="btn-close" @click="closeStorePicker">x</button>
          </div>
        </div>
        <div class="modal-body">
          <div v-if="showStoreMap" class="store-map-wrap">
            <MapView :selectable="true" @select="onStoreMapSelected" />
          </div>
          <div v-else class="store-list">
            <button v-for="(s, idx) in stores" :key="idx" type="button" class="store-row" @click="selectStore(s)">
              <div class="store-row-left">
                <div class="store-row-name">{{ s.name }}</div>
                <div class="store-row-addr">{{ s.address }}</div>
              </div>
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showSuccessModal" class="modal-overlay" @click.self="closeSuccessModal">
      <div class="confirm-box">
        <div class="confirm-icon"><i class="fas fa-check-circle"></i></div>
        <h4>{{ $t('order_success') }}</h4>
        <p>{{ $t('order_success_desc') }}</p>
        <button type="button" class="btn-checkout" @click="closeSuccessModal">{{ $t('ok') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import MapView from './mapView.vue'
import { API } from '../variable/link.js'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import Cart from '../lib/cart.js'
import { getChatID } from '../variable/chat.js'

const { t } = useI18n()
const router = useRouter()

const chatID = ref(getChatID() || '')
const recipients = ref([{ fullName: '', phone: '' }])
const deliveryType = ref('curier')
const paymentType = ref("o'tkazma")
const address = ref(null)
const addressDisplay = ref('')
const store = ref(null)
const storeDisplay = ref('')
const description = ref('')
const showMapModal = ref(false)
const showStoreModal = ref(false)
const showStoreMap = ref(false)
const showSuccessModal = ref(false)
const submitting = ref(false)

const stores = ref([
  { name: 'UYDA Chilonzor - Bunyodkor 52', address: 'Bunyodkor prospekti 52, Chilonzor', lat: 41.277337, lon: 69.201132 },
  { name: 'UYDA Chilonzor - Lutfi 42', address: "Lutfi ko'chasi 42, Chilonzor", lat: 41.295787, lon: 69.200865 },
  { name: 'UYDA Yunusobod - Amir Temur 129B', address: "Amir Temur shoh ko'chasi 129B, Yunusobod", lat: 41.355968, lon: 69.287694 },
  { name: "UYDA Mirzo Ulug'bek - MU Prospekt 126/1", address: "Mirzo Ulug'bek prospekti 126/1", lat: 41.356672, lon: 69.361712 },
  { name: 'UYDA Sergili', address: 'Sergeli District, Mirza Tursunzade str. 14', lat: 41.223094, lon: 69.207844 }
])

const cartItems = ref([])
const productDetailsMap = ref({})

const loadCartFromServer = async () => {
  try {
    const resp = await Cart.get()
    let items = []
    if (Array.isArray(resp)) items = resp
    else if (resp && Array.isArray(resp.products)) items = resp.products
    else if (resp && Array.isArray(resp.data)) items = resp.data
    else if (resp && Array.isArray(resp.items)) items = resp.items

    const mapped = items.map(p => ({
      id: p.ID || p.id,
      quantity: Number(p.quantity || p.qty || 1),
      price: 0,
      name: '',
      image: null
    }))
    cartItems.value = mapped

    await Promise.all(mapped.map(async it => {
      try {
        const r = await axios.get(`${API.link}/product?productID=${encodeURIComponent(it.id)}`, {
          headers: {
            Accept: 'application/json',
            'ngrok-skip-browser-warning': '1',
            Authorization: 'Basic ' + btoa(`${API.username}:${API.password}`)
          }
        })
        const data = r?.data?.data || r?.data
        if (data) {
          const priceVal = data.price || data.amount || it.price || 0
          const priceNum = String(priceVal).replace(/\s+/g, '').replace(/[^\d.-]/g, '')
          it.price = Number(priceNum) || 0
          it.name = data.name || data.title || it.name || ''
          it.image = normalizeImageUrl(data.img || data.image || it.image || '')
          it.images = Array.isArray(data.images) ? data.images : []
          productDetailsMap.value[it.id] = data
        }
      } catch (e) {
        console.warn('Failed to fetch product detail for', it.id, e)
      }
    }))

    cartItems.value = [...cartItems.value]
    return true
  } catch (e) {
    console.warn('loadCartFromServer failed', e)
    return false
  }
}

try {
  void (async () => {
    const ok = await loadCartFromServer()
    if (!ok) {
      try {
        const raw = sessionStorage.getItem('app_cart')
        if (raw) cartItems.value = JSON.parse(raw)
      } catch (e) {
        console.warn('Failed to read cart from sessionStorage fallback:', e)
      }
    }
  })()
} catch (e) {
  console.warn('Cart init error', e)
}

const subtotal = computed(() => cartItems.value.reduce((s, it) => s + ((parseFloat(it.price) || 0) * (it.quantity || 1)), 0))
const isFreeDeliveryEligible = computed(() => subtotal.value > 1000000)
const hasValidRecipients = computed(() => recipients.value.every(r => r.fullName?.trim() && r.phone?.trim()))
const hasValidDeliveryTarget = computed(() => (deliveryType.value === 'curier' ? !!address.value : !!store.value))
const canSubmitOrder = computed(() => cartItems.value.length > 0 && hasValidRecipients.value && hasValidDeliveryTarget.value && !submitting.value)

const formatPrice = (n) => {
  if (n == null) return '-'
  const rounded = Math.round(n)
  const formatted = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'UZS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(rounded)
  return formatted.replace(/,/g, ' ')
}

const normalizeImageUrl = (value) => {
  if (!value || typeof value !== 'string') return ''
  return value.replace(/\\/g, '/')
}

const getOrderItemImage = (item) => {
  const firstFromArray = Array.isArray(item?.images) && item.images.length
    ? (item.images[0]?.url || item.images[0]?.img || item.images[0]?.image || item.images[0])
    : null

  return normalizeImageUrl(
    firstFromArray ||
    item?.img ||
    item?.image ||
    '/placeholder.png'
  )
}

function addRecipient() {
  if (recipients.value.length >= 3) return
  recipients.value.push({ fullName: '', phone: '' })
}

function removeRecipient(idx) {
  if (recipients.value.length <= 1) return
  recipients.value.splice(idx, 1)
}

function openMapPicker() {
  showMapModal.value = true
}

function onMapSelected(coords) {
  if (!coords) {
    showMapModal.value = false
    return
  }
  if (coords.lat != null) address.value = { lat: coords.lat, lon: coords.lon }
  if (typeof coords.address === 'string') addressDisplay.value = coords.address
  showMapModal.value = false
}

function openStorePicker() {
  showStoreModal.value = true
  showStoreMap.value = false
}

function closeStorePicker() {
  showStoreModal.value = false
  showStoreMap.value = false
}

function selectStore(s) {
  store.value = { lat: s.lat, lon: s.lon }
  storeDisplay.value = s.name
  closeStorePicker()
}

function onStoreMapSelected(coords) {
  if (!coords) return
  if (coords.lat != null) store.value = { lat: coords.lat, lon: coords.lon }
  storeDisplay.value = coords.address || t('store_selected_on_map')
  closeStorePicker()
}

function closeSuccessModal() {
  showSuccessModal.value = false
  try {
    router.push({ name: 'home' })
  } catch (e) {
    console.warn('navigate home failed', e)
  }
}

async function submitOrder() {
  if (!cartItems.value.length) {
    window.alert(t('cartEmpty'))
    return
  }

  const invalidRecipient = recipients.value.find(r => !r.fullName?.trim() || !r.phone?.trim())
  if (invalidRecipient) {
    window.alert(t('enter_recipient'))
    return
  }

  if (deliveryType.value === 'curier' && !address.value) {
    window.alert(t('choose_location_required'))
    return
  }

  if (deliveryType.value === 'pickup' && !store.value) {
    window.alert(t('choose_store_first'))
    return
  }

  const products = cartItems.value.map(it => ({
    ID: it.id || it.ID || String(it.id || ''),
    price: String(Math.round(it.price || 0)),
    quantity: String(it.quantity || 1)
  }))

  const payload = {
    chatID: String(window.Telegram?.WebApp?.initDataUnsafe?.user?.id || chatID.value || ''),
    address: deliveryType.value === 'pickup' ? null : (address.value ? { long: String(address.value.lon), lat: String(address.value.lat) } : null),
    store: store.value ? { long: String(store.value.lon), lat: String(store.value.lat), address: storeDisplay.value || '' } : null,
    deliveryType: deliveryType.value,
    recipient: recipients.value.map(r => ({ fullName: r.fullName.trim(), phone: r.phone.trim() })),
    paymentType: deliveryType.value === 'curier' ? paymentType.value : null,
    products,
    description: description.value || '',
    sum: String(Math.round(subtotal.value))
  }

  try {
    submitting.value = true
    const api = axios.create({
      baseURL: API.link,
      headers: {
        Accept: 'application/json',
        'ngrok-skip-browser-warning': '1',
        Authorization: 'Basic ' + btoa(`${API.username}:${API.password}`)
      }
    })
    const resp = await api.post('/order', payload)
    if (resp && (resp.status === 200 || resp.status === 201)) {
      try { sessionStorage.removeItem('app_cart') } catch (e) {}
      showSuccessModal.value = true
      return
    }
    window.alert(t('order_failed') + ': ' + (resp?.statusText || t('unknown')))
  } catch (err) {
    console.error('submitOrder error', err)
    window.alert(t('order_error'))
  } finally {
    submitting.value = false
  }
}

watch(deliveryType, (v) => {
  if (v === 'curier') {
    store.value = null
    storeDisplay.value = ''
  } else {
    address.value = null
    addressDisplay.value = ''
  }
})

onMounted(() => {
  try {
    const u = window.Telegram?.WebApp?.initDataUnsafe?.user
    if (u?.id) chatID.value = String(u.id)
  } catch (e) {}
})
</script>

<style scoped>
:root {
  --primary: #232323;
  --gray-light: #f8f9fa;
  --gray-border: #e9ecef;
  --text-primary: #2c3e50;
  --text-secondary: #7f8c8d;
}
.checkout-page { min-height: 100vh; background: linear-gradient(135deg, var(--gray-light) 0%, #f0f2f5 100%); }
.checkout-layout { max-width: 1200px; margin: 0 auto; padding: 24px 16px; display: grid; grid-template-columns: 1fr 380px; gap: 24px; }
.order-summary, .checkout-form { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08); }
.order-summary { order: 2; height: fit-content; }
.checkout-form { order: 1; }
.summary-header { margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid var(--gray-light); }
.summary-header h2 { margin: 0; font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 10px; color: #232323; }
.empty-message { text-align: center; padding: 40px 20px; color: var(--text-secondary); }
.product-list { list-style: none; margin: 0; padding: 0; max-height: 420px; overflow-y: auto; }
.product-card { display: grid; grid-template-columns: 80px 1fr 60px; gap: 12px; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--gray-light); }
.card-img { width: 80px; height: 80px; border-radius: 12px; background: var(--gray-light); overflow: hidden; }
.card-img img { width: 100%; height: 100%; object-fit: cover; }
.product-name { font-size: 14px; font-weight: 600; color: var(--primary); margin-bottom: 4px; }
.product-price { font-size: 16px; font-weight: 700; color: #232323; margin-bottom: 6px; }
.quantity-badge { display: inline-block; font-size: 12px; background: var(--gray-light); color: var(--text-secondary); padding: 4px 8px; border-radius: 12px; font-weight: 600; }
.line-total { font-size: 16px; font-weight: 700; color: var(--primary); }
.summary-divider { height: 2px; background: linear-gradient(90deg, transparent, var(--gray-border), transparent); margin: 16px 0; }
.total-row.final { display: flex; justify-content: space-between; font-size: 18px; font-weight: 700; color: var(--text-primary); }
.free-delivery-note {
  margin: 10px 0 0;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #b2f5d6;
  background: #ecfdf3;
  color: #027a48;
  font-size: 13px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.form-section { margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid var(--gray-light); }
.form-section:last-of-type { border-bottom: none; }
.section-h { margin: 0 0 14px; font-size: 16px; font-weight: 700; color: var(--primary); display: flex; align-items: center; gap: 8px; }
.form-group { margin-bottom: 12px; }
.form-input, .form-textarea { width: 100%; padding: 12px 14px; border: 1px solid var(--gray-border); border-radius: 10px; font-size: 14px; color: var(--text-primary); background: var(--gray-light); }
.form-textarea { resize: vertical; min-height: 100px; }
.btn-map { width: 100%; padding: 12px 16px; border: 1.5px solid var(--gray-border); background: white; border-radius: 10px; font-size: 14px; color: var(--text-primary); cursor: pointer; display: flex; align-items: center; gap: 10px; font-weight: 600; }
.btn-checkout { width: 100%; border: none; padding: 14px 16px; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.btn-checkout:disabled,
.btn-checkout.is-disabled {
  opacity: 0.55;
  cursor: not-allowed;
  filter: grayscale(0.2);
}
.radio-group { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.radio-card { border: 1.5px solid var(--gray-border); border-radius: 10px; padding: 12px; display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 600; }
.radio-card input { display: none; }
.radio-dot { width: 16px; height: 16px; border-radius: 50%; border: 2px solid #999; position: relative; }
.radio-card input:checked + .radio-dot { border-color: #232323; }
.radio-card input:checked + .radio-dot::after { content: ''; width: 8px; height: 8px; border-radius: 50%; background: #232323; position: absolute; inset: 2px; }
.recipient-card { border: 1px solid var(--gray-border); border-radius: 10px; padding: 12px; margin-bottom: 10px; background: #fafafa; }
.recipient-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.mini-remove { background: none; border: none; color: #b42318; font-size: 13px; cursor: pointer; }
.btn-add-recipient { border: 1px dashed #232323; background: white; border-radius: 10px; padding: 10px 12px; width: 100%; font-weight: 600; cursor: pointer; }
.helper-text, .helper-required { font-size: 12px; color: #b42318; margin: 6px 0 0; }
.required-badge { font-size: 11px; background: #fff1f0; color: #b42318; padding: 2px 8px; border-radius: 999px; margin-left: 4px; }
.payment-info { border: 1px solid #d1fadf; background: #ecfdf3; color: #027a48; border-radius: 10px; padding: 12px; display: flex; gap: 8px; font-weight: 600; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 5000; }
.modal-box { width: 100%; max-width: 960px; background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2); display: flex; flex-direction: column; max-height: 90vh; overflow: hidden; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--gray-light); }
.modal-header h5 { margin: 0; font-size: 16px; font-weight: 700; color: var(--text-primary); }
.modal-actions { display: flex; align-items: center; gap: 10px; }
.btn-close { background: transparent; border: none; font-size: 24px; color: var(--text-secondary); cursor: pointer; width: 32px; height: 32px; }
.btn-map-toggle { border: 1px solid var(--gray-border); background: white; border-radius: 8px; padding: 8px 10px; font-size: 13px; font-weight: 600; }
.modal-body { flex: 1; overflow-y: auto; }
.store-list { padding: 8px 14px 14px; }
.store-row { width: 100%; border: 1px solid var(--gray-border); border-radius: 10px; background: white; padding: 12px; display: flex; align-items: center; justify-content: space-between; margin-top: 10px; text-align: left; }
.store-row-left { max-width: calc(100% - 30px); }
.store-row-name { font-weight: 700; color: #101828; }
.store-row-addr { font-size: 13px; color: #667085; margin-top: 4px; }
.store-map-wrap { min-height: 500px; position: relative; }
.confirm-box { width: min(92%, 420px); background: white; border-radius: 16px; padding: 24px; text-align: center; box-shadow: 0 24px 64px rgba(0, 0, 0, 0.25); }
.confirm-icon i { font-size: 56px; color: #12b76a; margin-bottom: 12px; }
.confirm-box h4 { margin: 0 0 10px; color: #101828; font-weight: 700; }
.confirm-box p { margin: 0 0 18px; color: #475467; font-size: 14px; }
@media (max-width: 900px) {
  .checkout-layout { grid-template-columns: 1fr; gap: 16px; }
  .order-summary { order: -1; }
}
@media (max-width: 600px) {
  .checkout-layout { padding: 16px 12px; gap: 12px; }
  .order-summary, .checkout-form { padding: 16px; border-radius: 12px; }
  .radio-group { grid-template-columns: repeat(2, 1fr); }
  .modal-box { border-radius: 12px 12px 0 0; max-width: 100%; }
}
</style>
