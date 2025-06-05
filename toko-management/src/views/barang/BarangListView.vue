<!-- src/views/barang/BarangListView.vue -->
<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1>Manajemen Barang</h1>
      <router-link to="/barang/create" class="btn btn-primary">
        <i class="bi bi-plus-lg me-2"></i> Tambah Barang
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
                placeholder="Nama barang" 
              />
              <button class="btn btn-outline-secondary" type="button" @click="applyFilters">
                <i class="bi bi-search"></i>
              </button>
            </div>
          </div>
          
          <div class="col-md-3">
            <label for="kategori" class="form-label">Kategori</label>
            <select class="form-select" id="kategori" v-model="filters.kategori">
              <option value="">Semua Kategori</option>
              <option v-for="kategori in kategoris" :key="kategori._id" :value="kategori._id">
                {{ kategori.nama }}
              </option>
            </select>
          </div>
          
          <div class="col-md-3">
            <label for="sort" class="form-label">Urutkan</label>
            <select class="form-select" id="sort" v-model="filters.sort">
              <option value="nama_asc">Nama (A-Z)</option>
              <option value="nama_desc">Nama (Z-A)</option>
              <option value="harga_asc">Harga (Rendah-Tinggi)</option>
              <option value="harga_desc">Harga (Tinggi-Rendah)</option>
              <option value="stok_asc">Stok (Rendah-Tinggi)</option>
              <option value="stok_desc">Stok (Tinggi-Rendah)</option>
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
    
    <!-- Low Stock Warning -->
    <div v-if="lowStockItems.length > 0 && !isLoading" class="alert alert-warning mb-4">
      <h5 class="alert-heading"><i class="bi bi-exclamation-triangle-fill me-2"></i> Peringatan Stok Menipis</h5>
      <p>Terdapat {{ lowStockItems.length }} barang dengan stok di bawah batas minimum:</p>
      <ul class="mb-0">
        <li v-for="item in lowStockItems.slice(0, 3)" :key="item._id">
          <strong>{{ item.nama }}</strong> - Stok: {{ item.stokBagus }} (Min: {{ item.minStok }})
        </li>
        <li v-if="lowStockItems.length > 3">
          Dan {{ lowStockItems.length - 3 }} barang lainnya...
        </li>
      </ul>
    </div>
    
    <!-- Barang Table -->
    <div v-if="!isLoading" class="card">
      <div class="card-body">
        <div class="table-responsive">
          <!-- Modifikasi tabel dan struktur cell untuk memperbaiki tampilan status -->
          <table class="table table-hover">
            <thead>
              <tr>
                <th style="width: 5%">No</th>
                <th style="width: 15%">Nama Barang</th>
                <th style="width: 12%">Kategori</th>
                <th style="width: 8%">Grade</th>
                <th style="width: 12%">Harga</th>
                <th style="width: 10%">Stok Bagus</th>
                <th style="width: 10%">Stok Rusak</th>
                <th style="width: 8%">Terjual</th>
                <th style="width: 10%">Status</th>
                <th style="width: 10%">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(barang, index) in barangs" :key="barang._id">
                <td>{{ index + 1 }}</td>
                <td>
                  <span :class="{'text-danger': isLowStock(barang)}">
                    {{ barang.nama }}
                    <i v-if="isLowStock(barang)" class="bi bi-exclamation-circle-fill text-danger ms-1"></i>
                  </span>
                  <span v-if="hasActivePromo(barang)" class="badge bg-danger ms-1">Promo</span>
                </td>
                <td>{{ barang.kategori?.nama || '-' }}</td>
                <td>{{ barang.grade }}</td>
                <td>
                  <div v-if="hasActivePromo(barang)">
                    <span class="text-decoration-line-through me-1">Rp {{ formatCurrency(barang.harga) }}</span>
                    <span class="text-danger">Rp {{ formatCurrency(barang.hargaSetelahDiskon || getDiscountedPrice(barang)) }}</span>
                  </div>
                  <div v-else>Rp {{ formatCurrency(barang.harga) }}</div>
                </td>
                <td :class="{'text-danger': isLowStock(barang)}">{{ barang.stokBagus }}</td>
                <td>{{ barang.stokRusak }}</td>
                <td>{{ barang.jumlahTerjual || 0 }}</td>
                <!-- Modifikasi cell status dengan struktur yang lebih kuat -->
                <td class="text-center">
                  <div class="d-inline-block">
                    <span :class="`badge ${getStockStatusBadge(barang)}`" style="display: inline-block; min-width: 80px;">
                      {{ getStockStatusText(barang) }}
                    </span>
                  </div>
                </td>
                <td>
                  <div class="btn-group">
                    <router-link :to="`/barang/${barang._id}`" class="btn btn-sm btn-outline-info me-1">
                      <i class="bi bi-eye"></i>
                    </router-link>
                    <router-link :to="`/barang/${barang._id}/edit`" class="btn btn-sm btn-outline-primary me-1">
                      <i class="bi bi-pencil"></i>
                    </router-link>
                    <button class="btn btn-sm btn-outline-danger" @click="confirmDelete(barang)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="barangs.length === 0">
                <td colspan="10" class="text-center">Belum ada data barang</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination -->
        <div class="d-flex justify-content-between align-items-center mt-3">
          <div>
            Menampilkan {{ barangs.length }} dari {{ totalItems }} barang
          </div>
          <nav v-if="totalPages > 1">
            <ul class="pagination mb-0">
              <li :class="`page-item ${currentPage === 1 ? 'disabled' : ''}`">
                <a class="page-link" href="#" @click.prevent="changePage(currentPage - 1)">
                  <i class="bi bi-chevron-left"></i>
                </a>
              </li>
              <li v-for="page in totalPages" :key="page" :class="`page-item ${currentPage === page ? 'active' : ''}`">
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
            <p>Apakah Anda yakin ingin menghapus barang <strong>{{ selectedBarang?.nama }}</strong>?</p>
            <p class="text-danger">Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
            <button type="button" class="btn btn-danger" @click="deleteBarang" :disabled="isDeleting">
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
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import * as bootstrap from 'bootstrap'

