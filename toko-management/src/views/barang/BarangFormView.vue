<!-- src/views/barang/BarangFormView.vue -->
<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1>{{ isEdit ? 'Edit' : 'Tambah' }} Barang</h1>
      <router-link to="/barang" class="btn btn-outline-secondary">
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
        <form @submit.prevent="saveBarang">
          <div class="row">
            <!-- Basic Information -->
            <div class="col-md-6">
              <h5 class="mb-3">Informasi Dasar</h5>
              
              <div class="mb-3">
                <label for="nama" class="form-label">Nama Barang <span class="text-danger">*</span></label>
                <input 
                  type="text" 
                  class="form-control" 
                  id="nama" 
                  v-model="form.nama" 
                  required
                />
              </div>
              
              <div class="mb-3">
                <label for="kategori" class="form-label">Kategori <span class="text-danger">*</span></label>
                <select class="form-select" id="kategori" v-model="form.kategoriId" required>
                  <option value="" disabled>Pilih Kategori</option>
                  <option v-for="kategori in kategoris" :key="kategori._id" :value="kategori._id">
                    {{ kategori.nama }}
                  </option>
                </select>
              </div>
              
              <div class="mb-3">
                <label for="grade" class="form-label">Grade <span class="text-danger">*</span></label>
                <select class="form-select" id="grade" v-model="form.grade" required>
                  <option value="" disabled>Pilih Grade</option>
                  <option value="A">A (Premium)</option>
                  <option value="B">B (Standard)</option>
                  <option value="C">C (Ekonomis)</option>
                </select>
              </div>
              
              <div class="mb-3">
                <label for="harga" class="form-label">Harga (Rp) <span class="text-danger">*</span></label>
                <input 
                  type="number" 
                  class="form-control" 
                  id="harga" 
                  v-model="form.harga" 
                  min="0" 
                  step="1000" 
                  required
                />
              </div>
            </div>
            
            <!-- Stock Information -->
            <div class="col-md-6">
              <h5 class="mb-3">Informasi Stok</h5>
              
              <div class="mb-3">
                <label for="stokBagus" class="form-label">Stok Barang Bagus <span class="text-danger">*</span></label>
                <input 
                  type="number" 
                  class="form-control" 
                  id="stokBagus" 
                  v-model="form.stokBagus" 
                  min="0" 
                  required
                />
              </div>
              
              <div class="mb-3">
                <label for="stokRusak" class="form-label">Stok Barang Rusak</label>
                <input 
                  type="number" 
                  class="form-control" 
                  id="stokRusak" 
                  v-model="form.stokRusak" 
                  min="0" 
                />
              </div>
              
              <div class="mb-3">
                <label for="minStok" class="form-label">Minimal Stok (Peringatan) <span class="text-danger">*</span></label>
                <input 
                  type="number" 
                  class="form-control" 
                  id="minStok" 
                  v-model="form.minStok" 
                  min="1" 
                  required
                />
                <div class="form-text">
                  Sistem akan memberi peringatan jika stok lebih rendah dari nilai ini.
                </div>
              </div>
            </div>
            
            <!-- Promotion Information -->
            <div class="col-12 mt-4">
              <h5 class="mb-3">Informasi Promo</h5>
              
              <div class="form-check form-switch mb-3">
                <input 
                  class="form-check-input" 
                  type="checkbox" 
                  id="hasPromo" 
                  v-model="hasPromo"
                />
                <label class="form-check-label" for="hasPromo">
                  Barang Memiliki Promo
                </label>
              </div>
              
              <div v-if="hasPromo" class="row">
                <div class="col-md-4">
                  <div class="mb-3">
                    <label for="diskon" class="form-label">Potongan Harga (Rp)</label>
                    <input 
                      type="number" 
                      class="form-control" 
                      id="diskon" 
                      v-model="form.promo.potonganHarga" 
                      min="1" 
                      :max="form.harga - 1"
                      required
                    />
                  </div>
                </div>

                <div class="col-md-4">
                  <div class="mb-3">
                    <label for="hargaSetelahDiskon" class="form-label">Harga Setelah Diskon (Rp)</label>
                    <input 
                      type="number" 
                      class="form-control" 
                      id="hargaSetelahDiskon" 
                      :value="hitungHargaSetelahDiskon" 
                      disabled
                    />
                  </div>
                </div>
                
                <div class="col-md-4">
                  <div class="mb-3">
                    <label for="tanggalMulai" class="form-label">Tanggal Mulai</label>
                    <input 
                      type="date" 
                      class="form-control" 
                      id="tanggalMulai" 
                      v-model="form.promo.tanggalMulai" 
                      required
                    />
                  </div>
                </div>
                
                <div class="col-md-4">
                  <div class="mb-3">
                    <label for="tanggalBerakhir" class="form-label">Tanggal Berakhir</label>
                    <input 
                      type="date" 
                      class="form-control" 
                      id="tanggalBerakhir" 
                      v-model="form.promo.tanggalBerakhir" 
                      required
                    />
                  </div>
                </div>
                
                <div class="col-12">
                  <div class="mb-3">
                    <label for="keterangan" class="form-label">Keterangan Promo</label>
                    <textarea 
                      class="form-control" 
                      id="keterangan" 
                      v-model="form.promo.keterangan" 
                      rows="2"
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Submit Buttons -->
            <div class="col-12 mt-4">
              <div class="d-flex justify-content-end">
                <router-link to="/barang" class="btn btn-secondary me-2">
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
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => route.params.id !== undefined)

