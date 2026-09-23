<template>
  <div class="map-container">
    <div class="map-wrapper" style="top:40px">
      <div ref="mapElement" class="ymaps-container"></div>

      <!-- Map Controls (hidden while selecting a location) -->
      <div class="map-controls" v-if="!props.selectable">
        <button class="map-btn" @click="zoomIn" title="Zoom in">+</button>
        <button class="map-btn" @click="zoomOut" title="Zoom out">−</button>
        <button class="map-btn" @click="locateUser" title="My location"><i class="bi bi-geo-alt"></i></button>
      </div>

      <!-- Nearest Store Info Bar (hidden when selecting) -->
      <div v-if="displayedStore && !props.selectable" class="nearest-store-bar">
        <div class="store-info">
          <div class="store-name">{{ displayedStore.name }}</div>
          <div class="store-distance">{{ formatDistance(displayedStore.distance) }} away</div>
        </div>
        <div class="nearest-store-actions">
          <button class="btn btn-sm btn-primary ms-2" @click="confirmNavigate(displayedStore)">{{ t('navigate') }}</button>
        </div>
      </div>
    </div>

    <!-- Center marker overlay (visual) -->
    <div v-if="props.selectable" class="center-marker-overlay" aria-hidden="true">
      <div class="center-pin" role="img" aria-label="Selected location">
        <!-- SVG pin -->
        <svg width="42" height="56" viewBox="0 0 42 56" xmlns="http://www.w3.org/2000/svg" class="pin-svg">
          <defs>
            <linearGradient id="pinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ff7a2d"/>
              <stop offset="100%" stop-color="#ff4b00"/>
            </linearGradient>
            <filter id="pinShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity="0.15"/>
            </filter>
          </defs>
          <g filter="url(#pinShadow)">
            <path d="M21 2c7.18 0 13 5.82 13 13 0 9.86-10.54 22.6-12.7 25.1a3 3 0 0 1-4.6 0C18.54 37.6 8 24.86 8 15c0-7.18 5.82-13 13-13z" fill="url(#pinGrad)"/>
            <circle cx="21" cy="15" r="6" fill="#ffffff" opacity="0.96"/>
          </g>
        </svg>
      </div>
    </div>

    <!-- Selection bar for pick-on-map mode (shows live address) -->
    <div v-if="props.selectable && selectedLocation" class="selection-bar">
      <div class="selection-info">
        <div class="coords">{{ t('selected_point') || 'Selected point' }}: <strong>{{ selectedLocation.lat.toFixed(6) }}, {{ selectedLocation.lon.toFixed(6) }}</strong></div>
        <div class="addr" v-if="selectedAddress">{{ selectedAddress }}</div>
        <div class="addr small text-muted" v-else>{{ t('locating') || 'Locating...' }}</div>
      </div>
      <div class="selection-actions">
        <button class="btn btn-sm btn-secondary" @click="cancelSelection">{{ t('cancel') || 'Cancel' }}</button>
        <button class="btn btn-sm btn-primary" @click="confirmSelection">{{ t('select') || 'Select' }}</button>
      </div>
    </div> 
   
    <!-- Confirmation Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="cancelModal">
      <div class="modal-box">
        <h5>{{ t('navigate_yandex') }}</h5>
        <p class="small text-muted">{{ t('selected_store') }} <strong>{{ pendingDestination && pendingDestination.name }}</strong></p>
        <div class="d-flex justify-content-end gap-2 mt-3">
          <button class="btn btn-sm btn-secondary" @click="cancelModal">{{ t('no') }}</button>
          <button class="btn btn-sm btn-primary" @click="confirmModal">{{ t('open') }}</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import markerIcon from '../assets/img/uyda-mark.png'
import { UYDA_STORES } from '../variable/stores.js'

const { t } = useI18n()
const route = useRoute()

// Props & emits for selectable mode (used when map is placed inside a modal to pick a location)
const props = defineProps({ selectable: { type: Boolean, default: false } })
const emit = defineEmits(['select'])
const selectedLocation = ref(null)
let selectMarker = null

// Map container reference
const mapElement = ref(null)
let map = null
// single user marker instance (avoid duplicates)
let userMarker = null
// geolocation watch id for live updates
let geoWatchId = null
const followUser = ref(false)

// Map state
const center = ref([41.311151, 69.279737]) // Tashkent
const zoom = ref(12)
const stores = ref([])
const userLocation = ref(null)
// marker storage
const leafletMarkers = []

