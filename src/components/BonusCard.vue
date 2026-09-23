<template>
  <section class="uy-bonus" :class="{ open: isCollapsed }">
    <!-- Asosiy qism: jami bonus (bosilsa oylik/choraklik tafsilot ochiladi) -->
    <button class="uy-bonus-head" type="button" @click="toggleCollapse" :aria-expanded="isCollapsed">
      <span class="uy-bonus-text">
        <span class="uy-bonus-label">{{ t('total_bonus') }}</span>
        <span class="uy-bonus-value">{{ formatNumber(bonusValue) }}<small>{{ t('sum') }}</small></span>
      </span>
      <span class="uy-bonus-toggle" v-html="icons.chevronUp"></span>
    </button>

    <!-- Tafsilot: oylik va choraklik xaridlar -->
    <div v-show="isCollapsed" class="uy-bonus-details">
      <div class="uy-bonus-row">
        <div class="uy-bonus-row-head">
          <span>{{ t('monthly_bonus') }}</span>
          <strong>{{ formatNumber(monthlyBonus) }} {{ t('sum') }}</strong>
        </div>
        <div class="uy-progress"><div class="uy-progress-fill" :style="{ width: monthlyProgressPercent + '%' }"></div></div>
        <div class="uy-bonus-percent">{{ monthlyProgressPercent.toFixed(0) }}%</div>
      </div>
      <div class="uy-bonus-row">
        <div class="uy-bonus-row-head">
          <span>{{ t('quarterly_bonus') }}</span>
          <strong>{{ formatNumber(quarterlyBonus) }} {{ t('sum') }}</strong>
        </div>
        <div class="uy-progress"><div class="uy-progress-fill" :style="{ width: quarterlyProgressPercent + '%' }"></div></div>
        <div class="uy-bonus-percent">{{ quarterlyProgressPercent.toFixed(0) }}%</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { defineProps, computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { icons } from '../lib/uiIcons.js'

const { t } = useI18n()
const cardRef = ref(null)
const isCollapsed = ref(false)

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

const props = defineProps({
  bonusValue: {
    type: Number,
    default: 0
  },
  monthlyBonus: {
    type: Number,
    default: 0
  },
  quarterlyBonus: {
    type: Number,
    default: 0
  }
})

// Limits for progress bars
const MONTHLY_LIMIT = 500000 // 500K so'm
const QUARTERLY_LIMIT = 1500000 // 1.5M so'm

// Computed progress percentages
const monthlyProgressPercent = computed(() => {
  const percent = (props.monthlyBonus / MONTHLY_LIMIT) * 100
  return Math.min(100, percent)
})

const quarterlyProgressPercent = computed(() => {
  const percent = (props.quarterlyBonus / QUARTERLY_LIMIT) * 100
  return Math.min(100, percent)
})

/**
 * Format number with space for thousands
 * Returns natural number (integer only)
 * Example: 7093.95 → "7 093"
 */
const formatNumber = (num) => {
  if (typeof num !== 'number' || isNaN(num)) return '0'

  // Convert to natural number (integer)
  const integer = Math.floor(num).toString()

  // Add space as thousand separator
  const integerFormatted = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

  return integerFormatted
}



</script>

<style scoped>
.uy-bonus {
  margin: 0 0 32px;
  border-radius: 26px;
  background: linear-gradient(100deg, #FF5A1F 0%, #FF9A72 100%);
  box-shadow: 0 12px 28px rgba(255, 90, 31, 0.28);
  color: #fff;
  font-family: var(--uy-font);
  overflow: hidden;
}

.uy-bonus-head {
  width: 100%;
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 28px;
  background: none;
  border: 0;
  color: inherit;
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.uy-bonus-text { display: flex; flex-direction: column; gap: 8px; }

.uy-bonus-label {
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 1.1px;
  text-transform: uppercase;
  opacity: 0.88;
}

.uy-bonus-value {
  font-size: 44px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.5px;
}
.uy-bonus-value small {
  margin-left: 6px;
  font-size: 18px;
  font-weight: 900;
  letter-spacing: 0;
}

.uy-bonus-toggle {
  flex-shrink: 0;
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.25);
  transition: transform 0.25s ease;
}
.uy-bonus.open .uy-bonus-toggle { transform: rotate(180deg); }

.uy-bonus-details {
  display: grid;
  gap: 14px;
  margin: 0 16px 16px;
  padding: 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.16);
}

.uy-bonus-row { display: grid; grid-template-columns: 1fr auto; gap: 6px 10px; align-items: center; }
.uy-bonus-row-head { grid-column: 1 / -1; display: flex; justify-content: space-between; font-size: 14px; font-weight: 700; }
.uy-bonus-row-head strong { font-weight: 900; }
.uy-progress { height: 8px; border-radius: 4px; background: rgba(255, 255, 255, 0.3); overflow: hidden; }
.uy-progress-fill { height: 100%; border-radius: 4px; background: #fff; transition: width 0.4s ease; }
.uy-bonus-percent { font-size: 12px; font-weight: 800; opacity: 0.9; min-width: 36px; text-align: right; }
</style>
