<!-- src/views/auth/LoginView.vue -->
<template>
  <div class="login-container">
    <div class="login-content">
      <div class="login-card">
        <div class="logo-container">
          <div class="app-logo">
            <!-- Logo aplikasi -->
            <div class="logo-placeholder">
              <span>SJ</span>
            </div>
          </div>
          <h1 class="welcome-text">Selamat Datang</h1>
          <p class="subtitle">Silakan masuk untuk melanjutkan</p>
        </div>

        <div v-if="errorMessage" class="alert-message">
          <div class="alert-icon">
            <i class="fas fa-exclamation-circle"></i>
          </div>
          <span>{{ errorMessage }}</span>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="username">Username</label>
            <div class="input-container">
              <span class="input-icon">
                <i class="fas fa-user"></i>
              </span>
              <input
                type="text"
                id="username"
                v-model="username"
                required
                autocomplete="username"
                placeholder="Masukkan username Anda"
              />
            </div>
          </div>

          <div class="form-group">
            <div class="password-header">
              <label for="password">Password</label>
              <!-- <a href="#" class="forgot-password">Lupa password?</a> -->
            </div>
            <div class="input-container">
              <span class="input-icon">
                <i class="fas fa-lock"></i>
              </span>
              <input
                :type="showPassword ? 'text' : 'password'"
                id="password"
                v-model="password"
                required
                autocomplete="current-password"
                placeholder="Masukkan password Anda"
              />
              <span class="toggle-password" @click="showPassword = !showPassword">
                <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </span>
            </div>
          </div>

          <div class="remember-me">
            <label class="checkbox-container">
              <input type="checkbox" v-model="rememberMe" />
              <span class="checkmark"></span>
              <span class="checkbox-label">Ingat saya</span>
            </label>
          </div>

          <button type="submit" class="login-button" :disabled="isLoading">
            <span v-if="isLoading" class="spinner"></span>
            <span>{{ isLoading ? 'Sedang Memproses...' : 'Masuk' }}</span>
          </button>
        </form>
        
        <!-- <div class="login-footer">
          <p>Belum punya akun? <a href="#" class="register-link">Daftar sekarang</a></p>
        </div> -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const username = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)
const showPassword = ref(false)
const rememberMe = ref(false)

const router = useRouter()
const authStore = useAuthStore()

async function handleLogin() {
  if (!username.value || !password.value) {
    errorMessage.value = 'Username dan password harus diisi'
    return
  }
  
  try {
    isLoading.value = true
    errorMessage.value = ''
    
    // Tambahkan rememberMe ke parameter jika diperlukan
    const success = await authStore.login(username.value, password.value, rememberMe.value)
    
    if (success) {
      router.push({ name: 'dashboard' })
    } else {
      errorMessage.value = 'Username atau password salah'
    }
  } catch (error) {
    console.error('Login error:', error)
    errorMessage.value = 'Terjadi kesalahan saat login'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* Font import - Tambahkan di file CSS utama jika belum ada */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
/* Font Awesome untuk ikon - Tambahkan di file index.html atau CSS utama */
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');

.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #4b6cb7 0%, #182848 100%);
  font-family: 'Poppins', sans-serif;
}

.login-content {
  width: 100%;
  max-width: 450px;
  padding: 20px;
}

.login-card {
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
  padding: 40px;
  transition: transform 0.3s, box-shadow 0.3s;
}

.login-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 16px 35px rgba(0, 0, 0, 0.2);
}

.logo-container {
  text-align: center;
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.app-logo {
  margin-bottom: 5px;
}

.logo-placeholder {
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #6e8efb 0%, #4a6cf7 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.logo-placeholder span {
  color: white;
  font-weight: 700;
  font-size: 24px;
  letter-spacing: 0.5px;
}

.welcome-text {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
  margin-top: 15px;
}

.subtitle {
  color: #777;
  font-size: 14px;
  margin-bottom: 0;
}

.alert-message {
  display: flex;
  align-items: center;
  background-color: #fff6f6;
  border-left: 4px solid #d92550;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #d92550;
}

.alert-icon {
  margin-right: 10px;
  font-size: 16px;
}

.login-form {
  margin-bottom: 25px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #555;
}

.password-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.forgot-password {
  font-size: 13px;
  color: #4a6cf7;
  text-decoration: none;
  transition: color 0.2s;
}

.forgot-password:hover {
  color: #3653c8;
  text-decoration: underline;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 15px;
  color: #aaa;
  font-size: 14px;
}

.input-container input {
  width: 100%;
  padding: 14px 14px 14px 45px;
  border: 1px solid #e1e1e1;
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.3s;
  background-color: #f9f9f9;
}

.input-container input:focus {
  border-color: #4a6cf7;
  box-shadow: 0 0 0 2px rgba(74, 108, 247, 0.2);
  background-color: #fff;
  outline: none;
}

.input-container input::placeholder {
  color: #bbb;
}

.toggle-password {
  position: absolute;
  right: 15px;
  color: #aaa;
  cursor: pointer;
  font-size: 14px;
  transition: color 0.2s;
}

.toggle-password:hover {
  color: #555;
}

.remember-me {
  margin-bottom: 25px;
  display: flex;
  align-items: center;
}

.checkbox-container {
  display: flex;
  align-items: center;
  position: relative;
  cursor: pointer;
  user-select: none;
}

.checkbox-container input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  height: 18px;
  width: 18px;
  background-color: #f9f9f9;
  border: 1px solid #e1e1e1;
  border-radius: 4px;
  transition: all 0.2s;
}

.checkbox-container input:checked ~ .checkmark {
  background-color: #4a6cf7;
  border-color: #4a6cf7;
}

.checkmark:after {
  content: "\f00c";
  font-family: "Font Awesome 6 Free";
  font-weight: 900;
  color: white;
  font-size: 10px;
  position: absolute;
  top: 1px;
  left: 4px;
  display: none;
}

.checkbox-container input:checked ~ .checkmark:after {
  display: block;
}

.checkbox-label {
  margin-left: 8px;
  font-size: 14px;
  color: #666;
}

.login-button {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #6e8efb 0%, #4a6cf7 100%);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 15px;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(74, 108, 247, 0.3);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  margin-right: 10px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.login-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #666;
}

.register-link {
  color: #4a6cf7;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.register-link:hover {
  color: #3653c8;
  text-decoration: underline;
}

/* Responsif */
@media (max-width: 480px) {
  .login-card {
    padding: 30px 20px;
  }
  
  .welcome-text {
    font-size: 22px;
  }
  
  .input-container input {
    padding: 12px 12px 12px 40px;
  }
  
  .login-button {
    padding: 12px;
  }
}
</style>