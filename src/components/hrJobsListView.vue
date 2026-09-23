<template>
  <div class="jobs-container" style="margin-top: 20px;">
    <div class="jobs-header">
      <h2>{{ t('vacancies') }}</h2>
    </div>
    
    <div v-if="loading" class="loading">
      <LoadingSpinner />
    </div>
    
    <div v-else-if="error" class="error-message">
      <p>{{ t('error_generic') }}: {{ error }}</p>
    </div>
    
    <div v-else-if="jobs.length > 0" class="jobs-list">
      <hrPostCard 
        v-for="job in jobs" 
        :key="job._id"
        :post="transformJobData(job)"
        :maxContentLength="500"
        @view="viewJobDetails(job)"
        @apply="applyForJob(job)"
      />
    </div>
    
    <div v-else class="no-jobs">
      <p>{{ t('no_vacancies') }}</p>
    </div>
  </div>
</template>

<script>
import LoadingSpinner from './LoadingSpinner.vue';
import hrPostCard from './hrPostCard.vue';
import { t, getStoredLang } from '../variable/i18n.js';
import axios from 'axios';

export default {
  components: {
    LoadingSpinner,
    hrPostCard
  },
  data() {
    return {
      jobs: [],
      loading: false,
      lang: getStoredLang(),
      error: null
    };
  },
  mounted() {
    this.fetchJobs();
  },
  methods: {
    t(key) {
      return t(key, this.lang);
    },
    fetchJobs() {
      this.loading = true;
      this.error = null;
      
      axios.get('https://hr.erkaboyev.uz/api/posts/')
        .then(response => {
          if (response.data && response.data.data) {
            this.jobs = response.data.data;
          } else if (Array.isArray(response.data)) {
            this.jobs = response.data;
          }
          this.loading = false;
        })
        .catch(error => {
          console.error('Error fetching jobs:', error);
          this.error = error.message;
          this.loading = false;
          // Fallback to empty array
          this.jobs = [];
        });
    },
    transformJobData(job) {
      return {
        title: job.title,
        date: job.createdAt,
        department: job.position,
        content: job.description,
        status: job.status,
        isApplied: false,
        sex: job.sex,
        age: job.age,
        position: job.position,
        salary: this.formatSalary(job.salary)
      };
    },
    viewJobDetails(job) {
      console.log('Job details:', job);
      // Implement view details functionality
    },
    applyForJob(job) {
      console.log('Apply for job:', job);
      // Implement apply functionality
    },
    formatSalary(salary) {
      return new Intl.NumberFormat('uz-UZ').format(salary);
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('uz-UZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }
};
</script>

<style scoped>
.jobs-container {
  padding: 16px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.jobs-header {
  margin-bottom: 20px;
}

.jobs-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

.error-message {
  background: #ffebee;
  border: 1px solid #ef5350;
  border-radius: 8px;
  padding: 16px;
  color: #c62828;
  margin-bottom: 16px;
}

.error-message p {
  margin: 0;
  font-size: 14px;
}

.jobs-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.no-jobs {
  background: white;
  border-radius: 8px;
  padding: 40px 16px;
  text-align: center;
  color: #999;
}

@media (max-width: 640px) {
  .jobs-container {
    padding: 12px;
  }

  .jobs-list {
    gap: 10px;
  }
}
</style>
