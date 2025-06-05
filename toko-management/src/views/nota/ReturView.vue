<!-- src/views/nota/ReturView.vue -->
<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1>Retur Barang</h1>
      <router-link to="/nota" class="btn btn-outline-secondary">
        <i class="bi bi-arrow-left me-2"></i> Kembali ke Nota
      </router-link>
    </div>
    
    <!-- Alert Status -->
    <div v-if="alert.show" :class="`alert alert-${alert.type} alert-dismissible fade show`" role="alert">
      {{ alert.message }}
      <button type="button" class="btn-close" @click="alert.show = false"></button>
    </div>
    
    <!-- Search Nota Form -->
    <div class="card mb-4">
      <div class="card-header bg-white">
        <h5 class="card-title mb-0">Cari Nota</h5>
      </div>
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-4">
            <label for="nomorNota" class="form-label">Nomor Nota</label>
            <input 
              type="text" 
              class="form-control" 
              id="nomorNota" 
              v-model="searchQuery.nomorNota"
              placeholder="Masukkan nomor nota" 
              @keyup.enter="searchNota"
            />
          </div>
          <div class="col-md-4">
            <label for="noHpPelanggan" class="form-label">Nomor HP Pelanggan</label>
            <input 
              type="text" 
              class="form-control" 
              id="noHpPelanggan" 
              v-model="searchQuery.noHpPelanggan"
              placeholder="Masukkan nomor HP" 
              @keyup.enter="searchNota"
            />
          </div>
          <div class="col-md-4 d-flex align-items-end">
            <button class="btn btn-primary w-100" @click="searchNota" :disabled="isSearching">
              <span v-if="isSearching" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="bi bi-search me-2"></i> 
              {{ isSearching ? 'Mencari...' : 'Cari Nota' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Search Results -->
    <div v-if="showSearchResults" class="card mb-4">
      <div class="card-header bg-white d-flex justify-content-between align-items-center">
        <h5 class="card-title mb-0">Hasil Pencarian</h5>
        <button class="btn btn-sm btn-outline-secondary" @click="clearSearch">
          <i class="bi bi-x-lg me-1"></i> Bersihkan
        </button>
      </div>
      <div class="card-body">
        <div v-if="searchResults.length === 0" class="text-center py-4">
          <i class="bi bi-file-earmark-x display-1 text-muted"></i>
          <p class="mt-3">Tidak ada nota yang ditemukan</p>
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Nomor Nota</th>
                <th>Tanggal</th>
                <th>Pelanggan</th>
                <th>Total</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="nota in searchResults" :key="nota._id">
                <td>{{ nota.nomorNota }}</td>
                <td>{{ formatDate(nota.tanggal) }}</td>
                <td>
                  <div>{{ nota.namaPelanggan }}</div>
                  <small class="text-muted">{{ nota.noHpPelanggan }}</small>
                </td>
                <td>Rp {{ formatCurrency(nota.totalHarga) }}</td>
                <td>
                  <button class="btn btn-sm btn-primary" @click="selectNota(nota)">
                    <i class="bi bi-arrow-return-left me-1"></i> Proses Retur
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <!-- Nota Detail for Retur -->
    <div v-if="selectedNota" class="card mb-4">
      <div class="card-header bg-white">
        <h5 class="card-title mb-0">Detail Nota: {{ selectedNota.nomorNota }}</h5>
      </div>
      <div class="card-body">
        <div class="row mb-4">
          <div class="col-md-6">
            <table class="table table-sm table-borderless">
              <tr>
                <th style="width: 150px">Nomor Nota</th>
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
            </table>
          </div>
          
          <div class="col-md-6">
            <table class="table table-sm table-borderless">
              <tr>
                <th style="width: 150px">Nama Pelanggan</th>
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
        
        <h6 class="mb-3">Pilih Barang untuk Diretur</h6>
        <div class="table-responsive">
          <table class="table table-bordered">
            <thead>
              <tr>
                <th>Nama Barang</th>
                <th>Grade</th>
                <th>Harga</th>
                <th>Diskon</th>
                <th>Harga Setelah Diskon</th>
                <th>Jumlah Beli</th>
                <th>Jumlah Retur</th>
                <th>Kondisi Retur</th>
                <th>Alasan</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in selectedNota.items" :key="index">
                <td>{{ item.namaBarang }}</td>
                <td>{{ item.grade }}</td>
                <td>Rp {{ formatCurrency(item.hargaSatuan) }}</td>
                <td>Rp {{ formatCurrency(item.potonganHarga || 0) }}</td>
                <td>Rp {{ formatCurrency(getHargaSetelahDiskon(item)) }}</td>
                <td>{{ item.jumlah }}</td>
                <td>
                  <input 
                    type="number" 
                    class="form-control"
                    v-model="returItems[index].jumlahRetur"
                    :max="item.jumlah"
                    min="0"
                  />
                </td>
                <td>
                  <select 
                    class="form-select"
                    v-model="returItems[index].kondisi"
                    :disabled="!returItems[index].jumlahRetur"
                  >
                    <option value="bagus">Bagus</option>
                    <option value="rusak">Rusak</option>
                  </select>
                </td>
                <td>
                  <input 
                    type="text" 
                    class="form-control"
                    v-model="returItems[index].alasan"
                    :disabled="!returItems[index].jumlahRetur"
                    placeholder="Alasan retur"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="d-flex justify-content-end mt-3">
          <button class="btn btn-secondary me-2" @click="cancelRetur">
            Batal
          </button>
          <button class="btn btn-primary" @click="processRetur" :disabled="!hasReturItems || isSaving">
            <span v-if="isSaving" class="spinner-border spinner-border-sm me-2"></span>
            {{ isSaving ? 'Memproses...' : 'Proses Retur' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Retur History -->
    <div class="card mb-4">
      <div class="card-header bg-white d-flex justify-content-between align-items-center">
        <h5 class="card-title mb-0">Riwayat Retur</h5>
        <div class="d-flex">
          <input 
            type="date" 
            class="form-control me-2" 
            v-model="returFilters.startDate"
          />
          <input 
            type="date" 
            class="form-control me-2" 
            v-model="returFilters.endDate"
          />
          <button class="btn btn-outline-primary" @click="fetchReturHistory">
            <i class="bi bi-search"></i>
          </button>
        </div>
      </div>
      <div class="card-body">
        <div v-if="isLoadingHistory" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2">Memuat data...</p>
        </div>
        <div v-else-if="returHistory.length === 0" class="text-center py-4">
          <i class="bi bi-arrow-return-left display-1 text-muted"></i>
          <p class="mt-3">Belum ada riwayat retur</p>
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Nomor Nota</th>
                <th>Barang</th>
                <th>Jumlah</th>
                <th class="text-center">Kondisi</th>
                <th>Alasan</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="retur in returHistory" :key="retur._id">
                <td>{{ formatDate(retur.tanggal) }}</td>
                <td>
                  <router-link :to="`/retur/detail/${retur._id}`">{{ retur.nomorNota }}</router-link>
                </td>
                <td>{{ retur.namaBarang }}</td>
                <td>{{ retur.jumlahRetur }}</td>
                <td class="kondisi-cell text-center">
                  <span 
                    :class="`badge ${retur.kondisi === 'bagus' ? 'bg-success' : 'bg-danger'}`"
                  >
                    {{ retur.kondisi === 'bagus' ? 'Bagus' : 'Rusak' }}
                  </span>
                </td>
                <td>{{ retur.alasan || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'

// Data
const searchQuery = ref({
  nomorNota: '',
  noHpPelanggan: ''
})
const searchResults = ref([])
const showSearchResults = ref(false)
const isSearching = ref(false)
const selectedNota = ref(null)
const returItems = ref([])
const isSaving = ref(false)
const returHistory = ref([])
const isLoadingHistory = ref(false)

// Alert message
const alert = ref({
  show: false,
  type: 'success',
  message: ''
})

// Return filters
const returFilters = ref({
  startDate: '',
  endDate: ''
})

// Computed
const hasReturItems = computed(() => {
  return returItems.value.some(item => item.jumlahRetur > 0)
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

function getHargaSetelahDiskon(item) {
  if (!item) return 0;

  // Jika ada diskon (lama) tapi tidak ada potonganHarga (baru)
  if (item.diskon !== undefined && item.potonganHarga === undefined) {
    const discountAmount = (item.diskon / 100) * item.hargaSatuan;
    return Math.max(0, item.hargaSatuan - discountAmount);
  }

  // Jika menggunakan potonganHarga (sistem baru)
  if (item.potonganHarga !== undefined) {
    return Math.max(0, item.hargaSatuan - item.potonganHarga);
  }

  return item.hargaSatuan;
}

// Search for nota
async function searchNota() {
  if (!searchQuery.value.nomorNota && !searchQuery.value.noHpPelanggan) {
    showAlert('warning', 'Masukkan nomor nota atau nomor HP pelanggan untuk mencari')
    return
  }

  try {
    isSearching.value = true
    showSearchResults.value = true
    
    const params = {
      nomorNota: searchQuery.value.nomorNota,
      noHpPelanggan: searchQuery.value.noHpPelanggan
    }
    
    const response = await axios.get('/api/nota/search', { params })
    searchResults.value = response.data
  } catch (error) {
    console.error('Error searching nota:', error)
    showAlert('danger', 'Gagal mencari nota')
  } finally {
    isSearching.value = false
  }
}

// Clear search results
function clearSearch() {
  searchQuery.value = {
    nomorNota: '',
    noHpPelanggan: ''
  }
  searchResults.value = []
  showSearchResults.value = false
  selectedNota.value = null
}

// Select nota for return
function selectNota(nota) {
  selectedNota.value = nota

  // Initialize retur items
  returItems.value = nota.items.map(item => ({
    barangId: item.barangId,
    jumlahRetur: 0,
    kondisi: 'bagus',
    alasan: '',
    hargaSatuan: item.hargaSatuan,
    potonganHarga: item.potonganHarga
  }))
}

// Cancel return process
function cancelRetur() {
  selectedNota.value = null
  returItems.value = []
}

// Perbaikan untuk fungsi processRetur di ReturView.vue
async function processRetur() {
  // Validate form
  const invalidItems = returItems.value.filter(item => 
    item.jumlahRetur > 0 && !item.alasan
  )

  if (invalidItems.length > 0) {
    showAlert('warning', 'Harap isi alasan untuk semua barang yang akan diretur')
    return
  }

  try {
    isSaving.value = true
    
    // Prepare retur data
    const returData = {
      notaId: selectedNota.value._id,
      items: returItems.value
        .map((item, index) => {
          // Pastikan format data yang dikirim valid
          return {
            barangId: item.barangId,
            namaBarang: selectedNota.value.items[index].namaBarang,
            grade: selectedNota.value.items[index].grade,
            jumlahRetur: parseInt(item.jumlahRetur),
            kondisi: item.kondisi,
            alasan: item.alasan,
            hargaSatuan: parseFloat(item.hargaSatuan) || 0,
            potonganHarga: parseFloat(item.potonganHarga) || 0
          }
        })
        .filter(item => item.jumlahRetur > 0)
    }
    
    // Debug - log the data being sent
    console.log('Sending retur data:', JSON.stringify(returData, null, 2))
    
    const response = await axios.post('/api/retur', returData)
    console.log('Response from server:', response.data)
    
    showAlert('success', 'Retur berhasil diproses')
    cancelRetur()
    fetchReturHistory()
  } catch (error) {
    const message = error.response?.data?.message || 'Terjadi kesalahan saat memproses retur'
    showAlert('danger', message)
    console.error('Error processing retur:', error)
    console.error('Full error details:', error.response?.data || error.message)
  } finally {
    isSaving.value = false
  }
}

// Fetch return history
async function fetchReturHistory() {
  try {
    isLoadingHistory.value = true
    
    const params = {
      startDate: returFilters.value.startDate,
      endDate: returFilters.value.endDate
    }
    
    const response = await axios.get('/api/retur', { params })
    returHistory.value = response.data
  } catch (error) {
    console.error('Error fetching retur history:', error)
  } finally {
    isLoadingHistory.value = false
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
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 2)

  returFilters.value.startDate = firstDay.toISOString().split('T')[0]
  returFilters.value.endDate = lastDay.toISOString().split('T')[0]

  fetchReturHistory()
})

// Watch for filter changes
watch([
  () => returFilters.value.startDate,
  () => returFilters.value.endDate
], () => {
  fetchReturHistory()
})
</script>

<style scoped>
/* Perbaikan untuk badge kondisi */
.badge {
  position: static !important;
  display: inline-block !important;
  min-width: 70px;
  padding: 0.35em 0.65em;
  font-weight: 500;
}

/* Memastikan kondisi ditampilkan dengan benar */
.kondisi-cell {
  vertical-align: middle !important;
}

/* Memastikan semua cell dalam tabel memiliki vertical alignment yang tepat */
.table td, .table th {
  vertical-align: middle !important;
}

/* Memastikan semua badge muncul dengan tampilan yang sama */
.bg-success, .bg-danger {
  color: white;
}

/* Garis dasar yang konsisten */
.table th.text-center {
  text-align: center !important;
}
</style>