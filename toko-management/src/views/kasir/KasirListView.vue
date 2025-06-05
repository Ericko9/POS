<!-- src/views/kasir/KasirListView.vue -->
<template>
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1>Manajemen Kasir</h1>
        <router-link to="/kasir/create" class="btn btn-primary">
          <i class="bi bi-plus-lg me-2"></i> Tambah Kasir
        </router-link>
      </div>
      
      <!-- Alert Status -->
      <div v-if="alert.show" :class="`alert alert-${alert.type} alert-dismissible fade show`" role="alert">
        {{ alert.message }}
        <button type="button" class="btn-close" @click="alert.show = false"></button>
      </div>
      
      <!-- Search and Filter -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-9">
              <label for="search" class="form-label">Cari Kasir</label>
              <div class="input-group">
                <input 
                  type="text" 
                  class="form-control" 
                  id="search" 
                  v-model="searchQuery"
                  placeholder="Nama, username, atau email" 
                  @keyup.enter="searchKasir"
                />
                <button class="btn btn-outline-secondary" type="button" @click="searchKasir">
                  <i class="bi bi-search"></i>
                </button>
              </div>
            </div>
            
            <div class="col-md-3 d-flex align-items-end">
              <button class="btn btn-outline-secondary w-100" @click="resetFilters">
                <i class="bi bi-arrow-clockwise me-2"></i> Reset
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Loading Indicator -->
      <div v-if="isLoading" class="text-center my-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Memuat data...</p>
      </div>
      
      <!-- Kasir Table -->
      <div v-else class="card">
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama</th>
                  <th>Username</th>
                  <th>Kontak</th>
                  <th>Performa</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(kasir, index) in kasirs" :key="kasir._id">
                  <td>{{ index + 1 }}</td>
                  <td>{{ kasir.nama }}</td>
                  <td>{{ kasir.username }}</td>
                  <td>
                    <div>{{ kasir.noHp || '-' }}</div>
                    <div class="text-muted small">{{ kasir.email || '-' }}</div>
                  </td>
                  <td>
                    <div class="d-flex align-items-center">
                      <div class="me-2">
                        <strong>{{ kasir.totalNota || 0 }}</strong> nota
                      </div>
                      <i class="bi bi-dot"></i>
                      <div class="ms-2">
                        <strong>Rp {{ formatCurrency(kasir.totalPendapatan || 0) }}</strong>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="btn-group">
                      <router-link :to="`/kasir/${kasir._id}`" class="btn btn-sm btn-outline-info me-1">
                        <i class="bi bi-eye"></i>
                      </router-link>
                      <router-link :to="`/kasir/${kasir._id}/edit`" class="btn btn-sm btn-outline-primary me-1">
                        <i class="bi bi-pencil"></i>
                      </router-link>
                      <button 
                        class="btn btn-sm btn-outline-danger" 
                        @click="confirmDelete(kasir)"
                        :disabled="kasir._id === authStore.user?._id"
                      >
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="kasirs.length === 0">
                  <td colspan="6" class="text-center py-4">
                    <div v-if="hasSearchQuery">
                      <i class="bi bi-search display-4 text-muted"></i>
                      <p class="mt-3">Tidak ada kasir yang sesuai dengan pencarian</p>
                      <button class="btn btn-outline-secondary" @click="resetFilters">
                        <i class="bi bi-arrow-clockwise me-2"></i> Reset Pencarian
                      </button>
                    </div>
                    <div v-else>
                      <i class="bi bi-people display-4 text-muted"></i>
                      <p class="mt-3">Belum ada data kasir</p>
                      <router-link to="/kasir/create" class="btn btn-primary">
                        <i class="bi bi-plus-lg me-2"></i> Tambah Kasir Pertama
                      </router-link>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
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
              <p>Apakah Anda yakin ingin menghapus kasir <strong>{{ selectedKasir?.nama }}</strong>?</p>
              <p class="text-danger">Tindakan ini tidak dapat dibatalkan dan akan menghapus akun kasir ini.</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
              <button type="button" class="btn btn-danger" @click="deleteKasir" :disabled="isDeleting">
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
  import { ref, computed, onMounted } from 'vue'
  import { useAuthStore } from '../../stores/auth'
  import axios from 'axios'
  import * as bootstrap from 'bootstrap'
  
  const authStore = useAuthStore()
  
  // Data
  const kasirs = ref([])
  const isLoading = ref(true)
  const isDeleting = ref(false)
  const selectedKasir = ref(null)
  const searchQuery = ref('')
  
  // Bootstrap modal references
  const deleteModal = ref(null)
  let deleteModalInstance = null
  
  // Computed
  const hasSearchQuery = computed(() => searchQuery.value.trim() !== '')
  
  // Alert message
  const alert = ref({
    show: false,
    type: 'success',
    message: ''
  })
  
  // Functions
  function formatCurrency(value) {
    return new Intl.NumberFormat('id-ID').format(value)
  }
  
  // Fetch all kasirs
  async function fetchKasirs() {
    try {
      isLoading.value = true
      
      const params = {
        search: searchQuery.value
      }
      
      const response = await axios.get('/api/kasir', { params })
      kasirs.value = response.data
    } catch (error) {
      showAlert('danger', 'Gagal memuat data kasir')
      console.error('Error fetching kasirs:', error)
    } finally {
      isLoading.value = false
    }
  }
  
  // Search kasirs
  function searchKasir() {
    fetchKasirs()
  }
  
  // Reset filters
  function resetFilters() {
    searchQuery.value = ''
    fetchKasirs()
  }
  
  // Confirm delete
  function confirmDelete(kasir) {
    // Cannot delete current user
    if (kasir._id === authStore.user?._id) return
    
    selectedKasir.value = kasir
    deleteModalInstance.show()
  }
  
  // Delete kasir
  async function deleteKasir() {
    try {
      isDeleting.value = true
      await axios.delete(`/api/kasir/${selectedKasir.value._id}`)
      showAlert('success', 'Kasir berhasil dihapus')
      await fetchKasirs()
      deleteModalInstance.hide()
    } catch (error) {
      const message = error.response?.data?.message || 'Terjadi kesalahan saat menghapus kasir'
      showAlert('danger', message)
      console.error('Error deleting kasir:', error)
    } finally {
      isDeleting.value = false
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
    fetchKasirs()
    
    // Initialize Bootstrap modals
    deleteModalInstance = new bootstrap.Modal(deleteModal.value)
  })
  </script>