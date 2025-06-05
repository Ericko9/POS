<!-- src/views/barang/BarangDetailView.vue -->
<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1>Detail Barang</h1>
      <div>
        <router-link :to="`/barang/${barangId}/edit`" class="btn btn-outline-primary me-2">
          <i class="bi bi-pencil me-1"></i> Edit
        </router-link>
        <router-link to="/barang" class="btn btn-outline-secondary">
          <i class="bi bi-arrow-left me-1"></i> Kembali
        </router-link>
      </div>
    </div>
    
    <!-- Loading Indicator -->
    <div v-if="isLoading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Memuat data...</p>
    </div>
    
    <div v-else>
      <!-- Barang Header Card -->
      <div class="card mb-4 shadow-sm border-0">
        <div class="card-body">
          <div class="row">
            <div class="col-md-8">
              <h2 class="mb-1">{{ barang.nama }}</h2>
              <p class="mb-2 text-muted">
                <span class="badge bg-secondary me-2">{{ barang.kategori?.nama || 'Tidak ada kategori' }}</span>
                <span class="badge bg-info">Grade {{ barang.grade }}</span>
                <span v-if="hasActivePromo" class="badge bg-danger ms-2">Promo Rp {{ formatCurrency(barang.promo?.potonganHarga) }}</span>
              </p>
              
              <div class="mb-3">
                <h4 v-if="hasActivePromo" class="mb-0">
                  <span class="text-decoration-line-through text-muted me-2">
                    Rp {{ formatCurrency(barang.harga) }}
                  </span>
                  <span class="text-danger">
                    Rp {{ formatCurrency(barang.hargaSetelahDiskon || getDiscountedPrice()) }}
                  </span>
                </h4>
                <h4 v-else class="mb-0">
                  Rp {{ formatCurrency(barang.harga) }}
                </h4>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Enhanced Stock Information Cards -->
      <div class="row mb-4">
        <div class="col-md-6">
          <div class="card h-100 shadow-sm border-0">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="stock-icon-container good-stock me-3">
                  <i class="bi bi-box-seam fs-1"></i>
                </div>
                <div>
                  <h6 class="text-muted mb-1">Stok Bagus</h6>
                  <div class="d-flex align-items-baseline">
                    <h2 :class="{'text-danger font-weight-bold': isLowStock, 'text-success': !isLowStock}">
                      {{ barang.stokBagus }}
                    </h2>
                    <span class="ms-2">unit</span>
                  </div>
                  <div v-if="isLowStock" class="mt-2 d-flex align-items-center text-danger">
                    <i class="bi bi-exclamation-triangle-fill me-1"></i>
                    <small>Di bawah batas minimum ({{ barang.minStok }} unit)</small>
                  </div>
                  <div v-else class="mt-2 d-flex align-items-center text-success">
                    <i class="bi bi-check-circle-fill me-1"></i>
                    <small>Stok aman (Min: {{ barang.minStok }} unit)</small>
                  </div>
                </div>
              </div>
              
              <!-- Stock Level Progress Bar -->
              <div class="mt-3">
                <div class="progress" style="height: 10px">
                  <div 
                    :class="getStockLevelClass()"
                    role="progressbar" 
                    :style="`width: ${getStockPercentage()}%`" 
                    :aria-valuenow="getStockPercentage()" 
                    aria-valuemin="0" 
                    aria-valuemax="100"
                  ></div>
                </div>
                <div class="d-flex justify-content-between mt-1">
                  <small class="text-muted">0</small>
                  <small class="text-muted">{{ Math.max(barang.minStok * 2, barang.stokBagus + 5) }}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="card h-100 shadow-sm border-0">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="stock-icon-container damaged-stock me-3">
                  <i class="bi bi-box text-danger fs-1"></i>
                </div>
                <div>
                  <h6 class="text-muted mb-1">Stok Rusak</h6>
                  <div class="d-flex align-items-baseline">
                    <h2 :class="{'text-warning': barang.stokRusak > 0, 'text-muted': barang.stokRusak === 0}">
                      {{ barang.stokRusak }}
                    </h2>
                    <span class="ms-2">unit</span>
                  </div>
                  <div v-if="barang.stokRusak > 0" class="mt-2 d-flex align-items-center text-warning">
                    <i class="bi bi-info-circle-fill me-1"></i>
                    <small>{{ getDamagedStockPercentage() }}% dari total stok</small>
                  </div>
                  <div v-else class="mt-2 d-flex align-items-center text-muted">
                    <i class="bi bi-check-circle-fill me-1"></i>
                    <small>Tidak ada barang rusak</small>
                  </div>
                </div>
              </div>
              
              <!-- Damaged Stock Bar -->
              <div class="mt-3">
                <div class="progress" style="height: 10px">
                  <div 
                    class="progress-bar bg-warning"
                    role="progressbar" 
                    :style="`width: ${getDamagedStockPercentage()}%`" 
                    :aria-valuenow="getDamagedStockPercentage()" 
                    aria-valuemin="0" 
                    aria-valuemax="100"
                  ></div>
                </div>
                <div class="d-flex justify-content-between mt-1">
                  <small class="text-muted">0%</small>
                  <small class="text-muted">100%</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Stock Warning if applicable -->
      <div v-if="isLowStock" class="alert alert-warning mb-4 shadow-sm">
        <div class="d-flex align-items-center">
          <i class="bi bi-exclamation-triangle-fill fs-4 me-3"></i>
          <div>
            <strong>Peringatan Stok Menipis!</strong> 
            <p class="mb-0">Stok barang ini di bawah batas minimum ({{ barang.minStok }} unit). Pertimbangkan untuk melakukan pembelian segera.</p>
          </div>
        </div>
      </div>
      
      <!-- Card for Detailed Info -->
      <div class="card shadow-sm border-0">
        <div class="card-header bg-white">
          <h5 class="card-title mb-0">Detail Informasi</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <table class="table">
                <tbody>
                  <tr>
                    <th style="width: 200px">ID Barang</th>
                    <td>{{ barang._id }}</td>
                  </tr>
                  <tr>
                    <th>Nama</th>
                    <td>{{ barang.nama }}</td>
                  </tr>
                  <tr>
                    <th>Kategori</th>
                    <td>{{ barang.kategori?.nama || 'Tidak ada kategori' }}</td>
                  </tr>
                  <tr>
                    <th>Grade</th>
                    <td>{{ barang.grade }}</td>
                  </tr>
                  <tr>
                    <th>Harga</th>
                    <td>Rp {{ formatCurrency(barang.harga) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="col-md-6">
              <table class="table">
                <tbody>
                  <tr>
                    <th style="width: 200px">Batas Minimal Stok</th>
                    <td>{{ barang.minStok }} unit</td>
                  </tr>
                  <tr>
                    <th>Jumlah Terjual</th>
                    <td>{{ barang.jumlahTerjual || 0 }} unit</td>
                  </tr>
                  <tr>
                    <th>Tanggal Dibuat</th>
                    <td>{{ formatDateTime(barang.createdAt) }}</td>
                  </tr>
                  <tr>
                    <th>Terakhir Diperbarui</th>
                    <td>{{ formatDateTime(barang.updatedAt) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Promo Information Card -->
      <div v-if="hasActivePromo || hasExpiredPromo" class="card mt-4 shadow-sm border-0">
        <div class="card-header bg-white">
          <h5 class="card-title mb-0">Informasi Promo</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <table class="table">
                <tbody>
                  <tr>
                    <th style="width: 200px">Potongan Harga</th>
                    <td>Rp {{ formatCurrency(barang.promo?.potonganHarga) }}</td>
                  </tr>
                  <tr>
                    <th>Harga Normal</th>
                    <td>Rp {{ formatCurrency(barang.harga) }}</td>
                  </tr>
                  <tr v-if="hasActivePromo">
                    <th>Harga Promo</th>
                    <td class="text-danger">Rp {{ formatCurrency(barang.hargaSetelahDiskon || getDiscountedPrice()) }}</td>
                  </tr>
                  <tr>
                    <th>Tanggal Mulai</th>
                    <td>{{ formatDate(barang.promo?.tanggalMulai) }}</td>
                  </tr>
                  <tr>
                    <th>Tanggal Berakhir</th>
                    <td>{{ formatDate(barang.promo?.tanggalBerakhir) }}</td>
                  </tr>
                  <tr>
                    <th>Status</th>
                    <td class="status-cell">
                      <span v-if="hasActivePromo" class="badge bg-success">Aktif</span>
                      <span v-else class="badge bg-danger">Tidak Aktif</span>
                    </td>
                  </tr>
                  <tr>
                    <th>Keterangan</th>
                    <td>{{ barang.promo?.keterangan || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="col-md-6">
              <div v-if="hasActivePromo" class="card bg-light border-0">
                <div class="card-body">
                  <h5 class="card-title">Informasi Promo</h5>
                  <p class="card-text">
                    Promo ini akan berakhir dalam <strong>{{ remainingDays }} hari</strong> lagi. 
                    Pelanggan akan mendapatkan potongan harga sebesar <strong>Rp {{ formatCurrency(barang.promo?.potonganHarga) }}</strong> 
                    dari harga normal.
                  </p>
                  <div class="progress mb-3">
                    <div 
                      class="progress-bar bg-success" 
                      role="progressbar" 
                      :style="`width: ${promoProgress}%`" 
                      :aria-valuenow="promoProgress" 
                      aria-valuemin="0" 
                      aria-valuemax="100"
                    >
                      {{ promoProgress }}%
                    </div>
                  </div>
                  <p class="small text-muted">
                    Promo telah berjalan {{ elapsedDays }} hari dari total {{ totalPromoDays }} hari
                  </p>
                </div>
              </div>
              
              <div v-else class="alert alert-warning h-100 d-flex align-items-center">
                <div>
                  <i class="bi bi-clock-history me-2"></i>
                  <strong>Promo Telah Berakhir!</strong> 
                  <p class="mb-0 mt-2">Promo ini telah berakhir pada tanggal {{ formatDate(barang.promo?.tanggalBerakhir) }}.</p>
                  <router-link :to="`/barang/${barangId}/edit`" class="btn btn-outline-primary btn-sm mt-3">
                    <i class="bi bi-plus-lg me-1"></i> Buat Promo Baru
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="text-center mt-4 py-5 bg-light rounded shadow-sm">
        <i class="bi bi-tag display-1 text-muted"></i>
        <p class="mt-3 text-muted">Tidak ada promo untuk barang ini</p>
        <router-link :to="`/barang/${barangId}/edit`" class="btn btn-outline-primary">
          <i class="bi bi-plus-lg me-2"></i> Tambahkan Promo
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const barangId = computed(() => route.params.id)

// Data
const barang = ref({
  nama: '',
  kategoriId: '',
  kategori: null,
  grade: '',
  harga: 0,
  stokBagus: 0,
  stokRusak: 0,
  minStok: 5,
  jumlahTerjual: 0,
  promo: null,
  createdAt: null,
  updatedAt: null
})
const isLoading = ref(true)

// Computed properties
const isLowStock = computed(() => {
  return barang.value.stokBagus < barang.value.minStok
})

const hasActivePromo = computed(() => {
  if (!barang.value.promo) return false
  
  const now = new Date()
  const endDate = new Date(barang.value.promo.tanggalBerakhir)
  return endDate > now
})

const hasExpiredPromo = computed(() => {
  if (!barang.value.promo) return false
  
  const now = new Date()
  const endDate = new Date(barang.value.promo.tanggalBerakhir)
  return endDate <= now
})

const remainingDays = computed(() => {
  if (!hasActivePromo.value) return 0
  
  const now = new Date()
  const endDate = new Date(barang.value.promo.tanggalBerakhir)
  const diffTime = Math.abs(endDate - now)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
})

const elapsedDays = computed(() => {
  if (!barang.value.promo) return 0
  
  const now = new Date()
  const startDate = new Date(barang.value.promo.tanggalMulai)
  
  // If promo hasn't started yet
  if (startDate > now) return 0
  
  const diffTime = Math.abs(now - startDate)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
})

const totalPromoDays = computed(() => {
  if (!barang.value.promo) return 0
  
  const startDate = new Date(barang.value.promo.tanggalMulai)
  const endDate = new Date(barang.value.promo.tanggalBerakhir)
  const diffTime = Math.abs(endDate - startDate)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
})

const promoProgress = computed(() => {
  if (totalPromoDays.value === 0) return 0
  return Math.round((elapsedDays.value / totalPromoDays.value) * 100)
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

function formatDateTime(dateString) {
  if (!dateString) return '-'
  
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  return new Date(dateString).toLocaleDateString('id-ID', options)
}

function getDiscountedPrice() {
  if (!hasActivePromo.value) return barang.value.harga
  
  // Jika server telah menghitung hargaSetelahDiskon
  if (barang.value.hargaSetelahDiskon !== undefined) {
    return barang.value.hargaSetelahDiskon
  }
  
  // Jika menggunakan potonganHarga (sistem baru)
  if (barang.value.promo.potonganHarga !== undefined) {
    return Math.max(0, barang.value.harga - barang.value.promo.potonganHarga)
  }
  
  // Fallback ke persentaseDiskon (sistem lama)
  if (barang.value.promo.persentaseDiskon !== undefined) {
    const discountAmount = (barang.value.promo.persentaseDiskon / 100) * barang.value.harga
    return Math.max(0, barang.value.harga - discountAmount)
  }
  
  return barang.value.harga
}

// New functions for enhanced stock display
function getStockPercentage() {
  const maxStockDisplay = Math.max(barang.value.minStok * 2, barang.value.stokBagus + 5)
  return Math.min(100, (barang.value.stokBagus / maxStockDisplay) * 100)
}

function getStockLevelClass() {
  if (barang.value.stokBagus < barang.value.minStok) {
    return 'progress-bar bg-danger'
  } else if (barang.value.stokBagus < barang.value.minStok * 1.5) {
    return 'progress-bar bg-warning'
  } else {
    return 'progress-bar bg-success'
  }
}

function getDamagedStockPercentage() {
  const totalStock = barang.value.stokBagus + barang.value.stokRusak
  if (totalStock === 0) return 0
  return Math.round((barang.value.stokRusak / totalStock) * 100)
}

// Fetch barang details
async function fetchBarang() {
  try {
    isLoading.value = true
    const response = await axios.get(`/api/barang/${barangId.value}`)
    barang.value = response.data
    
    // Debug: Periksa struktur data
    console.log('Data barang:', barang.value)
  } catch (error) {
    console.error('Error fetching barang:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchBarang()
})
</script>

<style scoped>
.stock-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 70px;
  height: 70px;
  border-radius: 12px;
}

.good-stock {
  background-color: rgba(25, 135, 84, 0.1);
  color: #198754;
}

.damaged-stock {
  background-color: rgba(220, 53, 69, 0.1);
  color: #dc3545;
}

/* Perbaikan untuk badge status promo */
.badge {
  position: static !important;
  display: inline-block !important;
}

/* Memastikan status promo ditampilkan dengan benar */
.status-cell {
  vertical-align: middle !important;
}

.status-cell .badge {
  padding: 0.35em 0.65em;
  font-weight: 500;
  min-width: 80px;
  text-align: center;
}

/* Memastikan semua cell dalam tabel memiliki vertical alignment yang tepat */
.table td, .table th {
  vertical-align: middle;
}
</style>