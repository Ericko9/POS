<!-- src/views/supplier/SupplierDetailView.vue -->
<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1>Detail Supplier</h1>
      <div>
        <button class="btn btn-outline-success me-2" @click="showAddSupplyModal">
          <i class="bi bi-box-seam me-2"></i> Tambah Pasokan
        </button>
        <router-link :to="`/supplier/${supplierId}/edit`" class="btn btn-outline-primary me-2">
          <i class="bi bi-pencil me-1"></i> Edit
        </router-link>
        <router-link to="/supplier" class="btn btn-outline-secondary">
          <i class="bi bi-arrow-left me-1"></i> Kembali
        </router-link>
      </div>
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
    
    <div v-else>
      <!-- Supplier Info Card -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <h2 class="mb-3">{{ supplier.nama }}</h2>
              <p v-if="supplier.alamat" class="mb-2">
                <i class="bi bi-geo-alt me-2"></i> {{ supplier.alamat }}
              </p>
              <p v-if="supplier.noHp" class="mb-2">
                <i class="bi bi-telephone me-2"></i> {{ supplier.noHp }}
              </p>
              <p v-if="supplier.email" class="mb-0">
                <i class="bi bi-envelope me-2"></i> {{ supplier.email }}
              </p>
            </div>
            
            <div class="col-md-6 d-flex justify-content-md-end mt-4 mt-md-0">
              <div class="text-center me-4">
                <h6 class="mb-1">Total Pasokan</h6>
                <h3>{{ totalSupplies }}</h3>
              </div>
              
              <div class="text-center">
                <h6 class="mb-1">Total Pembelian</h6>
                <h3>Rp {{ formatCurrency(totalPurchase) }}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Payment Due Warning if applicable -->
      <div v-if="overduePayments.length > 0" class="alert alert-danger mb-4">
        <h5 class="mb-2"><i class="bi bi-exclamation-triangle-fill me-2"></i> Peringatan Pembayaran Jatuh Tempo</h5>
        <p class="mb-2">Ada {{ overduePayments.length }} pembayaran yang telah jatuh tempo:</p>
        <ul class="mb-0">
          <li v-for="payment in overduePayments" :key="payment._id">
            Tanggal Jatuh Tempo: <strong>{{ formatDate(payment.tanggalJatuhTempo) }}</strong> - 
            Rp {{ formatCurrency(payment.totalHarga) }}
            <button class="btn btn-sm btn-success ms-2" @click="markAsPaid(payment)">
              <i class="bi bi-check-circle me-1"></i> Tandai Lunas
            </button>
          </li>
        </ul>
      </div>
      
      <!-- Tabs for Detail Information -->
      <ul class="nav nav-tabs mb-4" id="supplierTab" role="tablist">
        <li class="nav-item" role="presentation">
          <button class="nav-link active" id="supplies-tab" data-bs-toggle="tab" data-bs-target="#supplies-tab-pane" type="button">
            Riwayat Pasokan
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="notes-tab" data-bs-toggle="tab" data-bs-target="#notes-tab-pane" type="button">
            Catatan Kinerja
          </button>
        </li>
      </ul>
      
      <div class="tab-content" id="supplierTabContent">
        <!-- Supplies Tab -->
        <div class="tab-pane fade show active" id="supplies-tab-pane" role="tabpanel" aria-labelledby="supplies-tab" tabindex="0">
          <div class="card">
            <div class="card-body">
              <div v-if="supplies.length === 0" class="text-center py-5 text-muted">
                <i class="bi bi-box-seam display-1"></i>
                <p class="mt-3">Belum ada riwayat pasokan dari supplier ini</p>
                <button class="btn btn-primary" @click="showAddSupplyModal">
                  <i class="bi bi-plus-lg me-2"></i> Tambah Pasokan Baru
                </button>
              </div>
              <div v-else class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>Tanggal Pasok</th>
                      <th>Jumlah Barang</th>
                      <th>Total Harga</th>
                      <th>Tanggal Jatuh Tempo</th>
                      <th class="text-center">Status Pembayaran</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="supply in supplies" :key="supply._id">
                      <td>{{ formatDate(supply.tanggalPasok) }}</td>
                      <td>{{ supply.items.length }} item</td>
                      <td>Rp {{ formatCurrency(supply.totalHarga) }}</td>
                      <td>{{ formatDate(supply.tanggalJatuhTempo) }}</td>
                      <td class="text-center">
                        <div class="d-inline-block">
                          <span v-if="supply.statusPembayaran === 'sudah dibayar'" class="badge bg-success" style="min-width: 80px;">
                            <i class="bi bi-check-circle-fill me-1"></i> Lunas
                          </span>
                          <span v-else-if="isOverdue(supply.tanggalJatuhTempo)" class="badge bg-danger" style="min-width: 80px;">
                            <i class="bi bi-exclamation-circle-fill me-1"></i> Jatuh Tempo
                          </span>
                          <span v-else class="badge bg-warning text-dark" style="min-width: 80px;">
                            <i class="bi bi-clock-fill me-1"></i> Belum Dibayar
                          </span>
                        </div>
                      </td>
                      <td>
                        <button 
                          class="btn btn-sm btn-outline-info me-1" 
                          @click="showSupplyDetail(supply)"
                        >
                          <i class="bi bi-eye"></i>
                        </button>
                        <button 
                          v-if="supply.statusPembayaran === 'belum dibayar'"
                          class="btn btn-sm btn-outline-success" 
                          @click="markAsPaid(supply)"
                        >
                          <i class="bi bi-check-circle"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Notes Tab -->
        <div class="tab-pane fade" id="notes-tab-pane" role="tabpanel" aria-labelledby="notes-tab" tabindex="0">
          <div class="card">
            <div class="card-body">
              <div v-if="!supplier.catatanKinerja" class="text-center py-5 text-muted">
                <i class="bi bi-journal-text display-1"></i>
                <p class="mt-3">Belum ada catatan kinerja untuk supplier ini</p>
                <router-link :to="`/supplier/${supplierId}/edit`" class="btn btn-primary">
                  <i class="bi bi-pencil me-2"></i> Tambahkan Catatan
                </router-link>
              </div>
              <div v-else>
                <h5 class="mb-3">Catatan Kinerja</h5>
                <div class="p-3 bg-light rounded border">
                  <p class="mb-0 white-space-pre-wrap">{{ supplier.catatanKinerja }}</p>
                </div>
                <div class="mt-3 text-end">
                  <router-link :to="`/supplier/${supplierId}/edit`" class="btn btn-outline-primary">
                    <i class="bi bi-pencil me-2"></i> Edit Catatan
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Supply Detail Modal -->
    <div class="modal fade" id="supplyDetailModal" tabindex="-1" aria-hidden="true" ref="supplyDetailModal">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detail Pasokan</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" v-if="selectedSupply">
            <div class="row mb-4">
              <div class="col-md-6">
                <table class="table table-sm">
                  <tr>
                    <th style="width: 150px">Tanggal Pasok</th>
                    <td>{{ formatDate(selectedSupply.tanggalPasok) }}</td>
                  </tr>
                  <tr>
                    <th>Jatuh Tempo</th>
                    <td>{{ formatDate(selectedSupply.tanggalJatuhTempo) }}</td>
                  </tr>
                  <tr>
                    <th>Status</th>
                    <td>
                      <span v-if="selectedSupply.statusPembayaran === 'sudah dibayar'" class="badge bg-success">
                        Lunas
                      </span>
                      <span v-else-if="isOverdue(selectedSupply.tanggalJatuhTempo)" class="badge bg-danger">
                        Jatuh Tempo
                      </span>
                      <span v-else class="badge bg-warning text-dark">
                        Belum Dibayar
                      </span>
                    </td>
                  </tr>
                </table>
              </div>
            </div>
            
            <h6 class="mb-3">Daftar Barang</h6>
            <div class="table-responsive">
              <table class="table table-sm table-bordered">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Barang</th>
                    <th>Jumlah</th>
                    <th>Harga Satuan</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in selectedSupply.items" :key="index">
                    <td>{{ index + 1 }}</td>
                    <td>{{ item.barang?.nama || 'Barang tidak tersedia' }}</td>
                    <td>{{ item.jumlah }}</td>
                    <td>Rp {{ formatCurrency(item.hargaSatuan) }}</td>
                    <td>Rp {{ formatCurrency(item.jumlah * item.hargaSatuan) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="4" class="text-end fw-bold">Total:</td>
                    <td class="fw-bold">Rp {{ formatCurrency(selectedSupply.totalHarga) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button 
              v-if="selectedSupply && selectedSupply.statusPembayaran === 'belum dibayar'"
              class="btn btn-success me-auto" 
              @click="markAsPaid(selectedSupply)"
            >
              <i class="bi bi-check-circle me-1"></i> Tandai Lunas
            </button>
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Add Supply Modal -->
    <div class="modal fade" id="addSupplyModal" tabindex="-1" aria-hidden="true" ref="addSupplyModal">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Tambah Pasokan Baru</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveSupply">
              <div class="row mb-4">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="tanggalPasok" class="form-label">Tanggal Pasok <span class="text-danger">*</span></label>
                    <input 
                      type="date" 
                      class="form-control" 
                      id="tanggalPasok" 
                      v-model="supplyForm.tanggalPasok" 
                      required
                    />
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="tanggalJatuhTempo" class="form-label">Tanggal Jatuh Tempo <span class="text-danger">*</span></label>
                    <input 
                      type="date" 
                      class="form-control" 
                      id="tanggalJatuhTempo" 
                      v-model="supplyForm.tanggalJatuhTempo" 
                      required
                    />
                  </div>
                </div>
              </div>
              
              <h6 class="mb-3">Daftar Barang</h6>
              <div v-for="(item, index) in supplyForm.items" :key="index" class="card mb-3">
                <div class="card-body">
                  <div class="row g-3">
                    <div class="col-md-6">
                      <label :for="`barang-${index}`" class="form-label">Barang <span class="text-danger">*</span></label>
                      <select 
                        :id="`barang-${index}`" 
                        class="form-select" 
                        v-model="item.barangId" 
                        required
                      >
                        <option value="" disabled>Pilih Barang</option>
                        <option v-for="barang in barangs" :key="barang._id" :value="barang._id">
                          {{ barang.nama }} ({{ barang.grade }})
                        </option>
                      </select>
                    </div>
                    <div class="col-md-2">
                      <label :for="`jumlah-${index}`" class="form-label">Jumlah <span class="text-danger">*</span></label>
                      <input 
                        type="number" 
                        class="form-control" 
                        :id="`jumlah-${index}`" 
                        v-model="item.jumlah" 
                        min="1" 
                        required
                      />
                    </div>
                    <div class="col-md-3">
                      <label :for="`harga-${index}`" class="form-label">Harga Satuan <span class="text-danger">*</span></label>
                      <div class="input-group">
                        <span class="input-group-text">Rp</span>
                        <input 
                          type="number" 
                          class="form-control" 
                          :id="`harga-${index}`" 
                          v-model="item.hargaSatuan" 
                          min="0" 
                          required
                        />
                      </div>
                    </div>
                    <div class="col-md-1 d-flex align-items-end">
                      <button 
                        type="button" 
                        class="btn btn-outline-danger w-100" 
                        @click="removeSupplyItem(index)"
                        :disabled="supplyForm.items.length === 1"
                      >
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="mb-3">
                <button type="button" class="btn btn-outline-primary w-100" @click="addSupplyItem">
                  <i class="bi bi-plus-lg me-2"></i> Tambah Barang
                </button>
              </div>
              
              <div class="d-flex justify-content-between align-items-center mt-4">
                <h5 class="mb-0">Total: Rp {{ formatCurrency(calculateTotalSupply) }}</h5>
                <div>
                  <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">Batal</button>
                  <button type="submit" class="btn btn-primary" :disabled="isSavingSupply">
                    <span v-if="isSavingSupply" class="spinner-border spinner-border-sm me-2"></span>
                    {{ isSavingSupply ? 'Menyimpan...' : 'Simpan' }}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import * as bootstrap from 'bootstrap'

const route = useRoute()
const supplierId = computed(() => route.params.id)

// Data
const supplier = ref({})
const supplies = ref([])
const barangs = ref([])
const selectedSupply = ref(null)
const isLoading = ref(true)
const isSavingSupply = ref(false)
const totalSupplies = ref(0)
const totalPurchase = ref(0)

// Modal references
const supplyDetailModal = ref(null)
const addSupplyModal = ref(null)
let supplyDetailModalInstance = null
let addSupplyModalInstance = null

// Form for adding new supply
const supplyForm = ref({
  tanggalPasok: formatDateForInput(new Date()),
  tanggalJatuhTempo: formatDateForInput(getDefaultDueDate()),
  items: [{ barangId: '', jumlah: 1, hargaSatuan: 0 }]
})

// Alert message
const alert = ref({
  show: false,
  type: 'success',
  message: ''
})

// Computed
const calculateTotalSupply = computed(() => {
  return supplyForm.value.items.reduce((total, item) => {
    return total + (item.jumlah * item.hargaSatuan)
  }, 0)
})

const overduePayments = computed(() => {
  return supplies.value.filter(supply => 
    supply.statusPembayaran === 'belum dibayar' && 
    isOverdue(supply.tanggalJatuhTempo)
  )
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

function formatDateForInput(date) {
  return date.toISOString().split('T')[0]
}

function getDefaultDueDate() {
  // Default due date is 30 days from now
  const date = new Date()
  date.setDate(date.getDate() + 30)
  return date
}

function isOverdue(dateString) {
  if (!dateString) return false
  return new Date(dateString) < new Date()
}

// Fetch supplier details
async function fetchSupplier() {
  try {
    isLoading.value = true
    const response = await axios.get(`/api/supplier/${supplierId.value}`)
    supplier.value = response.data
  } catch (error) {
    showAlert('danger', 'Gagal memuat data supplier')
    console.error('Error fetching supplier:', error)
  } finally {
    isLoading.value = false
  }
}

// Fetch supplier supplies
async function fetchSupplies() {
  try {
    const response = await axios.get(`/api/supplier/${supplierId.value}/supplies`)
    supplies.value = response.data.supplies
    totalSupplies.value = response.data.total
    totalPurchase.value = response.data.totalPurchase
  } catch (error) {
    console.error('Error fetching supplies:', error)
  }
}

// Fetch all barangs for supply form
async function fetchBarangs() {
  try {
    const response = await axios.get('/api/barang/list')
    barangs.value = response.data
  } catch (error) {
    console.error('Error fetching barangs:', error)
  }
}

// Show supply detail modal
function showSupplyDetail(supply) {
  selectedSupply.value = supply
  supplyDetailModalInstance.show()
}

// Show add supply modal
function showAddSupplyModal() {
  // Reset form
  supplyForm.value = {
    tanggalPasok: formatDateForInput(new Date()),
    tanggalJatuhTempo: formatDateForInput(getDefaultDueDate()),
    items: [{ barangId: '', jumlah: 1, hargaSatuan: 0 }]
  }
  
  addSupplyModalInstance.show()
}

// Add item to supply form
function addSupplyItem() {
  supplyForm.value.items.push({ barangId: '', jumlah: 1, hargaSatuan: 0 })
}

// Remove item from supply form
function removeSupplyItem(index) {
 if (supplyForm.value.items.length > 1) {
   supplyForm.value.items.splice(index, 1)
 }
}

// Save new supply
async function saveSupply() {
 try {
   isSavingSupply.value = true
   
   const payload = {
     ...supplyForm.value,
     supplierId: supplierId.value,
     totalHarga: calculateTotalSupply.value
   }
   
   await axios.post('/api/supplier/supply', payload)
   
   showAlert('success', 'Pasokan berhasil ditambahkan')
   addSupplyModalInstance.hide()
   
   // Refresh supplies
   fetchSupplies()
 } catch (error) {
   const message = error.response?.data?.message || 'Terjadi kesalahan saat menyimpan pasokan'
   showAlert('danger', message)
   console.error('Error saving supply:', error)
 } finally {
   isSavingSupply.value = false
 }
}

// Mark supply as paid
async function markAsPaid(supply) {
 try {
   await axios.put(`/api/supplier/supply/${supply._id}/paid`)
   
   showAlert('success', 'Pembayaran berhasil ditandai sebagai lunas')
   
   // Refresh supplies
   fetchSupplies()
   
   // Hide modals if needed
   if (supplyDetailModalInstance._element.classList.contains('show')) {
     supplyDetailModalInstance.hide()
   }
 } catch (error) {
   showAlert('danger', 'Gagal menandai pembayaran sebagai lunas')
   console.error('Error marking payment as paid:', error)
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
 fetchSupplier()
 fetchSupplies()
 fetchBarangs()
 
 // Initialize Bootstrap modals
 supplyDetailModalInstance = new bootstrap.Modal(supplyDetailModal.value)
 addSupplyModalInstance = new bootstrap.Modal(addSupplyModal.value)
})
</script>

<style scoped>
.white-space-pre-wrap {
 white-space: pre-wrap;
}

/* Styling for properly positioning status badges */
.table td {
  vertical-align: middle;
}

/* Ensure badges display properly */
.badge {
  position: static !important;
  display: inline-block !important;
}

/* Make sure status column has proper width */
.table th:nth-child(5),
.table td:nth-child(5) {
  min-width: 90px;
  text-align: center;
}

/* Improve readability of status badges */
.bg-success, .bg-warning, .bg-danger {
  font-weight: 500;
  padding: 0.35em 0.65em;
}
</style>