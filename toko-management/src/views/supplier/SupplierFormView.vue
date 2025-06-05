<!-- src/views/supplier/SupplierFormView.vue -->
<template>
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1>{{ isEdit ? 'Edit' : 'Tambah' }} Supplier</h1>
        <router-link to="/supplier" class="btn btn-outline-secondary">
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
          <form @submit.prevent="saveSupplier">
            <div class="row">
              <!-- Basic Information -->
              <div class="col-md-6">
                <h5 class="mb-3">Informasi Supplier</h5>
                
                <div class="mb-3">
                  <label for="nama" class="form-label">Nama Supplier <span class="text-danger">*</span></label>
                  <input 
                    type="text" 
                    class="form-control" 
                    id="nama" 
                    v-model="form.nama" 
                    required
                  />
                </div>
                
                <div class="mb-3">
                  <label for="alamat" class="form-label">Alamat</label>
                  <textarea 
                    class="form-control" 
                    id="alamat" 
                    v-model="form.alamat" 
                    rows="3"
                  ></textarea>
                </div>
              </div>
              
              <!-- Contact Information -->
              <div class="col-md-6">
                <h5 class="mb-3">Informasi Kontak</h5>
                
                <div class="mb-3">
                  <label for="noHp" class="form-label">Nomor HP</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    id="noHp" 
                    v-model="form.noHp"
                  />
                </div>
                
                <div class="mb-3">
                  <label for="email" class="form-label">Email</label>
                  <input 
                    type="email" 
                    class="form-control" 
                    id="email" 
                    v-model="form.email"
                  />
                </div>
              </div>
              
              <!-- Performance Notes -->
              <div class="col-12 mt-4">
                <h5 class="mb-3">Catatan Kinerja</h5>
                
                <div class="mb-3">
                  <label for="catatanKinerja" class="form-label">Catatan</label>
                  <textarea 
                    class="form-control" 
                    id="catatanKinerja" 
                    v-model="form.catatanKinerja" 
                    rows="5"
                    placeholder="Catatan tentang kinerja supplier, kendala, atau informasi penting lainnya..."
                  ></textarea>
                </div>
              </div>
              
              <!-- Submit Buttons -->
              <div class="col-12 mt-4">
                <div class="d-flex justify-content-end">
                  <router-link to="/supplier" class="btn btn-secondary me-2">
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
  
  // Form data
  const form = ref({
    nama: '',
    alamat: '',
    noHp: '',
    email: '',
    catatanKinerja: ''
  })
  
  // Alert message
  const alert = ref({
    show: false,
    type: 'success',
    message: ''
  })
  
  // Fetch supplier if editing
  async function fetchSupplier() {
    if (!isEdit.value) {
      isLoading.value = false
      return
    }
    
    try {
      isLoading.value = true
      const response = await axios.get(`/api/supplier/${route.params.id}`)
      const supplier = response.data
      
      form.value = {
        nama: supplier.nama,
        alamat: supplier.alamat || '',
        noHp: supplier.noHp || '',
        email: supplier.email || '',
        catatanKinerja: supplier.catatanKinerja || ''
      }
    } catch (error) {
      showAlert('danger', 'Gagal memuat data supplier')
      console.error('Error fetching supplier:', error)
    } finally {
      isLoading.value = false
    }
  }
  
  // Save supplier
  async function saveSupplier() {
    try {
      isSaving.value = true
      
      if (isEdit.value) {
        await axios.put(`/api/supplier/${route.params.id}`, form.value)
        showAlert('success', 'Supplier berhasil diperbarui')
      } else {
        await axios.post('/api/supplier', form.value)
        showAlert('success', 'Supplier berhasil ditambahkan')
      }
      
      setTimeout(() => {
        router.push('/supplier')
      }, 1500)
    } catch (error) {
      const message = error.response?.data?.message || 'Terjadi kesalahan saat menyimpan supplier'
      showAlert('danger', message)
      console.error('Error saving supplier:', error)
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
    fetchSupplier()
  })
  </script>