// Marker sizing (scale markers when zoom changes)
const BASE_MARKER_SIZE = 36 // pixels at BASE_ZOOM
const BASE_ZOOM = 12

function computeMarkerSize() {
  try {
    const z = map ? map.getZoom() : zoom.value
    // exponential scale factor so markers grow/shrink smoothly
    const scale = Math.pow(1.08, (z - BASE_ZOOM))
    const size = Math.max(16, Math.round(BASE_MARKER_SIZE * scale))
    return size
  } catch (e) {
    return BASE_MARKER_SIZE
  }
}

function updateMarkerSizes() {
  if (!map) return
  const newSize = computeMarkerSize()
  try {
    const icon = L.icon({
      iconUrl: markerIcon,
      iconSize: [newSize, newSize],
      iconAnchor: [Math.round(newSize / 2), newSize]
    })
    leafletMarkers.forEach(m => {
      try { m.setIcon(icon) } catch (e) { /* ignore */ }
    })

    // update user marker (divIcon) scale by replacing it (single userMarker)
    if (userMarker) {
      const scaleFactor = newSize / BASE_MARKER_SIZE
      const userIcon = L.divIcon({
        className: 'user-marker',
        html: `<div style="transform: scale(${scaleFactor}); transform-origin: center; display:inline-block">` +
              `<svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#3366FF" stroke="white" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="white"/></svg>` +
              `</div>`,
        iconSize: [newSize, newSize],
        iconAnchor: [Math.round(newSize/2), Math.round(newSize/2)]
      })
      try {
        // replace marker while keeping position
        const latlng = userMarker.getLatLng()
        map.removeLayer(userMarker)
        const newM = L.marker([latlng.lat, latlng.lng], { icon: userIcon }).addTo(map)
        newM.bindPopup(t('you_are_here') || 'Your location')
        userMarker = newM
      } catch (e) { /* ignore */ }
    }
  } catch (e) {
    console.warn('updateMarkerSizes failed', e)
  }
}

// Modal state for navigation confirmation
const showModal = ref(false)
const pendingDestination = ref(null)

// Selected store (when clicking on a store from the list)
const selectedStore = ref(null)

function confirmNavigate(store) {
  pendingDestination.value = store
  showModal.value = true
}

function cancelModal() {
  showModal.value = false
  pendingDestination.value = null
}

function confirmModal() {
  if (pendingDestination.value) {
    try { openInYandex(pendingDestination.value) } catch (e) { console.warn(e) }
  }
  showModal.value = false
  pendingDestination.value = null
}

function onGoClick(store) {
  goToStore(store)
  confirmNavigate(store)
}

function selectStore(store) {
  // When clicking "Go" on a store, select it and update the display
  selectedStore.value = store
  goToStore(store)
}

function goToStore(store) {
  if (!store || !map) return
  try { map.setView([store.lat, store.lon], Math.max(zoom.value, 13)) } catch (e) {}
  try {
    leafletMarkers.forEach(m => {
      const latlng = m.getLatLng()
      if (Math.abs(latlng.lat - store.lat) < 0.0001 && Math.abs(latlng.lng - store.lon) < 0.0001) {
        m.openPopup()
      }
    })
  } catch (e) { console.warn('Failed to open popup', e) }
}

function focusStoreFromRouteQuery() {
  if (!map || props.selectable) return
  const lat = Number(route.query?.lat)
  const lon = Number(route.query?.lon)
  const name = (route.query?.name || '').toString()
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lon)

  if (!hasCoords && !name) return

  let target = null
  if (hasCoords) {
    target = stores.value.find((s) => Math.abs(s.lat - lat) < 0.0003 && Math.abs(s.lon - lon) < 0.0003) || null
  }
  if (!target && name) {
    const normalized = name.toLowerCase()
    target = stores.value.find((s) => (s.name || '').toLowerCase() === normalized) || null
  }

  if (!target && hasCoords) {
    target = {
      name: name || 'Selected Store',
      address: '',
      lat,
      lon
    }
  }

  if (!target) return
  selectedStore.value = target
  goToStore(target)
}

// Computed properties
const displayedStore = computed(() => {
  // Show selected store if one is chosen, otherwise show nearest store
  if (selectedStore.value) {
    return selectedStore.value
  }
  return nearestStore.value
})

