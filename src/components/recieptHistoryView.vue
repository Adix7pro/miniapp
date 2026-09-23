<template>
  <div class="receipt-history-container p-3">
    <!-- Header -->
    <div class="header-section mb-4">
  <h2 class="mb-3">{{ tr('receipts_title') }}</h2>
      
    </div>

    <!-- Receipts List -->
    <div class="receipts-list">
      <div v-for="receipt in filteredReceipts" :key="receipt.id" 
           class="receipt-item p-3 mb-3 bg-white rounded shadow-sm"
           @click="showReceiptDetails(receipt)">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <h5 class="mb-1">{{ receipt.storeName }}</h5>
            <p class="text-muted mb-1 small">
              <i class="bi bi-calendar3"></i> 
              {{ formatDate(receipt.date) }}
            </p>
            <p class="text-muted mb-1 small">
              <i class="bi bi-receipt"></i> 
              {{ tr('receipt_number') }}: #{{ receipt.receiptNumber }}
            </p>
          </div>
          <div class="text-end">
            <h5 class="text-primary mb-1">{{ formatAmount(receipt.amount) }}</h5>
            <span class="badge bg-success">+{{ receipt.bonusPoints }} {{ tr('bonus_earned') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center p-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">{{ tr('loading') }}</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && filteredReceipts.length === 0" class="text-center p-4">
      <i class="bi bi-receipt-cutoff fs-1 text-muted"></i>
      <p class="mt-3 text-muted">{{ tr('no_receipts') }}</p>
    </div>
  </div>
</template>

<script>
import { t, getStoredLang } from '../variable/i18n.js'

export default {
  name: 'ReceiptHistoryView',
  data() {
    return {
      language: getStoredLang(),
      receipts: [
        {
          id: 1,
          storeName: 'Korzinka Chilonzor',
          date: '2025-10-31T10:30:00',
          receiptNumber: '12345',
          amount: 250000,
          bonusPoints: 5000,
          items: [
            { name: 'Non', quantity: 2, price: 5000 },
            { name: 'Sut', quantity: 1, price: 15000 }
          ]
        },
        {
          id: 2,
          storeName: 'Makro C1',
          date: '2025-10-30T15:45:00',
          receiptNumber: '12346',
          amount: 480000,
          bonusPoints: 48,
          items: [
            { name: 'Go\'sht', quantity: 1, price: 180000 },
            { name: 'Sabzavotlar', quantity: 3, price: 100000 }
          ]
        }
        // More receipts can be added here
      ],
      searchQuery: '',
      dateFilter: 'all',
      amountFilter: 'all',
      showFilters: false,
      loading: false
    }
  },
  computed: {
    filteredReceipts() {
      let result = [...this.receipts]

      // Search filter
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        result = result.filter(receipt => 
          receipt.storeName.toLowerCase().includes(query) ||
          receipt.receiptNumber.includes(query)
        )
      }

      // Date filter
      switch (this.dateFilter) {
        case 'today':
          const today = new Date().toISOString().split('T')[0]
          result = result.filter(receipt => 
            receipt.date.startsWith(today)
          )
          break
        case 'week':
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          result = result.filter(receipt => 
            new Date(receipt.date) >= weekAgo
          )
          break
        case 'month':
          const monthAgo = new Date()
          monthAgo.setMonth(monthAgo.getMonth() - 1)
          result = result.filter(receipt => 
            new Date(receipt.date) >= monthAgo
          )
          break
      }

      // Amount filter
      if (this.amountFilter === 'asc') {
        result.sort((a, b) => a.amount - b.amount)
      } else if (this.amountFilter === 'desc') {
        result.sort((a, b) => b.amount - a.amount)
      }

      return result
    }
  },
  methods: {
    tr(key, params = {}) {
      return t(key, this.language, params)
    },
    formatDate(dateString) {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat('uz-UZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)
    },
    formatAmount(amount) {
      return new Intl.NumberFormat('uz-UZ', {
        style: 'currency',
        currency: 'UZS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount)
    },
    toggleFilterMenu() {
      this.showFilters = !this.showFilters
    },
    showReceiptDetails(receipt) {
      // To be implemented: show modal or navigate to detail view
      console.log('Show details for receipt:', receipt)
    }
  }
}
</script>

<style scoped>
.receipt-history-container {
  max-width: 768px;
  margin: 0 auto;
}

.receipt-item {
  border: 1px solid #eee;
  transition: all 0.3s ease;
  cursor: pointer;
}

.receipt-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
}

.search-box {
  flex: 1;
  margin-right: 1rem;
}

.filter-menu {
  border: 1px solid #dee2e6;
}

.bi {
  margin-right: 0.5rem;
}

/* Responsive adjustments */
@media (max-width: 576px) {
  .receipt-item {
    font-size: 0.9rem;
  }
  
  .header-section h2 {
    font-size: 1.5rem;
  }
}
</style>
