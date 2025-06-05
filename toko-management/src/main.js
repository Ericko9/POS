// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

// Konfigurasi axios
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Inisialisasi aplikasi
const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app')