const nearestStore = computed(() => {
  if (!stores.value.length || !userLocation.value) return null
  
  let nearest = null
  let minDistance = Infinity

  stores.value.forEach(store => {
    const distance = haversineDistance(
      userLocation.value.lat,
      userLocation.value.lon,
      store.lat,
      store.lon
    )
    
    if (distance < minDistance) {
      minDistance = distance
      nearest = {
        ...store,
        distance: minDistance
      }
    }
  })

  return nearest
})

// Computed list of stores with distance (sorted by nearest)
const storesWithDistance = computed(() => {
  return stores.value
    .map(s => ({ ...s }))
    .map(s => {
      if (userLocation.value && userLocation.value.lat != null) {
        s.distance = haversineDistance(userLocation.value.lat, userLocation.value.lon, s.lat, s.lon)
      } else {
        s.distance = null
      }
      return s
    })
    .sort((a, b) => {
      if (a.distance == null) return 1
      if (b.distance == null) return -1
      return a.distance - b.distance
    })
})

function updateStoreDistances() {
  // Attach distance to original stores array for use by popups
  const updated = storesWithDistance.value
  updated.forEach((s) => {
    const idx = stores.value.findIndex(x => x.name === s.name && x.lat === s.lat && x.lon === s.lon)
    if (idx !== -1) stores.value[idx].distance = s.distance
  })
}

// Initialize stores (hardcoded for now)
function initializeStores() {
  stores.value = UYDA_STORES.map((store) => ({ ...store }))
}

// Read API key
function readApiKey() {
  try {
    if (window.YANDEX_API_KEY) return window.YANDEX_API_KEY
    if (window.YANDEX_STATIC_API_KEY) return window.YANDEX_STATIC_API_KEY
    const fromLs = localStorage.getItem('YMAP_STATIC_KEY')
    if (fromLs) return fromLs
    if (import.meta.env.VITE_YANDEX_STATIC_API_KEY) return import.meta.env.VITE_YANDEX_STATIC_API_KEY
    // Fallback key
    return '887ac1c2-1512-45ad-806a-fb1dca18ec48'
  } catch (e) {}
  return ''
}

// Wait for Yandex Maps API to load
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import leafletMarkerUrl from 'leaflet/dist/images/marker-icon.png'
import leafletMarkerShadow from 'leaflet/dist/images/marker-shadow.png'
L.Icon.Default.mergeOptions({
  iconUrl: leafletMarkerUrl,
  shadowUrl: leafletMarkerShadow
})

async function initializeMap() {
  if (!mapElement.value || map) return

  try {
      // L is imported from 'leaflet'
    console.log('mapView: Leaflet loaded')

    map = L.map(mapElement.value).setView(center.value, zoom.value)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map)

    // Ensure Leaflet renders correctly when container size may change
    setTimeout(() => {
      try { map.invalidateSize() } catch (e) { /* ignore */ }
    }, 300)

    addStoreMarkers()
    locateUser()

    // ensure marker sizes follow zoom level
    try { updateMarkerSizes() } catch (e) {}
    map.on('zoomend', () => {
      try { updateMarkerSizes() } catch (e) {}
    })

    map.on('moveend', () => {
      const c = map.getCenter()
      center.value = [c.lat, c.lng]
      zoom.value = map.getZoom()
      // Update center-based selection preview
      try { setSelectedFromCenter() } catch (e) {}
    })

    // -- no click-selection in center-based mode --
  } catch (err) {
    console.error('Failed to initialize Leaflet map:', err)
  }
}  

// Add store markers to map
function addStoreMarkers() {
  if (!map || !L) return

  // remove existing
  leafletMarkers.forEach(m => { try { map.removeLayer(m) } catch (e) {} })
  leafletMarkers.length = 0

  const markerSize = computeMarkerSize()
  const icon = L.icon({
    iconUrl: markerIcon,
    iconSize: [markerSize, markerSize],
    iconAnchor: [Math.round(markerSize / 2), markerSize]
  })

  stores.value.forEach(store => {
    try {
      const distText = store.distance ? `\n<br/><strong>${formatDistance(store.distance)}</strong>` : ''
      const m = L.marker([store.lat, store.lon], { icon }).addTo(map)
      m.bindPopup(`<strong>${store.name}</strong><br/>${store.address}${distText}`)
      // Click marker to select it and show in info bar
      m.on('click', () => {
        selectedStore.value = store
        m.openPopup()
      })
      leafletMarkers.push(m)
    } catch (e) {
      console.warn('Failed to add leaflet marker', e)
    }
  })
}

