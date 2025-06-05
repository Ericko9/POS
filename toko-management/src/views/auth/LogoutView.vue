<!-- src/views/auth/LogoutView.vue -->
<template>
    <div class="logout-container">
      <div class="logout-card card shadow-sm">
        <div class="card-body p-5 text-center">
          <div class="spinner-border text-primary mb-4" role="status" v-if="isLoggingOut">
            <span class="visually-hidden">Loading...</span>
          </div>
          <h2 class="mb-4">{{ message }}</h2>
          <p class="mb-4">{{ submessage }}</p>
          <router-link to="/login" class="btn btn-primary">
            Kembali ke Login
          </router-link>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '../../stores/auth'
  
  const router = useRouter()
  const authStore = useAuthStore()
  
  const isLoggingOut = ref(true)
  const message = ref('Sedang logout...')
  const submessage = ref('Mohon tunggu sebentar')
  
  onMounted(async () => {
    try {
      await authStore.logout()
      isLoggingOut.value = false
      message.value = 'Berhasil Logout'
      submessage.value = 'Terima kasih telah menggunakan aplikasi kami'
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push({ name: 'login' })
      }, 2000)
    } catch (error) {
      console.error('Logout error:', error)
      isLoggingOut.value = false
      message.value = 'Terjadi kesalahan'
      submessage.value = 'Gagal logout dari sistem'
    }
  })
  </script>
  
  <style scoped>
  .logout-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f8f9fa;
  }
  
  .logout-card {
    width: 100%;
    max-width: 420px;
    border-radius: 8px;
  }
  </style>