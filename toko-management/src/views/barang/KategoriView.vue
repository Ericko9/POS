<!-- src/views/barang/KategoriView.vue -->
<template>
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1>Manajemen Kategori</h1>
        <button class="btn btn-primary" @click="openModal()">
          <i class="bi bi-plus-lg me-2"></i> Tambah Kategori
        </button>
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
      
      <!-- Kategori Table -->
      <div v-else class="card">
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Kategori</th>
                  <th>Deskripsi</th>
                  <th>Jumlah Barang</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(kategori, index) in kategoris" :key="kategori._id">
                  <td>{{ index + 1 }}</td>
                  <td>{{ kategori.nama }}</td>
                  <td>{{ kategori.deskripsi || '-' }}</td>
                  <td>{{ kategori.jumlahBarang || 0 }}</td>
                  <td>
                    <button class="btn btn-sm btn-outline-primary me-2" @click="openModal(kategori)">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" @click="confirmDelete(kategori)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
                <tr v-if="kategoris.length === 0">
                  <td colspan="5" class="text-center">Belum ada data kategori</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <!-- Modal Form -->
      <div class="modal fade" id="kategoriModal" tabindex="-1" aria-hidden="true" ref="modal">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ editMode ? 'Edit Kategori' : 'Tambah Kategori' }}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="saveKategori">
                <div class="mb-3">
                  <label for="nama" class="form-label">Nama Kategori</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    id="nama" 
                    v-model="form.nama" 
                    required
                  />
                </div>
                
                <div class="mb-3">
                  <label for="deskripsi" class="form-label">Deskripsi</label>
                  <textarea 
                    class="form-control" 
                    id="deskripsi" 
                    v-model="form.deskripsi" 
                    rows="3"
                  ></textarea>
                </div>
                
                <div class="text-end">
                  <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">Batal</button>
                  <button type="submit" class="btn btn-primary" :disabled="isSaving">
                    <span v-if="isSaving" class="spinner-border spinner-border-sm me-2"></span>
                    {{ isSaving ? 'Menyimpan...' : 'Simpan' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Delete Confirmation Modal -->
      <div class="modal fade" id="deleteModal" tabindex="-1" aria-hidden="true" ref="deleteModal">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Konfirmasi Hapus</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p>Apakah Anda yakin ingin menghapus kategori <strong>{{ selectedKategori?.nama }}</strong>?</p>
              <p class="text-danger">Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait.</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
              <button type="button" class="btn btn-danger" @click="deleteKategori" :disabled="isDeleting">
                <span v-if="isDeleting" class="spinner-border spinner-border-sm me-2"></span>
                {{ isDeleting ? 'Menghapus...' : 'Hapus' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import axios from 'axios'
  import * as bootstrap from 'bootstrap'
  
  // Data
  const kategoris = ref([])
  const isLoading = ref(true)
  const isSaving = ref(false)
  const isDeleting = ref(false)
  const editMode = ref(false)
  const selectedKategori = ref(null)
  
  // Bootstrap modal references
  const modal = ref(null)
  const deleteModal = ref(null)
  let modalInstance = null
  let deleteModalInstance = null
  
  // Form data
  const form = ref({
    nama: '',
    deskripsi: ''
  })
  
  // Alert message
  const alert = ref({
    show: false,
    type: 'success',
    message: ''
  })
  
  // Fetch all kategoris
  async function fetchKategoris() {
    try {
      isLoading.value = true
      const response = await axios.get('/api/kategori')
      kategoris.value = response.data
    } catch (error) {
      showAlert('danger', 'Gagal memuat data kategori')
      console.error('Error fetching kategoris:', error)
    } finally {
      isLoading.value = false
    }
  }
  
  // Open modal for create or edit
  function openModal(kategori = null) {
    resetForm()
    
    if (kategori) {
      editMode.value = true
      selectedKategori.value = kategori
      form.value = {
        nama: kategori.nama,
        deskripsi: kategori.deskripsi || ''
      }
    } else {
      editMode.value = false
      selectedKategori.value = null
    }
    
    modalInstance.show()
  }
  
  // Save kategori (create or update)
  async function saveKategori() {
    try {
      isSaving.value = true
      
      if (editMode.value) {
        await axios.put(`/api/kategori/${selectedKategori.value._id}`, form.value)
        showAlert('success', 'Kategori berhasil diperbarui')
      } else {
        await axios.post('/api/kategori', form.value)
        showAlert('success', 'Kategori berhasil ditambahkan')
      }
      
      await fetchKategoris()
      modalInstance.hide()
    } catch (error) {
      const message = error.response?.data?.message || 'Terjadi kesalahan saat menyimpan kategori'
      showAlert('danger', message)
      console.error('Error saving kategori:', error)
    } finally {
      isSaving.value = false
    }
  }
  
  // Confirm delete
  function confirmDelete(kategori) {
    selectedKategori.value = kategori
    deleteModalInstance.show()
  }
  
  // Delete kategori
  async function deleteKategori() {
    try {
      isDeleting.value = true
      await axios.delete(`/api/kategori/${selectedKategori.value._id}`)
      showAlert('success', 'Kategori berhasil dihapus')
      await fetchKategoris()
      deleteModalInstance.hide()
    } catch (error) {
      const message = error.response?.data?.message || 'Terjadi kesalahan saat menghapus kategori'
      showAlert('danger', message)
      console.error('Error deleting kategori:', error)
    } finally {
      isDeleting.value = false
    }
  }
  
  // Reset form
  function resetForm() {
    form.value = {
      nama: '',
      deskripsi: ''
    }
  }
  
  // Show alert
  function showAlert(type, message) {
    alert.value = {
      show: true,
      type,
      message
    }
    
    // Auto hide after 5 seconds
    setTimeout(() => {
      alert.value.show = false
    }, 5000)
  }
  
  onMounted(() => {
    fetchKategoris()
    
    // Initialize Bootstrap modals
    modalInstance = new bootstrap.Modal(modal.value)
    deleteModalInstance = new bootstrap.Modal(deleteModal.value)
  })
  </script>