// Update or add user location marker
function updateUserMarker(lat, lon) {
  if (!map || !L) return

  // remove existing user marker if any
  if (userMarker) {
    try { map.removeLayer(userMarker) } catch (e) {}
    userMarker = null
  }

  try {
    const markerSize = computeMarkerSize()
    const scaleFactor = markerSize / BASE_MARKER_SIZE
    const userIcon = L.divIcon({
      className: 'user-marker',
      html: `<div style="display:inline-block; transform: scale(${scaleFactor}); transform-origin: center">` +
            `<svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#3366FF" stroke="white" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="white"/></svg>` +
            `</div>`,
      iconSize: [markerSize, markerSize],
      iconAnchor: [Math.round(markerSize/2), Math.round(markerSize/2)]
    })

    const m = L.marker([lat, lon], { icon: userIcon }).addTo(map)
    m.bindPopup(t('you_are_here') || 'Your location')
    userMarker = m
  } catch (e) {
    console.warn('Failed to update user marker:', e)
  }
}

import axios from 'axios'

// Center-based selection for pick-on-map mode
const selectedAddress = ref('')
let reverseGeocodeTimer = null

function setSelectedFromCenter() {
  if (!map || !props.selectable) return
  try {
    const c = map.getCenter()
    selectedLocation.value = { lat: c.lat, lon: c.lng }
    // reverse geocode (debounced)
    if (reverseGeocodeTimer) clearTimeout(reverseGeocodeTimer)
    reverseGeocodeTimer = setTimeout(() => {
      reverseGeocode(c.lat, c.lng).then(addr => {
        selectedAddress.value = addr || ''
      }).catch(e => {
        selectedAddress.value = ''
      })
    }, 400)
  } catch (e) {
    console.warn('setSelectedFromCenter failed', e)
  }
}

