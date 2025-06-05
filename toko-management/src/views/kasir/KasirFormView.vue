<!-- src/views/kasir/KasirFormView.vue -->
<template>
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1>{{ isEdit ? 'Edit' : 'Tambah' }} Kasir</h1>
        <router-link to="/kasir" class="btn btn-outline-secondary">
          <i class="bi bi-arrow-left me-2"></i> Kembali
        </router-link>
      </div>
      
      <!-- Alert Status -->
      <div v-if="alert.show" :class="`alert alert-${alert.type} alert-dismissible fade show`" role="alert">
        {{ alert.message }}
        <button type="button" class="btn-close" @click="alert.show = false"></button>
      </div>
      
      <!-- Loading Indicator -->
      <div v-if="isLoading" class="text-center my-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Memuat data...</p>
      </div>
      
      <!-- Form -->
      <div v-else class="card">
        <div class="card-body">
          <form @submit.prevent="saveKasir">
            <div class="row">
              <!-- Basic Information -->
              <div class="col-md-6">
                <h5 class="mb-3">Informasi Dasar</h5>
                
                <div class="mb-3">
                  <label for="nama" class="form-label">Nama Lengkap <span class="text-danger">*</span></label>
                  <input 
                    type="text" 
                    class="form-control" 
                    id="nama" 
                    v-model="form.nama" 
                    required
                  />
                </div>
                
                <div class="mb-3">
                  <label for="username" class="form-label">Username <span class="text-danger">*</span></label>
                  <input 
                    type="text" 
                    class="form-control" 
                    id="username" 
                    v-model="form.username" 
                    required
                    :disabled="isEdit"
                  />
                  <div v-if="isEdit" class="form-text text-muted">
                    Username tidak dapat diubah.
                  </div>
                </div>
                
                <div class="mb-3">
                  <label for="password" class="form-label">
                    {{ isEdit ? 'Password Baru (Kosongkan jika tidak ingin mengubah)' : 'Password' }}
                    <span v-if="!isEdit" class="text-danger">*</span>
                  </label>
                  <div class="input-group">
                    <input 
                      :type="showPassword ? 'text' : 'password'" 
                      class="form-control" 
                      id="password" 
                      v-model="form.password" 
                      :required="!isEdit"
                      autocomplete="new-password"
                    />
                    <button 
                      class="btn btn-outline-secondary" 
                      type="button"
                      @click="showPassword = !showPassword"
                    >
                      <i :class="`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`"></i>
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Contact Information -->
              <div class="col-md-6">
                <h5 class="mb-3">Informasi Kontak</h5>
                
                <div class="mb-3">
                  <label for="email" class="form-label">Email</label>
                  <input 
                    type="email" 
                    class="form-control" 
                    id="email" 
                    v-model="form.email"
                  />
                </div>
                
                <div class="mb-3">
                  <label for="noHp" class="form-label">Nomor HP</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    id="noHp" 
                    v-model="form.noHp"
                  />
                </div>
              </div>
              
              <!-- Performance Notes -->
              <div class="col-12 mt-4">
                <h5 class="mb-3">Catatan Kinerja</h5>
                
                <div class="mb-3">
                  <label for="catatan" class="form-label">Catatan</label>
                  <textarea 
                    class="form-control" 
                    id="catatan" 
                    v-model="form.catatan" 
                    rows="5"
                    placeholder="Catatan tentang kinerja kasir, kehadiran, atau informasi penting lainnya..."
                  ></textarea>
                </div>
              </div>
              
              <!-- Submit Buttons -->
              <div class="col-12 mt-4">
                <div class="d-flex justify-content-end">
                  <router-link to="/kasir" class="btn btn-secondary me-2">
                    Batal
                  </router-link>
                  <button type="submit" class="btn btn-primary" :disabled="isSaving">
                    <span v-if="isSaving" class="spinner-border spinner-border-sm me-2"></span>
                    {{ isSaving ? 'Menyimpan...' : 'Simpan' }}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import axios from 'axios'
  
  const route = useRoute()
  const router = useRouter()
  const isEdit = computed(() => route.params.id !== undefined)
  
  // Data
  const isLoading = ref(true)
  const isSaving = ref(false)
  const showPassword = ref(false)
  
  // Form data
  const form = ref({
    nama: '',
    username: '',
    password: '',
    email: '',
    noHp: '',
    catatan: ''
  })
  
  // Alert message
  const alert = ref({
    show: false,
    type: 'success',
    message: ''
  })
  
  // Fetch kasir if editing
  async function fetchKasir() {
    if (!isEdit.value) {
      isLoading.value = false
      return
    }
    
    try {
      isLoading.value = true
      const response = await axios.get(`/api/kasir/${route.params.id}`)
      const kasir = response.data
      
      form.value = {
        nama: kasir.nama,
        username: kasir.username,
        password: '', // Don't show password
        email: kasir.email || '',
        noHp: kasir.noHp || '',
        catatan: kasir.catatan || ''
      }
    } catch (error) {
      showAlert('danger', 'Gagal memuat data kasir')
      console.error('Error fetching kasir:', error)
    } finally {
      isLoading.value = false
    }
  }
  
  // Save kasir
  async function saveKasir() {
    try {
      isSaving.value = true
      
      // Create copy of form data
      const kasirData = { ...form.value }
      
      // Remove password if empty in edit mode
      if (isEdit.value && !kasirData.password) {
        delete kasirData.password
      }
      
      if (isEdit.value) {
        await axios.put(`/api/kasir/${route.params.id}`, kasirData)
        showAlert('success', 'Kasir berhasil diperbarui')
      } else {
        await axios.post('/api/kasir', kasirData)
        showAlert('success', 'Kasir berhasil ditambahkan')
      }
      
      setTimeout(() => {
        router.push('/kasir')
      }, 1500)
    } catch (error) {
      const message = error.response?.data?.message || 'Terjadi kesalahan saat menyimpan kasir'
      showAlert('danger', message)
      console.error('Error saving kasir:', error)
    } finally {
      isSaving.value = false
    }
  }
  
  // Show alert
  function showAlert(type, message) {
    alert.value = {
      show: true,
      type,
      message
    }
  }
  
  onMounted(() => {
    fetchKasir()
  })
  </script>