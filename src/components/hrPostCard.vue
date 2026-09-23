<template>
  <div class="hr-post-card" >
    <!-- Header with status badge -->
    <div class="hr-post-header" style="">
      <div class="hr-post-title">{{ post.title }}</div>
      <span v-if="post.status" class="status-badge" :class="`status-${post.status}`">
        {{ statusLabel }}
      </span>
    </div>

    <!-- Post meta information -->
    <div class="hr-post-meta">
      <div class="meta-item">
        <i class="bi bi-briefcase meta-icon"></i>
        <span class="meta-value">{{ post.department || 'HR' }}</span>
      </div>
      <div class="meta-item">
        <i class="bi bi-calendar meta-icon"></i>
        <span class="meta-value">{{ formatDate(post.date) }}</span>
      </div>
    </div>

    <!-- Content preview -->
    <div class="hr-post-content">
      <p class="content-line">{{ post.content }}</p>
    </div>

    <!-- Job Details -->
    <div v-if="post.position || post.sex || post.age || post.salary" class="job-details">
      <div v-if="post.position" class="detail-item">
        <i class="bi bi-briefcase-fill detail-icon"></i>
        <div class="detail-content">
          <span class="detail-label">{{ t('position') }}</span>
          <span class="detail-value">{{ post.position }}</span>
        </div>
      </div>
      <div v-if="post.sex" class="detail-item">
        <i class="bi bi-person detail-icon"></i>
        <div class="detail-content">
          <span class="detail-label">{{ t('sex') }}</span>
          <span class="detail-value">{{ post.sex }}</span>
        </div>
      </div>
      <div v-if="post.age" class="detail-item">
        <i class="bi bi-calendar-event detail-icon"></i>
        <div class="detail-content">
          <span class="detail-label">{{ t('age') }}</span>
          <span class="detail-value">{{ post.age }}</span>
        </div>
      </div>
      <div v-if="post.salary" class="detail-item">
        <i class="bi bi-cash-coin detail-icon"></i>
        <div class="detail-content">
          <span class="detail-label">{{ t('salary') }}</span>
          <span class="detail-value">{{ post.salary }} so'm</span>
        </div>
      </div>
    </div>

    <!-- Action buttons -->
    <div class="hr-post-actions">
      <button class="action-btn secondary-btn" @click="goChat()">
        <i class="bi bi-telegram"></i>
        {{ t('go_chat') || 'Chat bilan bog\'lanish' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  post: {
    type: Object,
    required: false,
    validator: (post) => {
      return post.title && post.date && post.content
    }
  },
  maxContentLength: {
    type: Number,
    default: 150
  }
})

const emit = defineEmits(['view', 'apply'])

// Truncate content for preview
const truncatedContent = computed(() => {
  if (props.post.content.length > props.maxContentLength) {
    return props.post.content.substring(0, props.maxContentLength) + '...'
  }
  return props.post.content
})

// Split content into lines for better display
const contentLines = computed(() => {
  return props.post.content.split('\n').filter(line => line.trim() !== '')
})

// Status label translation
const statusLabel = computed(() => {
  const statusMap = {
    urgent: t('urgent') || 'Shoshilinch',
    active: t('active') || 'Faol',
    closed: t('closed') || 'Yopiq',
    draft: t('draft') || 'Draft'
  }
  return statusMap[props.post.status] || props.post.status
})

const goChat = () => {
  const telegramLink = 'https://t.me/Uyda_hr'
  
  // Check if running in Telegram Web App
  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.openTelegramLink(telegramLink)
  } else {
    // Fallback for non-Telegram environment
    window.open(telegramLink, '_blank')
  }
}

// Format date
const formatDate = (date) => {
  if (!date) return ''
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
.hr-post-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border-left: 4px solid #ff5722;
}

.hr-post-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

/* Header Section */
.hr-post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 8px;
}

.hr-post-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  flex: 1;
  line-height: 1.4;
}

/* Status Badge */
.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  text-transform: uppercase;
}

.status-urgent {
  background: #ffebee;
  color: #c62828;
}

.status-active {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-closed {
  background: #f5f5f5;
  color: #616161;
}

.status-draft {
  background: #fff3e0;
  color: #e65100;
}

/* Meta Information */
.hr-post-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  font-size: 13px;
  color: #666;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-icon {
  font-size: 16px;
  color: #ff5722;
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.meta-value {
  color: #555;
}

/* Content Preview */
.hr-post-content {
  margin-bottom: 14px;
  line-height: 1.5;
  color: #444;
  font-size: 13px;
}

.hr-post-content p {
  margin: 0;
  padding: 4px 0;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.content-line {
  display: block !important;
}

/* Job Details Section */
.job-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 14px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-icon {
  font-size: 16px;
  color: #ff5722;
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-label {
  font-size: 11px;
  color: #999;
  font-weight: 500;
  text-transform: uppercase;
}

.detail-value {
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

/* Action Buttons */
.hr-post-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.action-btn {
  flex: 1;
  padding: 10px 12px;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.action-btn i {
  font-size: 14px;
}

.primary-btn {
  background: linear-gradient(135deg, #ff5722 0%, #ff7043 100%);
  color: white;
}

.primary-btn:active {
  transform: scale(0.98);
}

.secondary-btn {
  background: #f5f5f5;
  color: #ff5722;
  border: 1px solid #ff5722;
}

.secondary-btn:active {
  background: #ffe0d2;
}

.applied-badge {
  flex: 1;
  padding: 10px 12px;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.applied-badge i {
  font-size: 14px;
}

/* Responsive Design */
@media (max-width: 480px) {
  .hr-post-card {
    padding: 12px;
  }

  .hr-post-title {
    font-size: 14px;
  }

  .hr-post-actions {
    flex-direction: column;
  }

  .action-btn,
  .applied-badge {
    width: 100%;
  }
}
</style>