async function reverseGeocode(lat, lon) {
  try {
    const key = readApiKey()
    // Prefer Yandex geocoder if key exists
    if (key) {
      try {
        const url = `https://geocode-maps.yandex.ru/1.x/?format=json&apikey=${encodeURIComponent(key)}&geocode=${encodeURIComponent(lon + ',' + lat)}&kind=house`
        const res = await axios.get(url)
        const obj = res?.data
        const found = obj?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject
        if (found && found.name) {
          const desc = found?.metaDataProperty?.GeocoderMetaData?.text
          return desc || found.name || ''
        }
      } catch (e) {
        // continue to fallback
      }
    }

    // Fallback to Nominatim reverse geocode
    try {
      const nomURL = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`
      const r = await axios.get(nomURL, { headers: { 'Accept': 'application/json', 'User-Agent': 'uyda-loyalty/1.0' } })
      if (r && r.data) {
        return r.data.display_name || r.data.name || ''
      }
    } catch (e) { /* ignore */ }
  } catch (e) { console.warn('reverseGeocode failed', e) }
  return ''
}

function confirmSelection() {
  if (selectedLocation.value) {
    const payload = { lat: selectedLocation.value.lat, lon: selectedLocation.value.lon, address: selectedAddress.value }
    try { emit('select', payload) } catch (e) { console.warn('emit select failed', e) }
    // keep the modal open to allow further picks until user closes
  }
}

function cancelSelection() {
  selectedLocation.value = null
  selectedAddress.value = ''
} 

// Locate user position
function locateUser() {
  if (!navigator.geolocation) {
    console.warn('Geolocation not supported')
    return
  }
  // Toggle live tracking: start if not watching, stop if already watching
  if (geoWatchId != null) {
    stopLocateUser()
    return
  }

  followUser.value = true
  geoWatchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords
      userLocation.value = { lat: latitude, lon: longitude }
      updateUserMarker(latitude, longitude)
      updateStoreDistances()
      addStoreMarkers()
      // Center map only on first locate (followUser true), then disable to prevent constant re-centering
      if (map && followUser.value) {
        try { map.setView([latitude, longitude], Math.max(zoom.value, 13)) } catch (e) {}
        followUser.value = false // Disable auto-center after first update to allow user to pan/zoom freely
      }
    },
    (error) => {
      console.warn('Geolocation error (watch):', error)
      // fallback to default center if nothing available
      if (!userLocation.value) userLocation.value = { lat: 41.311151, lon: 69.279737 }
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 }
  )
}

function stopLocateUser() {
  try {
    if (geoWatchId != null && navigator.geolocation && navigator.geolocation.clearWatch) {
      navigator.geolocation.clearWatch(geoWatchId)
    }
  } catch (e) { /* ignore */ }
  geoWatchId = null
  followUser.value = false
}

// Navigate to nearest store
function goToNearest() {
  if (!nearestStore.value || !map) return
  const store = nearestStore.value
  // Center map on nearest store first
  try { map.setView([store.lat, store.lon], Math.max(zoom.value, 13)) } catch (e) {}
  // open popup on matching marker
  try {
    leafletMarkers.forEach(m => {
      const latlng = m.getLatLng()
      if (Math.abs(latlng.lat - store.lat) < 0.0001 && Math.abs(latlng.lng - store.lon) < 0.0001) {
        m.openPopup()
      }
    })
  } catch (e) { console.warn('Failed to open popup', e) }

  // Ask user for confirmation before opening Yandex navigation
  try {
    confirmNavigate(store)
  } catch (e) { console.warn('Failed to open confirmation modal', e) }
}

// Attempt to open Yandex Navigator / Maps app with a destination, fallback to web
function openInYandex(store) {
  if (!store) return
  const lat = store.lat
  const lon = store.lon

  // Web URL for Yandex Maps
  const webUrl = `https://yandex.com/maps/?rtext=~${encodeURIComponent(lat)},${encodeURIComponent(lon)}&z=16`

  // Use Telegram.WebApp.openLink() if available (proper way for Telegram Mini Apps)
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.openLink) {
    try {
      window.Telegram.WebApp.openLink(webUrl)
      console.log('Opened link via Telegram.WebApp.openLink:', webUrl)
      return
    } catch (e) {
      console.warn('Telegram.WebApp.openLink failed:', e)
    }
  }

  // Fallback: try window.open
  try {
    window.open(webUrl, '_blank')
    console.log('Opened link via window.open:', webUrl)
  } catch (e) {
    console.warn('Failed to open link:', e)
  }
}

// Map controls
function zoomIn() {
  if (map) {
    const next = Math.min(19, map.getZoom() + 1)
    map.setZoom(next)
    zoom.value = next
  }
}

function zoomOut() {
  if (map) {
    const next = Math.max(1, map.getZoom() - 1)
    map.setZoom(next)
    zoom.value = next
  }
}

function resetCenter() {
  if (map) {
    center.value = [41.311151, 69.279737]
    zoom.value = 12
    try { map.setView(center.value, zoom.value) } catch (e) { /* ignore */ }
  }
}

// Calculate distance between two coordinates (Haversine formula)
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000 // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180
  
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Format distance for display
function formatDistance(meters) {
  if (!meters) return ''
  if (meters < 1000) return Math.round(meters) + ' m'
  return (meters / 1000).toFixed(1) + ' km'
}

// Lifecycle hooks
onMounted(() => {
  initializeStores()
  // small delay to ensure DOM node available
  setTimeout(() => {
    initializeMap()
    // compute initial distances (if geolocation already available)
    updateStoreDistances()
    // focus store when arriving from /branches
    setTimeout(() => {
      focusStoreFromRouteQuery()
    }, 450)
  }, 300)
})

onBeforeUnmount(() => {
  if (map) {
    try { map.remove() } catch (e) {}
    map = null
  }
  // stop geoposition watch if active
  try { if (geoWatchId != null && navigator.geolocation && navigator.geolocation.clearWatch) navigator.geolocation.clearWatch(geoWatchId) } catch (e) {}
  geoWatchId = null
})

// Watch user location changes
watch(userLocation, (newLocation) => {
  if (newLocation && map) {
    updateUserMarker(newLocation.lat, newLocation.lon)
    updateStoreDistances()
    addStoreMarkers()
  }
})

watch(
  () => route.fullPath,
  () => {
    setTimeout(() => {
      focusStoreFromRouteQuery()
    }, 120)
  }
)

// Center map on user's location (show me)
function showMe() {
  if (userLocation.value && userLocation.value.lat != null && map) {
    try {
      // enable follow mode and center
      followUser.value = true
      map.setView([userLocation.value.lat, userLocation.value.lon], Math.max(13, map.getZoom()))
      // open user marker popup if exists
      if (userMarker) {
        try { userMarker.openPopup() } catch (e) {}
      }
      return
    } catch (e) { console.warn('showMe failed', e) }
  }

  // If we don't have a cached location, attempt to get it and then center
  locateUser()
  setTimeout(() => {
    if (userLocation.value && userLocation.value.lat != null && map) {
      try { map.setView([userLocation.value.lat, userLocation.value.lon], Math.max(13, map.getZoom())) } catch (e) {}
      if (userMarker) try { userMarker.openPopup() } catch (e) {}
    }
  }, 800)
}
</script>

<style scoped>
.map-container {
  width: calc(100% - 24px);
  /* Make the map fixed on screen between header and bottom bar */
  position: fixed;
  left: 12px;
  right: 12px;
  top: 120px; /* header height (50+70) */
  bottom: 120px; /* reserve space for bottom bar + floating button */
  z-index: 1000;
  display: block;
  background: transparent;
}

.map-error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  color: #d32f2f;
  border-radius: 12px;
  margin: 12px;
  font-size: 14px;
}

