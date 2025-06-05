<!-- src/views/supplier/SupplierListView.vue -->
<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1>Manajemen Supplier</h1>
      <router-link to="/supplier/create" class="btn btn-primary">
        <i class="bi bi-plus-lg me-2"></i> Tambah Supplier
      </router-link>
    </div>
    
    <!-- Alert Status -->
    <div v-if="alert.show" :class="`alert alert-${alert.type} alert-dismissible fade show`" role="alert">
      {{ alert.message }}
      <button type="button" class="btn-close" @click="alert.show = false"></button>
    </div>
    
    <!-- Payment Due Warning -->
    <div v-if="dueSoonSupplies.length > 0" class="alert alert-warning mb-4">
      <h5 class="alert-heading"><i class="bi bi-exclamation-triangle-fill me-2"></i> Peringatan Jatuh Tempo</h5>
      <p>Ada {{ dueSoonSupplies.length }} pembayaran supplier yang akan jatuh tempo dalam 7 hari:</p>
      <ul class="mb-0">
        <li v-for="supply in dueSoonSupplies.slice(0, 3)" :key="supply._id">
          <strong>{{ supply.supplier?.nama || 'Supplier' }}</strong> - 
          Jatuh tempo pada {{ formatDate(supply.tanggalJatuhTempo) }} 
          (Rp {{ formatCurrency(supply.totalHarga) }})
        </li>
        <li v-if="dueSoonSupplies.length > 3">
          Dan {{ dueSoonSupplies.length - 3 }} pembayaran lainnya...
        </li>
      </ul>
      <div class="mt-3">
        <button class="btn btn-outline-dark" @click="showDuePaymentsModal">
          <i class="bi bi-eye me-2"></i> Lihat Semua
        </button>
      </div>
    </div>
    
    <!-- Search and Filter -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-6">
            <label for="search" class="form-label">Cari Supplier</label>
            <div class="input-group">
              <input 
                type="text" 
                class="form-control" 
                id="search" 
                v-model="searchQuery"
                placeholder="Nama atau nomor HP supplier" 
                @keyup.enter="searchSuppliers"
              />
              <button class="btn btn-outline-secondary" type="button" @click="searchSuppliers">
                <i class="bi bi-search"></i>
              </button>
            </div>
          </div>
          
          <div class="col-md-3">
            <label for="sort" class="form-label">Urutkan</label>
            <select class="form-select" id="sort" v-model="sortBy" @change="searchSuppliers">
              <option value="nama_asc">Nama (A-Z)</option>
              <option value="nama_desc">Nama (Z-A)</option>
              <option value="created_desc">Terbaru</option>
              <option value="created_asc">Terlama</option>
            </select>
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
    
    <!-- Supplier Table -->
    <div v-else class="card">
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Supplier</th>
                <th>Kontak</th>
                <th>Alamat</th>
                <th class="text-center">Status Pembayaran</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(supplier, index) in suppliers" :key="supplier._id">
                <td>{{ index + 1 }}</td>
                <td>{{ supplier.nama }}</td>
                <td>
                  <div>{{ supplier.noHp || '-' }}</div>
                  <div class="text-muted small">{{ supplier.email || '-' }}</div>
                </td>
                <td>{{ truncateText(supplier.alamat, 50) || '-' }}</td>
                <td class="status-payment-cell text-center">
                  <span v-if="supplier.hasOverduePayments" class="badge bg-danger">
                    <i class="bi bi-exclamation-circle-fill me-1"></i> Jatuh Tempo
                  </span>
                  <span v-else-if="supplier.hasPendingPayments" class="badge bg-warning text-dark">
                    <i class="bi bi-clock-fill me-1"></i> Menunggu Pembayaran
                  </span>
                  <span v-else class="badge bg-success">
                    <i class="bi bi-check-circle-fill me-1"></i> Lunas
                  </span>
                </td>
                <td>
                  <div class="btn-group">
                    <router-link :to="`/supplier/${supplier._id}`" class="btn btn-sm btn-outline-info me-1">
                      <i class="bi bi-eye"></i>
                    </router-link>
                    <router-link :to="`/supplier/${supplier._id}/edit`" class="btn btn-sm btn-outline-primary me-1">
                      <i class="bi bi-pencil"></i>
                    </router-link>
                    <button class="btn btn-sm btn-outline-danger" @click="confirmDelete(supplier)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="suppliers.length === 0">
                <td colspan="6" class="text-center py-4">
                  <div v-if="hasSearchQuery">
                    <i class="bi bi-search display-4 text-muted"></i>
                    <p class="mt-3">Tidak ada supplier yang sesuai dengan pencarian</p>
                    <button class="btn btn-outline-secondary" @click="resetFilters">
                      <i class="bi bi-arrow-clockwise me-2"></i> Reset Pencarian
                    </button>
                  </div>
                  <div v-else>
                    <i class="bi bi-people display-4 text-muted"></i>
                    <p class="mt-3">Belum ada data supplier</p>
                    <router-link to="/supplier/create" class="btn btn-primary">
                      <i class="bi bi-plus-lg me-2"></i> Tambah Supplier Pertama
                    </router-link>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination -->
        <div v-if="suppliers.length > 0" class="d-flex justify-content-between align-items-center mt-3">
          <div>
            Menampilkan {{ suppliers.length }} dari {{ totalItems }} supplier
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
    
    <!-- Delete Confirmation Modal -->
    <div class="modal fade" id="deleteModal" tabindex="-1" aria-hidden="true" ref="deleteModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Konfirmasi Hapus</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p>Apakah Anda yakin ingin menghapus supplier <strong>{{ selectedSupplier?.nama }}</strong>?</p>
            <p class="text-danger">Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
            <button type="button" class="btn btn-danger" @click="deleteSupplier" :disabled="isDeleting">
              <span v-if="isDeleting" class="spinner-border spinner-border-sm me-2"></span>
              {{ isDeleting ? 'Menghapus...' : 'Hapus' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Due Payments Modal -->
    <div class="modal fade" id="duePaymentsModal" tabindex="-1" aria-hidden="true" ref="duePaymentsModal">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Pembayaran Jatuh Tempo</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="table-responsive">
              <table class="table table-bordered">
                <thead>
                  <tr>
                    <th>Supplier</th>
                    <th>Tanggal Pasok</th>
                    <th>Tanggal Jatuh Tempo</th>
                    <th>Jumlah</th>
                    <th class="text-center">Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="supply in dueSoonSupplies" :key="supply._id">
                    <td>{{ supply.supplier?.nama || 'Supplier' }}</td>
                    <td>{{ formatDate(supply.tanggalPasok) }}</td>
                    <td>{{ formatDate(supply.tanggalJatuhTempo) }}</td>
                    <td>Rp {{ formatCurrency(supply.totalHarga) }}</td>
                    <td class="status-cell text-center">
                      <span 
                        :class="`badge ${isOverdue(supply.tanggalJatuhTempo) ? 'bg-danger' : 'bg-warning text-dark'}`"
                      >
                        {{ isOverdue(supply.tanggalJatuhTempo) ? 'Jatuh Tempo' : 'Segera Jatuh Tempo' }}
                      </span>
                    </td>
                    <td>
                      <button class="btn btn-sm btn-success" @click="markAsPaid(supply)">
                        <i class="bi bi-check-circle me-1"></i> Tandai Lunas
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
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

// Data
const suppliers = ref([])
const dueSoonSupplies = ref([])
const isLoading = ref(true)
const isDeleting = ref(false)
const selectedSupplier = ref(null)
const searchQuery = ref('')
const sortBy = ref('nama_asc')
const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const limit = 10

// Bootstrap modal references
const deleteModal = ref(null)
const duePaymentsModal = ref(null)
let deleteModalInstance = null
let duePaymentsModalInstance = null

// Computed
const hasSearchQuery = computed(() => searchQuery.value.trim() !== '')

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

function truncateText(text, maxLength) {
  if (!text) return null
  return text.length > maxLength ? text.substr(0, maxLength) + '...' : text
}

function isOverdue(dateString) {
  if (!dateString) return false
  return new Date(dateString) < new Date()
}

// Fetch all suppliers
async function fetchSuppliers() {
  try {
    isLoading.value = true
    
    const params = {
      page: currentPage.value,
      limit,
      search: searchQuery.value,
      sort: sortBy.value
    }
    
    const response = await axios.get('/api/supplier', { params })
    suppliers.value = response.data.suppliers
    totalItems.value = response.data.total
    totalPages.value = Math.ceil(response.data.total / limit)
  } catch (error) {
    showAlert('danger', 'Gagal memuat data supplier')
    console.error('Error fetching suppliers:', error)
  } finally {
    isLoading.value = false
  }
}

// Fetch due soon supplies
async function fetchDueSoonSupplies() {
  try {
    const response = await axios.get('/api/supplier/due-payments')
    dueSoonSupplies.value = response.data
  } catch (error) {
    console.error('Error fetching due payments:', error)
  }
}

// Search suppliers
function searchSuppliers() {
  currentPage.value = 1
  fetchSuppliers()
}

// Reset filters
function resetFilters() {
  searchQuery.value = ''
  sortBy.value = 'nama_asc'
  currentPage.value = 1
  fetchSuppliers()
}

// Change page
function changePage(page) {
  currentPage.value = page
  fetchSuppliers()
}

// Show due payments modal
function showDuePaymentsModal() {
  duePaymentsModalInstance.show()
}

// Mark supply as paid
async function markAsPaid(supply) {
  try {
    await axios.put(`/api/supplier/supply/${supply._id}/paid`)
    
    // Remove from due soon supplies
    dueSoonSupplies.value = dueSoonSupplies.value.filter(s => s._id !== supply._id)
    
    showAlert('success', 'Pembayaran berhasil ditandai sebagai lunas')
    
    // Refresh suppliers if none left
    if (dueSoonSupplies.value.length === 0) {
      duePaymentsModalInstance.hide()
      fetchSuppliers()
    }
  } catch (error) {
    showAlert('danger', 'Gagal menandai pembayaran sebagai lunas')
    console.error('Error marking payment as paid:', error)
  }
}

// Confirm delete
function confirmDelete(supplier) {
  selectedSupplier.value = supplier
  deleteModalInstance.show()
}

// Delete supplier
async function deleteSupplier() {
  try {
    isDeleting.value = true
    await axios.delete(`/api/supplier/${selectedSupplier.value._id}`)
    showAlert('success', 'Supplier berhasil dihapus')
    await fetchSuppliers()
    deleteModalInstance.hide()
  } catch (error) {
    const message = error.response?.data?.message || 'Terjadi kesalahan saat menghapus supplier'
    showAlert('danger', message)
    console.error('Error deleting supplier:', error)
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
fetchSuppliers()
fetchDueSoonSupplies()

// Initialize Bootstrap modals
deleteModalInstance = new bootstrap.Modal(deleteModal.value)
duePaymentsModalInstance = new bootstrap.Modal(duePaymentsModal.value)
})
</script>

<style scoped>
/* Perbaikan untuk badge status */
.badge {
position: static !important;
display: inline-block !important;
min-width: 100px;
padding: 0.35em 0.65em;
font-weight: 500;
}

/* Memastikan status pembayaran ditampilkan dengan benar */
.status-payment-cell, .status-cell {
vertical-align: middle !important;
}

/* Memastikan semua cell dalam tabel memiliki vertical alignment yang tepat */
.table td, .table th {
vertical-align: middle !important;
}

/* Memastikan header kolom status yang center juga mendapatkan style yang sama */
.table th.text-center {
text-align: center !important;
}

/* Mengatur warna teks badge */
.bg-success, .bg-danger {
color: white !important;
}

/* Memberikan ruang untuk ikon dalam badge */
.badge i {
margin-right: 4px;
}
</style>