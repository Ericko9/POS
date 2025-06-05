<template>
  <div class="profile-container">
    <div class="profile-card">
      <h1 class="profile-title">Profil Saya</h1>
      
      <!-- Profile Form -->
      <form @submit.prevent="handleSave" class="profile-form">
        <div class="form-group">
          <label>Username</label>
          <input type="text" v-model="form.username" disabled />
        </div>
        <div class="form-group">
          <label>Nama</label>
          <input type="text" v-model="form.nama" required />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" v-model="form.email" />
        </div>
        <div class="form-group">
          <label>No HP</label>
          <input type="text" v-model="form.noHp" />
        </div>
        <div class="form-group">
          <label>Role</label>
          <input type="text" v-model="form.role" disabled />
        </div>
        <div class="form-actions">
          <button type="submit" class="save-btn" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            <span>{{ loading ? 'Menyimpan...' : 'Simpan Perubahan' }}</span>
          </button>
        </div>
        <div v-if="successMessage" class="alert success">{{ successMessage }}</div>
        <div v-if="errorMessage" class="alert error">{{ errorMessage }}</div>
      </form>

      <!-- Password Form -->
      <div class="divider">
        <span>Ubah Password</span>
      </div>
      
      <form @submit.prevent="handlePasswordChange" class="password-form">
        <div class="form-group">
          <label>Password Lama</label>
          <div class="password-input">
            <input 
              :type="showCurrentPassword ? 'text' : 'password'" 
              v-model="passwordForm.currentPassword" 
              required 
            />
            <button 
              type="button" 
              class="toggle-password" 
              @click="showCurrentPassword = !showCurrentPassword"
            >
              <i :class="showCurrentPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
        </div>
        <div class="form-group">
          <label>Password Baru</label>
          <div class="password-input">
            <input 
              :type="showNewPassword ? 'text' : 'password'" 
              v-model="passwordForm.newPassword" 
              required 
            />
            <button 
              type="button" 
              class="toggle-password" 
              @click="showNewPassword = !showNewPassword"
            >
              <i :class="showNewPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
        </div>
        <div class="form-group">
          <label>Konfirmasi Password Baru</label>
          <div class="password-input">
            <input 
              :type="showConfirmPassword ? 'text' : 'password'" 
              v-model="passwordForm.confirmPassword" 
              required 
            />
            <button 
              type="button" 
              class="toggle-password" 
              @click="showConfirmPassword = !showConfirmPassword"
            >
              <i :class="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" class="save-btn" :disabled="passwordLoading">
            <span v-if="passwordLoading" class="spinner"></span>
            <span>{{ passwordLoading ? 'Menyimpan...' : 'Ubah Password' }}</span>
          </button>
        </div>
        <div v-if="passwordSuccessMessage" class="alert success">{{ passwordSuccessMessage }}</div>
        <div v-if="passwordErrorMessage" class="alert error">{{ passwordErrorMessage }}</div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const form = ref({
  username: '',
  nama: '',
  email: '',
  noHp: '',
  role: ''
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const loading = ref(false)
const passwordLoading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const passwordSuccessMessage = ref('')
const passwordErrorMessage = ref('')

// Password visibility toggles
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

async function fetchProfile() {
  try {
    const res = await axios.get('/api/profil')
    form.value = {
      username: res.data.username || '',
      nama: res.data.nama || '',
      email: res.data.email || '',
      noHp: res.data.noHp || '',
      role: res.data.role || ''
    }
  } catch (err) {
    errorMessage.value = 'Gagal mengambil data profil.'
  }
}

async function handleSave() {
  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''
  try {
    const { nama, email, noHp } = form.value
    const res = await axios.put('/api/profil', { nama, email, noHp })
    successMessage.value = res.data.message || 'Profil berhasil diperbarui.'
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Gagal memperbarui profil.'
  } finally {
    loading.value = false
  }
}

async function handlePasswordChange() {
  // Validate passwords
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordErrorMessage.value = 'Password baru dan konfirmasi password tidak sesuai'
    return
  }

  if (passwordForm.value.newPassword.length < 6) {
    passwordErrorMessage.value = 'Password baru minimal 6 karakter'
    return
  }

  passwordLoading.value = true
  passwordSuccessMessage.value = ''
  passwordErrorMessage.value = ''
  
  try {
    const { currentPassword, newPassword } = passwordForm.value
    const res = await axios.put('/api/profil/password', { 
      currentPassword, 
      newPassword 
    })
    passwordSuccessMessage.value = res.data.message || 'Password berhasil diperbarui'
    // Clear form
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  } catch (err) {
    passwordErrorMessage.value = err.response?.data?.message || 'Gagal mengubah password'
  } finally {
    passwordLoading.value = false
  }
}

onMounted(() => {
  fetchProfile()
})
</script>

<style scoped>
.profile-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  background: linear-gradient(135deg, #4b6cb7 0%, #182848 100%);
  padding: 40px 20px;
}

.profile-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.10);
  padding: 40px 32px;
  min-width: 340px;
  max-width: 400px;
  width: 100%;
}

.profile-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 24px;
  color: #3249c2;
  text-align: center;
}

.profile-form, .password-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 32px 0;
  color: #718096;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e2e8f0;
}

.divider span {
  padding: 0 16px;
  font-size: 14px;
  font-weight: 500;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #555;
}

.form-group input {
  padding: 10px 12px;
  border: 1px solid #e1e1e1;
  border-radius: 8px;
  font-size: 14px;
  background: #f9f9f9;
  transition: border 0.2s;
}

.form-group input:focus {
  border-color: #4361ee;
  outline: none;
  background: #fff;
}

.password-input {
  position: relative;
}

.toggle-password {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #718096;
  cursor: pointer;
  padding: 4px;
}

.toggle-password:hover {
  color: #4a5568;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.save-btn {
  background: linear-gradient(135deg, #6e8efb 0%, #4a6cf7 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.save-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 108, 247, 0.2);
}

.save-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #fff;
  border-top: 2px solid #6e8efb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.alert {
  margin-top: 16px;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
}

.success {
  background: #e6f9f0;
  color: #10b981;
}

.error {
  background: #fff6f6;
  color: #d92550;
}

@media (max-width: 480px) {
  .profile-container {
    padding: 20px 16px;
  }
  
  .profile-card {
    padding: 24px 20px;
  }
  
  .save-btn {
    width: 100%;
    justify-content: center;
  }
}
</style> 