.map-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.ymaps-container {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 6px 18px rgba(0,0,0,0.06);
}

/* Map Controls */
.map-controls {
  position: absolute;
  right: 12px;
  /* lift controls higher so they don't get visually pushed under other blocks */
  bottom: 140px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 2000;
}

.map-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.95);
  border: none;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  color: #333;
}

.map-btn:hover {
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.16);
  transform: translateY(-1px);
}

.map-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.stores-list-container{
  width:100%;
  display:flex;
  justify-content:center;
  /* push the stores list below the fixed map area (map occupies viewport between top:120px and bottom:120px) */
  margin-top: calc(100vh - 240px + 12px);
}
.stores-list{
  width:100%;
  max-width:980px;
  background: rgba(255,255,255,0.98);
  border-radius: 10px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.06);
  padding: 8px;
}
.store-row{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:8px 10px;
  border-bottom:1px solid #f1f1f1;
}
.store-row:last-child{border-bottom:0}
.store-row-left{flex:1;min-width:0}
.store-row-name{font-size:14px;font-weight:700;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.store-row-addr{font-size:12px}
.store-row-right{display:flex;align-items:center;gap:8px}
.store-row-distance{font-size:13px;color:#666}
.show-me-btn{padding:6px 10px;font-size:13px}

/* Nearest Store Info Bar */
.nearest-store-bar {
  position: absolute;
  left: 12px;
  right: 12px;
  /* ensure bar sits above the stores list */
  bottom: 88px;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  animation: slideUp 0.3s ease;
}

/* Selection bar */
.selection-bar {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 48px;
  z-index: 3000;
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding: 10px 12px;
  background: rgba(255,255,255,0.98);
  border-radius: 10px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
}
.selection-info { flex:1; min-width:0 }
.selection-info .coords { font-size:13px; font-weight:700 }
.selection-info .addr { font-size:13px; color:#333; margin-top:6px; max-height:44px; overflow:hidden; text-overflow:ellipsis }
.selection-actions { display:flex; gap:8px; flex-shrink:0 }

/* visual center pin overlay */
.center-marker-overlay {
  position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); z-index:2500; pointer-events:none;
}
.center-pin { width:42px; height:56px; display:flex; align-items:center; justify-content:center; transform: translateY(-6px); animation: pinFloat 1.6s ease-in-out infinite }
.pin-svg { display:block }
@keyframes pinFloat {
  0% { transform: translate(-50%,-52%) translateY(-2px); }
  50% { transform: translate(-50%,-52%) translateY(-8px); }
  100% { transform: translate(-50%,-52%) translateY(-2px); }
}

/* responsiveness */
@media (max-width: 720px) {
  .map-controls { right:8px; bottom: 84px }
  .selection-bar { left:8px; right:8px; bottom: 20px; padding:10px }
  .center-pin { width:28px; height:28px; transform: translateY(-10px) }
}

@media (max-width:480px) {
  .center-pin { width:34px; height:34px }
}


.store-name {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.store-distance {
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.navigate-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin-left: 8px;
  border-radius: 8px;
  background: linear-gradient(135deg, #ff5722, #ffb26e);
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.navigate-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(255, 87, 34, 0.3);
}

.navigate-btn:active {
  transform: scale(0.95);
}

/* Responsive */
@media (max-width: 480px) {
  .map-controls {
    right: 8px;
    bottom: 70px;
    gap: 6px;
  }

  .map-btn {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }

  .nearest-store-bar {
    left: 8px;
    right: 8px;
    bottom: 8px;
    padding: 10px 12px;
  }

  .store-name {
    font-size: 12px;
  }

  .store-distance {
    font-size: 11px;
  }

/* Modal styles */
.modal-overlay {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.modal-box {
  background: #fff;
  padding: 16px;
  border-radius: 10px;
  width: 92%;
  max-width: 420px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.18);
}
}
</style>