// Data
const barangs = ref([])
const kategoris = ref([])
const isLoading = ref(true)
const isDeleting = ref(false)
const selectedBarang = ref(null)
const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const limit = 10

// Bootstrap modal references
const deleteModal = ref(null)
let deleteModalInstance = null

// Filters
const filters = ref({
  search: '',
  kategori: '',
  sort: 'nama_asc',
  page: 1,
  limit
})

// Alert message
const alert = ref({
  show: false,
  type: 'success',
  message: ''
})

// Computed
const lowStockItems = computed(() => {
  return barangs.value.filter(barang => barang.stokBagus < barang.minStok)
})

// Functions
function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID').format(value)
}

function isLowStock(barang) {
  return barang.stokBagus < barang.minStok
}

function hasActivePromo(barang) {
  return barang.promo && barang.promo.isActive
}

function getDiscountedPrice(barang) {
  if (!hasActivePromo(barang)) return barang.harga
  
  // Jika hargaSetelahDiskon sudah dihitung oleh server, gunakan itu
  if (barang.hargaSetelahDiskon !== undefined) {
    return barang.hargaSetelahDiskon
  }
  
  // Jika menggunakan potonganHarga
  if (barang.promo.potonganHarga !== undefined) {
    return Math.max(0, barang.harga - barang.promo.potonganHarga)
  }
  
  // Fallback ke persentaseDiskon jika masih ada data lama
  if (barang.promo.persentaseDiskon !== undefined) {
    const discountAmount = (barang.promo.persentaseDiskon / 100) * barang.harga
    return Math.max(0, barang.harga - discountAmount)
  }
  
  return barang.harga
}

function getStockStatusBadge(barang) {
  if (barang.stokBagus <= 0) return 'bg-danger'
  if (isLowStock(barang)) return 'bg-warning'
  return 'bg-success'
}

function getStockStatusText(barang) {
  if (barang.stokBagus <= 0) return 'Habis'
  if (isLowStock(barang)) return 'Menipis'
  return 'Tersedia'
}

// Fetch all barangs
async function fetchBarangs() {
  try {
    isLoading.value = true
    
    const params = {
      page: currentPage.value,
      limit,
      search: filters.value.search,
      kategoriId: filters.value.kategori,
      sort: filters.value.sort
    }
    
    const response = await axios.get('/api/barang', { params })
    barangs.value = response.data.barangs
    totalItems.value = response.data.total
    totalPages.value = Math.ceil(response.data.total / limit)
    
    // Debug: Periksa struktur data
    console.log('Data barang:', barangs.value.length > 0 ? barangs.value[0] : 'Tidak ada data')
  } catch (error) {
    showAlert('danger', 'Gagal memuat data barang')
    console.error('Error fetching barangs:', error)
  } finally {
    isLoading.value = false
  }
}

// Fetch all kategoris
async function fetchKategoris() {
  try {
    const response = await axios.get('/api/kategori')
    kategoris.value = response.data
  } catch (error) {
    console.error('Error fetching kategoris:', error)
  }
}

// Apply filters
function applyFilters() {
  currentPage.value = 1
  fetchBarangs()
}

// Change page
function changePage(page) {
  currentPage.value = page
  fetchBarangs()
}

// Confirm delete
function confirmDelete(barang) {
  selectedBarang.value = barang
  deleteModalInstance.show()
}

// Delete barang
async function deleteBarang() {
  try {
    isDeleting.value = true
    await axios.delete(`/api/barang/${selectedBarang.value._id}`)
    showAlert('success', 'Barang berhasil dihapus')
    await fetchBarangs()
    deleteModalInstance.hide()
  } catch (error) {
    const message = error.response?.data?.message || 'Terjadi kesalahan saat menghapus barang'
    showAlert('danger', message)
    console.error('Error deleting barang:', error)
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
  fetchBarangs()
  fetchKategoris()

  // Initialize Bootstrap delete modal
  deleteModalInstance = new bootstrap.Modal(deleteModal.value)
})
</script>

<style scoped>
/* Tambahkan style khusus untuk mengatasi masalah tampilan status */
.table td {
  vertical-align: middle;
}

/* Pastikan badge tidak memiliki posisi absolute dan terlihat sebagaimana mestinya */
.badge {
  position: static !important;
  display: inline-block !important;
}

/* Memastikan cell status memiliki dimensi yang cukup */
.table th:nth-child(9),
.table td:nth-child(9) {
  min-width: 90px;
  text-align: center;
}

/* Meningkatkan keterbacaan status */
.bg-success, .bg-warning, .bg-danger {
  font-weight: 500;
  padding: 0.35em 0.65em;
}
</style>