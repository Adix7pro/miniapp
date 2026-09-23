import { createRouter, createWebHistory } from 'vue-router'
import TelegramHome from '../components/TelegramHome.vue'
import HomePage from '../components/HomePage.vue'
import TelegramAuth from '../components/TelegramAuth.vue'
import ProfileView from '../components/profileView.vue'
import ProfileEditView from '../components/profileEditView.vue'
import BarcodeView from '../components/barcodeView.vue'
import langView from '../components/langView.vue'
import registrationView from '../components/registrationView.vue'
import PhonePage from '../components/phonePage.vue'
import SmsVerifyView from '../components/smsVerifyView.vue'
import WelcomePage from '../components/WelcomePage.vue'
import RecieptHistoryView from '../components/recieptHistoryView.vue'
import mapView from '../components/mapView.vue'
import feedbackPageView from '../components/feedbackPageView.vue'
import hrJobsListView from '../components/hrJobsListView.vue'
import catalogView from '../components/catalogView.vue'
import CategoriesView from '../components/CategoriesView.vue'
import ProductListView from '../components/ProductListView.vue'
import ProductPageView from '../components/productPageView.vue'
import SearchView from '../components/SearchView.vue'
import cartView from '../components/cartView.vue'
import OrderView from '../components/orderView.vue'
import collectionView from '../components/collectionView.vue'
import BranchesView from '../components/BranchesView.vue'

const routes = [
  { path: '/', name: 'welcome', component: WelcomePage },
  { path: '/home', name: 'home', component: HomePage },
  { path: '/tg-home', name: 'telegram-home', component: TelegramHome },
  { path: '/auth', name: 'auth', component: TelegramAuth },
  { path: '/profile', name: 'profile', component: ProfileView },
  { path: '/profile/edit', name: 'profile-edit', component: ProfileEditView },
  { path: '/barcode', name: 'barcode', component: BarcodeView },
  { path: '/lang', name: 'lang', component: langView },
  { path: '/register', name: 'register', component: registrationView },
  { path: '/phone', name: 'phone', component: PhonePage },
  { path: '/verify', name: 'verify', component: SmsVerifyView },
  { path: '/receipts', name: 'receipts', component: RecieptHistoryView },
  { path: '/map', name: 'map', component: mapView },
  { path: '/branches', name: 'branches', component: BranchesView },
  { path: '/feedback/:recipientCode', name: 'feedback', component: feedbackPageView },
  { path: '/feedback', name: 'feedback-query', component: feedbackPageView },
  { path: '/jobs', name: 'jobs', component: hrJobsListView },
  { path: '/catalog', name: 'catalog', component: catalogView },
  { path: '/categories', name: 'categories', component: CategoriesView },
  { path: '/search', name: 'search', component: SearchView },
  { path: '/products/:categoryId', name: 'products', component: ProductListView },
  { path: '/collection/:id', name: 'collection', component: collectionView },
  { path: '/product/:id', name: 'product', component: ProductPageView },
  { path: '/cart', name: 'cart', component: cartView },
  { path: '/checkout', name: 'checkout', component: OrderView },
]


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