// Data
const kategoris = ref([])
const isLoading = ref(true)
const isSaving = ref(false)
const hasPromo = ref(false)

// Form data
const form = ref({
  nama: '',
  kategoriId: '',
  grade: '',
  harga: 0,
  stokBagus: 0,
  stokRusak: 0,
  minStok: 5,
  promo: {
    potonganHarga: 0,
    tanggalMulai: '',
    tanggalBerakhir: '',
    keterangan: ''
  }
})

// Computed property untuk menghitung harga setelah diskon
const hitungHargaSetelahDiskon = computed(() => {
  if (!hasPromo.value || !form.value.promo.potonganHarga) {
    return form.value.harga;
  }
  
  // Pastikan harga setelah diskon tidak negatif
  const hargaSetelahDiskon = form.value.harga - form.value.promo.potonganHarga;
  return hargaSetelahDiskon > 0 ? hargaSetelahDiskon : 0;
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
    const response = await axios.get('/api/kategori')
    kategoris.value = response.data
  } catch (error) {
    console.error('Error fetching kategoris:', error)
  }
}

// Fetch barang if editing
async function fetchBarang() {
  if (!isEdit.value) {
    isLoading.value = false
    return
  }
  
  try {
    isLoading.value = true
    const response = await axios.get(`/api/barang/${route.params.id}`)
    const barang = response.data
    
    form.value = {
      nama: barang.nama,
      kategoriId: barang.kategoriId,
      grade: barang.grade,
      harga: barang.harga,
      stokBagus: barang.stokBagus,
      stokRusak: barang.stokRusak,
      minStok: barang.minStok,
      promo: {
        potonganHarga: 0,
        tanggalMulai: '',
        tanggalBerakhir: '',
        keterangan: ''
      }
    }
    
    // Set promo if exists
    if (barang.promo) {
      hasPromo.value = true
      form.value.promo = {
        potonganHarga: barang.promo.potonganHarga,
        tanggalMulai: formatDate(barang.promo.tanggalMulai),
        tanggalBerakhir: formatDate(barang.promo.tanggalBerakhir),
        keterangan: barang.promo.keterangan || ''
      }
    }
  } catch (error) {
    showAlert('danger', 'Gagal memuat data barang')
    console.error('Error fetching barang:', error)
  } finally {
    isLoading.value = false
  }
}

// Format date for input fields
function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toISOString().split('T')[0]
}

// Initialize form dates
function initFormDates() {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 30) // Default promo duration: 30 days
  
  form.value.promo.tanggalMulai = formatDate(today)
  form.value.promo.tanggalBerakhir = formatDate(tomorrow)
}

// Save barang
async function saveBarang() {
  try {
    isSaving.value = true
    
    // Create a copy of the form data
    const barangData = { ...form.value }
    
    // Add or remove promo based on hasPromo flag
    if (!hasPromo.value) {
      delete barangData.promo
    }
    
    if (isEdit.value) {
      await axios.put(`/api/barang/${route.params.id}`, barangData)
      showAlert('success', 'Barang berhasil diperbarui')
    } else {
      await axios.post('/api/barang', barangData)
      showAlert('success', 'Barang berhasil ditambahkan')
    }
    
    setTimeout(() => {
      router.push('/barang')
    }, 1500)
  } catch (error) {
    const message = error.response?.data?.message || 'Terjadi kesalahan saat menyimpan barang'
    showAlert('danger', message)
    console.error('Error saving barang:', error)
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
  fetchKategoris()
  fetchBarang()
  
  if (!isEdit.value) {
    initFormDates()
    isLoading.value = false
  }
})
</script>