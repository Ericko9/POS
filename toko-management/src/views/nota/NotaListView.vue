<!-- src/views/nota/NotaListView.vue -->
<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1>Daftar Nota Penjualan</h1>
      <router-link to="/nota/create" class="btn btn-primary">
        <i class="bi bi-plus-lg me-2"></i> Buat Nota Baru
      </router-link>
    </div>
    
    <!-- Alert Status -->
    <div v-if="alert.show" :class="`alert alert-${alert.type} alert-dismissible fade show`" role="alert">
      {{ alert.message }}
      <button type="button" class="btn-close" @click="alert.show = false"></button>
    </div>
    
    <!-- Filter and Search -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-3">
            <label for="search" class="form-label">Cari</label>
            <div class="input-group">
              <input 
                type="text" 
                class="form-control" 
                id="search" 
                v-model="filters.search"
                placeholder="No Nota / Pelanggan" 
              />
              <button class="btn btn-outline-secondary" type="button" @click="applyFilters">
                <i class="bi bi-search"></i>
              </button>
            </div>
          </div>
          
          <div class="col-md-3">
            <label for="dateRange" class="form-label">Periode</label>
            <div class="input-group">
              <input 
                type="date" 
                class="form-control" 
                v-model="filters.startDate"
              />
              <span class="input-group-text">s/d</span>
              <input 
                type="date" 
                class="form-control" 
                v-model="filters.endDate"
              />
            </div>
          </div>
          
          <div class="col-md-3">
            <label for="sort" class="form-label">Urutkan</label>
            <select class="form-select" id="sort" v-model="filters.sort">
              <option value="tanggal_desc">Tanggal (Terbaru)</option>
              <option value="tanggal_asc">Tanggal (Terlama)</option>
              <option value="totalHarga_desc">Total (Tertinggi)</option>
              <option value="totalHarga_asc">Total (Terendah)</option>
            </select>
          </div>
          
          <div class="col-md-3 d-flex align-items-end">
            <button class="btn btn-primary w-100" @click="applyFilters">
              <i class="bi bi-funnel-fill me-2"></i> Terapkan Filter
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
    
    <!-- Nota Table -->
    <div v-else class="card">
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>No</th>
                <th>Nomor Nota</th>
                <th>Tanggal</th>
                <th>Pelanggan</th>
                <th>Jumlah Item</th>
                <th>Total</th>
                <th>Kasir</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(nota, index) in notas" :key="nota._id">
                <td>{{ startIndex + index + 1 }}</td>
                <td>{{ nota.nomorNota }}</td>
                <td>{{ formatDate(nota.tanggal) }}</td>
                <td>
                  <div>{{ nota.namaPelanggan }}</div>
                  <small class="text-muted">{{ nota.noHpPelanggan }}</small>
                </td>
                <td>{{ nota.items.length }} item</td>
                <td>Rp {{ formatCurrency(nota.totalHarga) }}</td>
                <td>{{ nota.kasir?.nama || '-' }}</td>
                <td>
                  <div class="d-flex align-items-center">
                    <span
                      class="status-indicator me-2"
                      :class="{
                        'bg-danger': !nota.statusPengiriman,
                        'bg-success': nota.statusPengiriman && !nota.memilikiRetur,
                        'bg-warning': nota.statusPengiriman && nota.memilikiRetur
                      }"
                      :title="getStatusText(nota)"
                    ></span>
                    {{ getStatusText(nota) }}
                  </div>
                </td>
                <td>
                  <div class="btn-group">
                    <router-link :to="`/nota/${nota._id}/combined-print`" class="btn btn-sm btn-outline-primary me-1" title="Cetak">
                      <i class="bi bi-printer"></i>
                    </router-link>
                    <button class="btn btn-sm btn-outline-info me-1" @click="showDetail(nota)" title="Lihat Detail">
                      <i class="bi bi-eye"></i>
                    </button>
                    <button 
                      class="btn btn-sm me-1" 
                      :class="nota.statusPengiriman ? 'btn-outline-secondary' : 'btn-outline-success'"
                      @click="togglePengirimanStatus(nota)"
                      title="Ubah Status Pengiriman"
                    >
                      <i class="bi" :class="nota.statusPengiriman ? 'bi-x-circle' : 'bi-check-circle'"></i>
                    </button>
                    <button 
                      v-if="userRole === 'admin'"
                      class="btn btn-sm btn-outline-danger" 
                      @click="confirmDelete(nota)" 
                      title="Hapus"
                    >
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="notas.length === 0">
                <td colspan="9" class="text-center">Belum ada data nota</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination -->
        <div class="d-flex justify-content-between align-items-center mt-3">
          <div>
            Menampilkan {{ notas.length }} dari {{ totalItems }} nota
          </div>
          <nav v-if="totalPages > 1">
            <ul class="pagination mb-0">
              <li :class="`page-item ${currentPage === 1 ? 'disabled' : ''}`">
                <a class="page-link" href="#" @click.prevent="changePage(currentPage - 1)">
                  <i class="bi bi-chevron-left"></i>
                </a>
              </li>
              <li v-for="page in paginationRange" :key="page" :class="`page-item ${currentPage === page ? 'active' : ''}`">
                <a class="page-link" href="#" @click.prevent="changePage(page)">{{ page }}</a>
              </li>
              <li :class="`page-item ${currentPage === totalPages ? 'disabled' : ''}`">
                <a class="page-link" href="#" @click.prevent="changePage(currentPage + 1)">
                  <i class="bi bi-chevron-right"></i>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
    
    <!-- Nota Detail Modal -->
    <div class="modal fade" id="notaDetailModal" tabindex="-1" aria-hidden="true" ref="notaDetailModal">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detail Nota</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" v-if="selectedNota">
            <div class="row mb-4">
              <div class="col-md-6">
                <h6>Informasi Nota</h6>
                <table class="table table-sm table-borderless">
                  <tr>
                    <th style="width: 130px">Nomor Nota</th>
                    <td>{{ selectedNota.nomorNota }}</td>
                  </tr>
                  <tr>
                    <th>Tanggal</th>
                    <td>{{ formatDate(selectedNota.tanggal) }}</td>
                  </tr>
                  <tr>
                    <th>Kasir</th>
                    <td>{{ selectedNota.kasir?.nama || '-' }}</td>
                  </tr>
                  <tr>
                    <th>Status</th>
                    <td>
                      <div class="d-flex align-items-center">
                        <span
                          class="status-indicator me-2"
                          :class="{
                            'bg-danger': !selectedNota.statusPengiriman,
                            'bg-success': selectedNota.statusPengiriman && !selectedNota.memilikiRetur,
                            'bg-warning': selectedNota.statusPengiriman && selectedNota.memilikiRetur
                          }"
                        ></span>
                        {{ getStatusText(selectedNota) }}
                      </div>
                    </td>
                  </tr>
                </table>
              </div>
              
              <div class="col-md-6">
                <h6>Informasi Pelanggan</h6>
                <table class="table table-sm table-borderless">
                  <tr>
                    <th style="width: 130px">Nama</th>
                    <td>{{ selectedNota.namaPelanggan }}</td>
                  </tr>
                  <tr>
                    <th>No. HP</th>
                    <td>{{ selectedNota.noHpPelanggan }}</td>
                  </tr>
                  <tr>
                    <th>Alamat</th>
                    <td>{{ selectedNota.alamatPelanggan || '-' }}</td>
                  </tr>
                </table>
              </div>
            </div>
            
            <h6>Daftar Barang</h6>
            <div class="table-responsive mb-3">
              <table class="table table-sm table-bordered">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nama Barang</th>
                    <th>Grade</th>
                    <th>Harga</th>
                    <th>Diskon</th>
                    <th>Jumlah</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in selectedNotaItems" :key="index">
                    <td>{{ index + 1 }}</td>
                    <td>{{ item.namaBarang }}</td>
                    <td>{{ item.grade }}</td>
                    <td>Rp {{ formatCurrency(item.hargaSatuan) }}</td>
                    <td>Rp {{ formatCurrency(item.potonganHarga || 0) }}</td>
                    <td>{{ item.jumlah }}</td>
                    <td>Rp {{ formatCurrency(item.subtotal) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="6" class="text-end fw-bold">Total:</td>
                    <td class="fw-bold">Rp {{ formatCurrency(selectedNota.totalHarga) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <div v-if="selectedNota.catatan" class="mb-0">
              <h6>Catatan</h6>
              <p class="mb-0">{{ selectedNota.catatan }}</p>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
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
            <p>Apakah Anda yakin ingin menghapus nota <strong>{{ selectedNota?.nomorNota }}</strong>?</p>
            <p class="text-danger">Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
            <button 
              v-if="userRole === 'admin'"
              type="button" 
              class="btn btn-danger" 
              @click="deleteNota" 
              :disabled="isDeleting"
            >
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
import axios from 'axios'
import * as bootstrap from 'bootstrap'
import { useAuthStore } from '../../stores/auth'

// Data
const authStore = useAuthStore()
const userRole = computed(() => authStore.userRole)
const notas = ref([])
const isLoading = ref(true)
const isDeleting = ref(false)
const selectedNota = ref(null)
const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const limit = 10

// Bootstrap modal references
const notaDetailModal = ref(null)
const deleteModal = ref(null)
let notaDetailModalInstance = null
let deleteModalInstance = null

// Computed
const startIndex = computed(() => (currentPage.value - 1) * limit)

const paginationRange = computed(() => {
  const range = []
  const maxVisible = 5
  
  if (totalPages.value <= maxVisible) {
    // If total pages is less than max visible, show all pages
    for (let i = 1; i <= totalPages.value; i++) {
      range.push(i)
    }
  } else {
    // Calculate range based on current page
    let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages.value, start + maxVisible - 1)
    
    // Adjust if we're near the end
    if (end === totalPages.value) {
      start = Math.max(1, totalPages.value - maxVisible + 1)
    }
    
    for (let i = start; i <= end; i++) {
      range.push(i)
    }
  }
  
  return range
})

// Computed property to handle conversion of diskon to potonganHarga
const selectedNotaItems = computed(() => {
  if (!selectedNota.value || !selectedNota.value.items) return [];
  
  return selectedNota.value.items.map(item => {
    // Jika ada diskon (lama) tapi tidak ada potonganHarga (baru)
    if (item.diskon !== undefined && item.potonganHarga === undefined) {
      // Konversi diskon persentase ke potongan harga
      const potonganHarga = (item.diskon / 100) * item.hargaSatuan;
      return {
        ...item,
        potonganHarga
      };
    }
    return item;
  });
});

// Filters
const filters = ref({
  search: '',
  startDate: '',
  endDate: '',
  sort: 'tanggal_desc'
})

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

function formatDate(dateString) {
  if (!dateString) return '-'
  
  const options = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(dateString).toLocaleDateString('id-ID', options)
}

// Get status text based on delivery status and retur status
function getStatusText(nota) {
  if (!nota.statusPengiriman) {
    return 'Belum dikirim'
  } else if (nota.statusPengiriman && !nota.memilikiRetur) {
    return 'Sudah dikirim'
  } else {
    return 'Dikirim (ada retur)'
  }
}

// Toggle pengiriman status
async function togglePengirimanStatus(nota) {
  try {
    const newStatus = !nota.statusPengiriman
    await axios.patch(`/api/nota/${nota._id}/status`, {
      statusPengiriman: newStatus
    })
    
    // Update local data
    nota.statusPengiriman = newStatus
    
    showAlert('success', `Status pengiriman berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`)
  } catch (error) {
    const message = error.response?.data?.message || 'Terjadi kesalahan saat mengubah status pengiriman'
    showAlert('danger', message)
    console.error('Error updating delivery status:', error)
  }
}

// routes/nota.js - fungsi fetchNotas
async function fetchNotas() {
  try {
    isLoading.value = true
    
    const params = {
      page: currentPage.value,
      limit,
      search: filters.value.search,
      startDate: filters.value.startDate,
      endDate: filters.value.endDate,
      sort: filters.value.sort
    }
    
    // Tambahkan logging untuk memahami parameter yang dikirim
    console.log('Fetching notas with params:', params)
    
    const response = await axios.get('/api/nota', { params })
    console.log('Nota response data:', response.data)
    
    const notaData = response.data.notas
    
    // Fetch retur information for each nota
    await fetchReturStatus(notaData)
    
    notas.value = notaData
    totalItems.value = response.data.total
    totalPages.value = Math.ceil(response.data.total / limit)
  } catch (error) {
    console.error('Error fetching notas:', error)
    showAlert('danger', 'Gagal memuat data nota')
  } finally {
    isLoading.value = false
  }
}

// Fetch retur status for each nota
async function fetchReturStatus(notaList) {
  try {
    // Metode 1: Ambil data retur untuk setiap nota satu per satu (lebih lambat tapi lebih stabil)
    for (const nota of notaList) {
      try {
        // Menggunakan endpoint per nota
        const response = await axios.get(`/api/retur/nota/${nota._id}`)
        nota.memilikiRetur = response.data.length > 0
      } catch (error) {
        console.warn(`Error checking retur for nota ${nota._id}:`, error)
        nota.memilikiRetur = false // Default false jika terjadi error
      }
    }
    
    /* Metode 2: Batch request (lebih cepat tapi mungkin bermasalah)
    // Uncomment jika metode 1 terlalu lambat dan endpoint /api/retur/by-nota sudah diperbaiki
    
    // Get all nota IDs
    const notaIds = notaList.map(nota => nota._id)
    
    if (notaIds.length === 0) return
    
    // Fetch retur data for these nota IDs
    const response = await axios.get('/api/retur/by-nota', {
      params: { notaIds: notaIds.join(',') }
    })
    
    const returData = response.data
    
    // Map retur data to nota list
    notaList.forEach(nota => {
      nota.memilikiRetur = returData.some(retur => retur.notaId === nota._id)
    })
    */
  } catch (error) {
    console.error('Error fetching retur status:', error)
    // Pastikan semua nota memiliki nilai default
    notaList.forEach(nota => {
      nota.memilikiRetur = false
    })
  }
}

// Apply filters
function applyFilters() {
  currentPage.value = 1
  fetchNotas()
}

// Change page
function changePage(page) {
  currentPage.value = page
  fetchNotas()
}

// Show nota detail
function showDetail(nota) {
  selectedNota.value = nota
  notaDetailModalInstance.show()
}

// Confirm delete
function confirmDelete(nota) {
  selectedNota.value = nota
  deleteModalInstance.show()
}

// Delete nota
async function deleteNota() {
  try {
    isDeleting.value = true
    await axios.delete(`/api/nota/${selectedNota.value._id}`)
    showAlert('success', 'Nota berhasil dihapus')
    await fetchNotas()
    deleteModalInstance.hide()
  } catch (error) {
    const message = error.response?.data?.message || 'Terjadi kesalahan saat menghapus nota'
    showAlert('danger', message)
    console.error('Error deleting nota:', error)
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
  // Initialize date filters with current month
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
  // Set last day to first day of next month to include all transactions
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 1)
  
  filters.value.startDate = firstDay.toISOString().split('T')[0]
  filters.value.endDate = lastDay.toISOString().split('T')[0]
  
  fetchNotas()
  
  // Initialize Bootstrap modals
  notaDetailModalInstance = new bootstrap.Modal(notaDetailModal.value)
  deleteModalInstance = new bootstrap.Modal(deleteModal.value)
})
</script>

<style scoped>
.status-indicator {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  display: inline-block;
}
</style>