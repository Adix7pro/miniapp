<template>
  <div class="bonus-card-container">
    <div 
      ref="cardRef"
      class="bonus-card-tilt"
      data-tilt>
    <!-- Main bonus value (clickable to expand/collapse) -->
    <div class="bonus-header" @click="toggleCollapse" style="cursor: pointer;">
      <div>
        <div class="bonus-main-label">{{ t('total_bonus') || 'Jami bonus' }}</div>
        <div class="bonus-main-value">{{ formatNumber(bonusValue) }} <span style="font-size: 16px;">{{ t('sum') || 'so\'m' }}</span></div>
      </div>
      <div class="expand-icon" :class="{ expanded: !isCollapsed }">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
    </div>

    <!-- Categories breakdown (collapsible) -->
    <div v-show="isCollapsed" class="bonus-categories">
      <!-- Monthly bonus -->
      <div class="bonus-category">
        <div class="category-header">
          <div class="category-label">{{ t('monthly_bonus') || 'Oylik' }}</div>
          <div class="category-value">{{ formatNumber(monthlyBonus) }}</div>
        </div>
        <div class="progress-bar-wrapper">
          <div class="progress-bar">
            <div 
              class="progress-fill progress-monthly" 
              :style="{ width: monthlyProgressPercent + '%' }">
            </div>
          </div>
          <div class="progress-label">{{ monthlyProgressPercent.toFixed(0) }}%</div>
        </div>
      </div>

      <!-- Quarterly bonus -->
      <div class="bonus-category">
        <div class="category-header">
          <div class="category-label">{{ t('quarterly_bonus') || 'Choraklik' }}</div>
          <div class="category-value">{{ formatNumber(quarterlyBonus) }}</div>
        </div>
        <div class="progress-bar-wrapper">
          <div class="progress-bar">
            <div 
              class="progress-fill progress-quarterly" 
              :style="{ width: quarterlyProgressPercent + '%' }">
            </div>
          </div>
          <div class="progress-label">{{ quarterlyProgressPercent.toFixed(0) }}%</div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import VanillaTilt from 'vanilla-tilt'

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
/* Perspective container for 3D effect */
.bonus-card-container {
  perspective: 1000px;
  transform-style: preserve-3d;
  margin-top: 0px;
}

.bonus-card-tilt {
  transform-style: preserve-3d;
  transition: transform 0.3s ease;
  width: 100%;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  color: #333;
}

/* Main bonus header */
.bonus-header {
  margin: -20px -20px 16px -20px;
  padding: 24px 20px;
  background: linear-gradient(135deg, #ff5722 0%, #ffb26e 100%);
  border-radius: 12px 12px 0 0;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: opacity 0.3s ease;
}

.bonus-header:hover {
  opacity: 0.95;
}

.bonus-header::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}

.bonus-main-label {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 8px;
  position: relative;
  z-index: 1;
}

.bonus-main-value {
  font-size: 36px;
  font-weight: 700;
  color: white;
  letter-spacing: -0.5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  position: relative;
  z-index: 1;
}

/* Expand/Collapse icon */
.expand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
  flex-shrink: 0;
  margin-left: 12px;
}

.expand-icon.expanded {
  transform: rotate(180deg);
}

/* Categories breakdown */
.bonus-categories {
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.bonus-category {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.category-label {
  font-size: 13px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.7);
}

.category-value {
  font-size: 15px;
  font-weight: 700;
  color: #333;
}

/* Progress bar styles */
.progress-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-monthly {
  background: linear-gradient(90deg, #ff5722, #ffb26e);
}

.progress-quarterly {
  background: linear-gradient(90deg, #ff9100, #ffcc80);
}

.progress-label {
  font-size: 12px;
  font-weight: 700;
  color: #ff5722;
  min-width: 32px;
  text-align: right;
}

/* Responsive design */
@media (max-width: 480px) {
  .bonus-card-container {
    padding: 16px;
  }

  .bonus-main-value {
    font-size: 28px;
  }

  .bonus-categories {
    gap: 10px;
  }

  .category-label {
    font-size: 12px;
  }

  .category-value {
    font-size: 13px;
  }
}
</style>
