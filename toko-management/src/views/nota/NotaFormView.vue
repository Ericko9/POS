<!-- src/views/nota/NotaFormView.vue -->
<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1>Buat Nota Penjualan</h1>
      <router-link to="/nota" class="btn btn-outline-secondary">
        <i class="bi bi-arrow-left me-2"></i> Kembali
      </router-link>
    </div>
    
    <!-- Alert Status -->
    <div v-if="alert.show" :class="`alert alert-${alert.type} alert-dismissible fade show`" role="alert">
      {{ alert.message }}
      <button type="button" class="btn-close" @click="alert.show = false"></button>
    </div>
    
    <div class="card mb-4">
      <div class="card-body">
        <form @submit.prevent="submitNota">
          <div class="row">
            <!-- Informasi Pelanggan -->
            <div class="col-md-6">
              <h5 class="mb-3">Informasi Pelanggan</h5>
              
              <!-- Nomor HP Pelanggan (swapped position) -->
              <div class="mb-3 position-relative">
                <label for="noHpPelanggan" class="form-label">Nomor HP <span class="text-danger">*</span></label>
                <input 
                  type="text" 
                  class="form-control" 
                  id="noHpPelanggan" 
                  v-model="form.noHpPelanggan" 
                  required
                  @input="searchCustomerByPhone"
                />
                <!-- Dropdown for phone suggestions -->
                <div v-if="phoneResults.length > 0" class="dropdown-menu show">
                  <a v-for="result in phoneResults" 
                     :key="result.noHpPelanggan" 
                     class="dropdown-item" 
                     href="#" 
                     @click.prevent="selectPhone(result)">
                    {{ result.noHpPelanggan }} ({{ result.namaPelanggan }})
                  </a>
                </div>
              </div>
              
              <!-- Nama Pelanggan (swapped position) -->
              <div class="mb-3 position-relative">
                <label for="namaPelanggan" class="form-label">Nama Pelanggan <span class="text-danger">*</span></label>
                <input 
                  type="text" 
                  class="form-control" 
                  id="namaPelanggan" 
                  v-model="form.namaPelanggan" 
                  required
                />
                <!-- Dropdown for name suggestions -->
                <div v-if="nameResults.length > 0" class="dropdown-menu show">
                  <a v-for="result in nameResults" 
                     :key="result._id" 
                     class="dropdown-item" 
                     href="#" 
                     @click.prevent="selectCustomer(result)">
                    {{ result.namaPelanggan }}
                  </a>
                </div>
              </div>
              
              <div class="mb-3">
                <label for="alamatPelanggan" class="form-label">Alamat</label>
                <textarea 
                  class="form-control" 
                  id="alamatPelanggan" 
                  v-model="form.alamatPelanggan" 
                  rows="3"
                ></textarea>
              </div>
            </div>
            
            <!-- Informasi Nota -->
            <div class="col-md-6">
              <h5 class="mb-3">Informasi Nota</h5>
              
              <div class="mb-3">
                <label for="nomorNota" class="form-label">Nomor Nota</label>
                <input 
                  type="text" 
                  class="form-control" 
                  id="nomorNota" 
                  v-model="form.nomorNota" 
                  readonly
                />
                <div class="form-text">Nomor nota dibuat otomatis oleh sistem.</div>
              </div>
              
              <div class="mb-3">
                <label for="tanggal" class="form-label">Tanggal</label>
                <input 
                  type="date" 
                  class="form-control" 
                  id="tanggal" 
                  v-model="form.tanggal" 
                  required
                />
              </div>
              
              <div class="mb-3">
                <label for="kasirId" class="form-label">Kasir</label>
                <input 
                  type="text" 
                  class="form-control" 
                  id="kasirId" 
                  :value="authStore.user?.nama || 'Kasir'"
                  readonly
                />
              </div>
            </div>
          </div>
          
          <hr class="my-4">
          
          <!-- Daftar Barang -->
          <h5 class="mb-3">Daftar Barang</h5>
          
          <div class="table-responsive mb-3">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th style="width: 40px">No</th>
                  <th>Nama Barang</th>
                  <th>Grade</th>
                  <th>Harga</th>
                  <th>Diskon</th>
                  <th style="width: 120px">Jumlah</th>
                  <th>Subtotal</th>
                  <th style="width: 60px">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in form.items" :key="index">
                  <td>{{ index + 1 }}</td>
                  <td>{{ item.namaBarang }}</td>
                  <td>{{ item.grade }}</td>
                  <td>Rp {{ formatCurrency(item.hargaSatuan) }}</td>
                  <td>Rp {{ formatCurrency(item.potonganHarga) }}</td>
                  <td>
                    <input 
                      type="number" 
                      class="form-control" 
                      v-model="item.jumlah" 
                      min="1" 
                      @change="updateSubtotal(index)"
                    />
                  </td>
                  <td>Rp {{ formatCurrency(item.subtotal) }}</td>
                  <td>
                    <button type="button" class="btn btn-sm btn-outline-danger" @click="removeItem(index)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
                <tr v-if="form.items.length === 0">
                  <td colspan="8" class="text-center py-4">
                    Belum ada barang yang ditambahkan
                  </td>
                </tr>
              </tbody>
              <tfoot v-if="form.items.length > 0">
                <tr>
                  <td colspan="6" class="text-end fw-bold">Total:</td>
                  <td class="fw-bold">Rp {{ formatCurrency(totalHarga) }}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          <button type="button" class="btn btn-outline-primary mb-4" @click="showAddItemModal">
            <i class="bi bi-plus-lg me-2"></i> Tambah Barang
          </button>
          
          <hr class="my-4">
          
          <div class="row">
            <div class="col-md-6">
              <div class="mb-3">
                <label for="catatan" class="form-label">Catatan</label>
                <textarea 
                  class="form-control" 
                  id="catatan" 
                  v-model="form.catatan" 
                  rows="3"
                ></textarea>
              </div>
            </div>
            
            <div class="col-md-6">
              <div class="card bg-light">
                <div class="card-body">
                  <h5 class="card-title">Ringkasan Nota</h5>
                  <div class="d-flex justify-content-between mb-2">
                    <span>Jumlah Barang:</span>
                    <span>{{ totalItems }} item</span>
                  </div>
                  <div class="d-flex justify-content-between mb-2">
                    <span>Jumlah Unit:</span>
                    <span>{{ totalQuantity }} pcs</span>
                  </div>
                  <div class="d-flex justify-content-between mb-2">
                    <span>Total Diskon:</span>
                    <span>Rp {{ formatCurrency(totalDiskon) }}</span>
                  </div>
                  <hr>
                  <div class="d-flex justify-content-between fw-bold">
                    <span>Total Pembayaran:</span>
                    <span>Rp {{ formatCurrency(totalHarga) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="d-flex justify-content-end mt-4">
            <button type="button" class="btn btn-secondary me-2" @click="resetForm">
              Reset
            </button>
            <button type="submit" class="btn btn-primary" :disabled="isSaving || form.items.length === 0">
              <span v-if="isSaving" class="spinner-border spinner-border-sm me-2"></span>
              {{ isSaving ? 'Menyimpan...' : 'Simpan Nota' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Modal Tambah Barang -->
    <div class="modal fade" id="addItemModal" tabindex="-1" aria-hidden="true" ref="addItemModal">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Tambah Barang</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <div class="input-group">
                <input 
                  type="text" 
                  class="form-control" 
                  placeholder="Cari barang..." 
                  v-model="searchQuery"
                  @input="searchBarang"
                />
                <button class="btn btn-outline-secondary" type="button">
                  <i class="bi bi-search"></i>
                </button>
              </div>
            </div>
            
            <div v-if="isSearching" class="text-center my-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>
            
            <div v-else-if="searchResults.length === 0 && searchQuery" class="text-center my-4">
              <p class="text-muted">Tidak ada barang yang sesuai dengan pencarian</p>
            </div>
            
            <div v-else-if="searchResults.length > 0" class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Nama Barang</th>
                    <th>Kategori</th>
                    <th>Grade</th>
                    <th>Harga</th>
                    <th>Stok</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="barang in searchResults" :key="barang._id">
                    <td>
                      {{ barang.nama }}
                      <span v-if="hasPromo(barang)" class="badge bg-danger ms-1">
                        <!-- Promo Rp {{ formatCurrency(barang.promo?.potonganHarga) }} -->
                      </span>
                    </td>
                    <td>{{ barang.kategori?.nama || '-' }}</td>
                    <td>{{ barang.grade }}</td>
                    <td>
                      <div v-if="hasPromo(barang)">
                        <span class="text-decoration-line-through me-1">Rp {{ formatCurrency(barang.harga) }}</span>
                        <span class="text-danger">Rp {{ formatCurrency(barang.hargaSetelahDiskon || getDiscountedPrice(barang)) }}</span>
                      </div>
                      <div v-else>Rp {{ formatCurrency(barang.harga) }}</div>
                    </td>
                    <td :class="{'text-danger': barang.stokBagus <= 0}">
                      {{ barang.stokBagus }}
                      <i v-if="barang.stokBagus <= 0" class="bi bi-exclamation-circle-fill text-danger ms-1"></i>
                    </td>
                    <td>
                      <button 
                        type="button" 
                        class="btn btn-sm btn-primary" 
                        @click="addItemToNota(barang)"
                        :disabled="barang.stokBagus <= 0"
                      >
                        <i class="bi bi-plus-lg me-1"></i> Tambah
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
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import axios from 'axios'
import * as bootstrap from 'bootstrap'

const router = useRouter()
const authStore = useAuthStore()

// Modal reference
const addItemModal = ref(null)
let addItemModalInstance = null

// Data
const isSaving = ref(false)
const isSearching = ref(false)
const searchQuery = ref('')
const searchResults = ref([])
const totalHarga = ref(0)

// Customer search results
const phoneResults = ref([])
const nameResults = ref([])
const debounceTimeout = ref(null)

// Alert message
const alert = ref({
  show: false,
  type: 'success',
  message: ''
})

// Form data
const form = ref({
  nomorNota: generateNotaNumber(),
  tanggal: formatDateForInput(new Date()),
  namaPelanggan: '',
  noHpPelanggan: '',
  alamatPelanggan: '',
  catatan: '',
  items: []
})

// Computed properties
const totalItems = computed(() => {
  return form.value.items.length
})

const totalQuantity = computed(() => {
  return form.value.items.reduce((acc, item) => acc + parseInt(item.jumlah), 0)
})

const totalDiskon = computed(() => {
  return form.value.items.reduce((acc, item) => {
    return acc + (item.potonganHarga * item.jumlah)
  }, 0)
})

// Functions
function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID').format(value)
}

function formatDateForInput(date) {
  return date.toISOString().split('T')[0]
}

function generateNotaNumber() {
  const date = new Date()
  const year = date.getFullYear().toString().substr(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  
  return `INV/${year}${month}${day}/${random}`
}

function hasPromo(barang) {
  if (!barang.promo) return false;
  
  // Jika server sudah menyediakan hargaSetelahDiskon, kemungkinan besar ada promo aktif
  if (barang.hargaSetelahDiskon !== undefined) return true;
  
  // Cek secara manual apakah promo masih aktif berdasarkan tanggal
  const now = new Date();
  const endDate = new Date(barang.promo.tanggalBerakhir);
  return endDate > now;
}

function getDiscountedPrice(barang) {
  if (!hasPromo(barang)) return barang.harga
  
  // Jika server telah menghitung hargaSetelahDiskon
  if (barang.hargaSetelahDiskon !== undefined) {
    return barang.hargaSetelahDiskon
  }
  
  // Jika menggunakan potonganHarga (sistem baru)
  if (barang.promo.potonganHarga !== undefined) {
    return Math.max(0, barang.harga - barang.promo.potonganHarga)
  }
  
  // Fallback ke persentaseDiskon (sistem lama)
  if (barang.promo.persentaseDiskon !== undefined) {
    const discountAmount = (barang.promo.persentaseDiskon / 100) * barang.harga
    return Math.max(0, barang.harga - discountAmount)
  }
  
  return barang.harga
}

// Customer search functions
async function searchCustomerByPhone() {
  // Clear previous timeout if exists
  if (debounceTimeout.value) clearTimeout(debounceTimeout.value)
  
  // Clear results if input is empty
  if (!form.value.noHpPelanggan.trim()) {
    phoneResults.value = []
    return
  }
  
  // Debounce function to avoid too many API calls
  debounceTimeout.value = setTimeout(async () => {
    try {
      const response = await axios.get('/api/nota/search', {
        params: { noHpPelanggan: form.value.noHpPelanggan }
      })
      
      // Get unique customers by phone number
      const uniqueCustomers = []
      const phoneMap = new Map()
      
      response.data.forEach(nota => {
        if (!phoneMap.has(nota.noHpPelanggan)) {
          phoneMap.set(nota.noHpPelanggan, nota)
          uniqueCustomers.push(nota)
        }
      })
      
      phoneResults.value = uniqueCustomers
      
      // If there's only one result and it's an exact match, auto-select it
      if (uniqueCustomers.length === 1 && 
          uniqueCustomers[0].noHpPelanggan === form.value.noHpPelanggan) {
        selectPhone(uniqueCustomers[0])
      }
    } catch (error) {
      console.error('Error searching for customers:', error)
      phoneResults.value = []
    }
  }, 300) // 300ms debounce
}

function selectPhone(customer) {
  // Set the phone number
  form.value.noHpPelanggan = customer.noHpPelanggan
  
  // Find all customers with this phone number for name suggestions
  searchCustomerNamesByPhone(customer.noHpPelanggan)
  
  // Auto-fill the name if this is the only customer with this phone
  if (customer.namaPelanggan) {
    form.value.namaPelanggan = customer.namaPelanggan
  }
  
  // Auto-fill address if available
  if (customer.alamatPelanggan) {
    form.value.alamatPelanggan = customer.alamatPelanggan
  }
  
  // Clear results
  phoneResults.value = []
}

async function searchCustomerNamesByPhone(phoneNumber) {
  try {
    const response = await axios.get('/api/nota/search', {
      params: { noHpPelanggan: phoneNumber }
    })
    
    // Get unique customer names for this phone number
    const uniqueNames = []
    const nameMap = new Map()
    
    response.data.forEach(nota => {
      if (!nameMap.has(nota.namaPelanggan)) {
        nameMap.set(nota.namaPelanggan, nota)
        uniqueNames.push(nota)
      }
    })
    
    nameResults.value = uniqueNames
  } catch (error) {
    console.error('Error searching for customer names:', error)
    nameResults.value = []
  }
}

function selectCustomer(customer) {
  // Set customer name
  form.value.namaPelanggan = customer.namaPelanggan
  
  // Set address if available
  if (customer.alamatPelanggan) {
    form.value.alamatPelanggan = customer.alamatPelanggan
  }
  
  // Clear results
  nameResults.value = []
}

function showAddItemModal() {
  addItemModalInstance.show()
  searchQuery.value = ''
  searchResults.value = []
}

async function searchBarang() {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }
  
  try {
    isSearching.value = true
    const response = await axios.get('/api/barang/search', { 
      params: { query: searchQuery.value } 
    })
    searchResults.value = response.data
    console.log('Search results:', response.data)
  } catch (error) {
    console.error('Error searching barang:', error)
  } finally {
    isSearching.value = false
  }
}

function addItemToNota(barang) {
  // Check if item already exists in the nota
  const existingItemIndex = form.value.items.findIndex(item => item.barangId === barang._id)
  
  if (existingItemIndex !== -1) {
    // If exists, increase quantity
    form.value.items[existingItemIndex].jumlah += 1
    updateSubtotal(existingItemIndex)
  } else {
    // Calculate price and discount
    const hargaSatuan = barang.harga
    let potonganHarga = 0
    
    // Get potongan harga if promo exists
    if (hasPromo(barang)) {
      if (barang.promo.potonganHarga !== undefined) {
        potonganHarga = barang.promo.potonganHarga
      } else if (barang.promo.persentaseDiskon !== undefined) {
        // Fallback untuk data lama
        potonganHarga = (barang.promo.persentaseDiskon / 100) * hargaSatuan
      }
    }
    
    // Calculate discounted price per item
    const hargaSetelahDiskon = Math.max(0, hargaSatuan - potonganHarga)
    
    // Add new item
    const newItem = {
      barangId: barang._id,
      namaBarang: barang.nama,
      grade: barang.grade,
      hargaSatuan,
      potonganHarga,
      jumlah: 1,
      subtotal: hargaSetelahDiskon
    }
    
    form.value.items.push(newItem)
  }
  
  // Update total
  calculateTotal()
  
  // Close modal
  addItemModalInstance.hide()
}

function removeItem(index) {
  form.value.items.splice(index, 1)
  calculateTotal()
}

function updateSubtotal(index) {
  const item = form.value.items[index]
  
  // Ensure jumlah is at least 1
  if (item.jumlah < 1) {
    item.jumlah = 1
  }
  
  // Calculate subtotal with discount
  const hargaSetelahDiskon = item.hargaSatuan - item.potonganHarga
  item.subtotal = hargaSetelahDiskon * item.jumlah
  
  // Update total
  calculateTotal()
}

function calculateTotal() {
  totalHarga.value = form.value.items.reduce((acc, item) => acc + item.subtotal, 0)
}

function resetForm() {
  if (confirm('Apakah Anda yakin ingin mengatur ulang formulir? Semua data yang telah dimasukkan akan hilang.')) {
    form.value = {
      nomorNota: generateNotaNumber(),
      tanggal: formatDateForInput(new Date()),
      namaPelanggan: '',
      noHpPelanggan: '',
      alamatPelanggan: '',
      catatan: '',
      items: []
    }
    totalHarga.value = 0
    
    // Clear search results
    phoneResults.value = []
    nameResults.value = []
  }
}

async function submitNota() {
  if (form.value.items.length === 0) {
    showAlert('danger', 'Nota harus memiliki minimal 1 barang');
    return;
  }
  
  try {
    isSaving.value = true;
    
    // Log data yang akan dikirim untuk debugging
    console.log('Sending nota data:', JSON.stringify({
      ...form.value,
      kasirId: authStore.user?._id,
      totalHarga: totalHarga.value
    }, null, 2));
    
    // Pastikan setiap item memiliki barangId, namaBarang, jumlah, hargaSatuan, dan subtotal
    const validatedItems = form.value.items.map(item => ({
      barangId: item.barangId,
      namaBarang: item.namaBarang,
      grade: item.grade,
      hargaSatuan: item.hargaSatuan,
      potonganHarga: item.potonganHarga || 0,
      jumlah: parseInt(item.jumlah),
      subtotal: item.subtotal
    }));
    
    // Kirim data nota
    const response = await axios.post('/api/nota', {
      ...form.value,
      items: validatedItems,
      kasirId: authStore.user?._id,
      totalHarga: totalHarga.value
    });
    
    showAlert('success', 'Nota berhasil disimpan');
    
    // Redirect to combined print view after 1.5 seconds
    setTimeout(() => {
      router.push(`/nota/${response.data._id}/combined-print`);
    }, 1500);
  } catch (error) {
    const message = error.response?.data?.message || 'Terjadi kesalahan saat menyimpan nota';
    showAlert('danger', message);
    console.error('Error saving nota:', error);
  } finally {
    isSaving.value = false;
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
  // Initialize Bootstrap modal
  addItemModalInstance = new bootstrap.Modal(addItemModal.value)
})
</script>

<style scoped>
.dropdown-menu {
  position: absolute;
  z-index: 1000;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
}

.dropdown-item {
  cursor: pointer;
  padding: 0.5rem 1rem;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
}
</style>