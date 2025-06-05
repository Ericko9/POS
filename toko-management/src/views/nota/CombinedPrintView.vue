<!-- src/views/nota/CombinedPrintView.vue -->
<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4 actions-bar">
      <router-link :to="'/nota'" class="btn btn-outline-secondary">
        <i class="bi bi-arrow-left me-2"></i> Kembali
      </router-link>
      
      <div class="print-options d-flex align-items-center">
        <div class="form-check form-check-inline me-3">
          <input class="form-check-input" type="checkbox" id="printNota" v-model="printOptions.nota">
          <label class="form-check-label" for="printNota">Nota</label>
        </div>
        <div class="form-check form-check-inline me-3">
          <input class="form-check-input" type="checkbox" id="printSuratJalan" v-model="printOptions.suratJalan">
          <label class="form-check-label" for="printSuratJalan">Surat Jalan</label>
        </div>
        
        <button class="btn btn-outline-primary me-2" @click="printDocuments" :disabled="!canPrint">
          <i class="bi bi-printer me-2"></i> Cetak
        </button>
        <button class="btn btn-outline-success" @click="downloadPdf" :disabled="!canPrint">
          <i class="bi bi-file-earmark-pdf me-2"></i> Download PDF
        </button>
      </div>
    </div>
    
    <!-- Alert for no selection -->
    <div v-if="showAlert" class="alert alert-warning alert-dismissible fade show" role="alert">
      Pilih minimal satu dokumen untuk dicetak.
      <button type="button" class="btn-close" @click="showAlert = false"></button>
    </div>
    
    <!-- Loading Indicator -->
    <div v-if="isLoading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Memuat data...</p>
    </div>
    
    <div v-else class="print-container">
      <!-- Nota Print Preview -->
      <div v-if="printOptions.nota" id="notaSection" class="nota-print p-4 bg-white shadow mb-4">
        <div class="row mb-4">
          <div class="col-6">
            <h2 class="mb-1">Sri Jaya Keramik</h2>
            <p class="mb-1">Jl. Tambakagung, Ds Tambakagung, Kec Puri, Kab Mojokerto</p>
            <p class="mb-0">Telp: 0821-4072-4808</p>
          </div>
          <div class="col-6 text-end">
            <h3 class="mb-1">NOTA PENJUALAN</h3>
            <h5 class="mb-1">{{ nota.nomorNota }}</h5>
            <p class="mb-0">{{ formatDate(nota.tanggal) }}</p>
          </div>
        </div>
        
        <hr class="my-3">
        
        <div class="row mb-4">
          <div class="col-6">
            <h6 class="mb-2">Pelanggan:</h6>
            <p class="mb-1"><strong>{{ nota.namaPelanggan }}</strong></p>
            <p class="mb-1">{{ nota.noHpPelanggan }}</p>
            <p class="mb-0">{{ nota.alamatPelanggan || 'Alamat tidak tersedia' }}</p>
          </div>
          <div class="col-6 text-end">
            <h6 class="mb-2">Kasir:</h6>
            <p class="mb-0">{{ nota.kasir?.nama || 'Kasir tidak tersedia' }}</p>
          </div>
        </div>
        
        <div class="table-responsive mb-4">
          <table class="table table-bordered">
            <thead>
              <tr>
                <th scope="col">No</th>
                <th scope="col">Nama Barang</th>
                <th scope="col">Grade</th>
                <th scope="col">Harga</th>
                <th scope="col">Diskon</th>
                <th scope="col">Jumlah</th>
                <th scope="col">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in nota.items" :key="index">
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
                <td class="fw-bold">Rp {{ formatCurrency(nota.totalHarga) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <div v-if="nota.catatan" class="mb-4">
          <h6>Catatan:</h6>
          <p class="mb-0">{{ nota.catatan }}</p>
        </div>
        
        <hr class="my-4">
        
        <div class="text-center">
          <p class="mb-1">Terima kasih telah berbelanja di toko kami.</p>
          <p class="mb-0">Barang yang sudah dibeli tidak dapat dikembalikan.</p>
        </div>
      </div>
      
      <!-- Surat Jalan Print Preview -->
      <div v-if="printOptions.suratJalan" id="suratJalanSection" class="surat-jalan-print p-4 bg-white shadow">
        <div class="row mb-4">
          <div class="col-6">
            <h2 class="mb-1">Sri Jaya Keramik</h2>
            <p class="mb-1">Jl. Tambakagung, Ds Tambakagung, Kec Puri, Kab Mojokerto</p>
            <p class="mb-0">Telp: 0821-4072-4808</p>
          </div>
          <div class="col-6 text-end">
            <h3 class="mb-1">SURAT JALAN</h3>
            <h5 class="mb-1">{{ nota.nomorNota }}/SJ</h5>
            <p class="mb-0">{{ formatDate(nota.tanggal) }}</p>
          </div>
        </div>
        
        <hr class="my-3">
        
        <div class="row mb-4">
          <div class="col-6">
            <h6 class="mb-2">Pelanggan:</h6>
            <p class="mb-1"><strong>{{ nota.namaPelanggan }}</strong></p>
            <p class="mb-1">{{ nota.noHpPelanggan }}</p>
            <p class="mb-0">{{ nota.alamatPelanggan || 'Alamat tidak tersedia' }}</p>
          </div>
          <div class="col-6 text-end">
            <h6 class="mb-2">Kasir:</h6>
            <p class="mb-0">{{ nota.kasir?.nama || 'Kasir tidak tersedia' }}</p>
          </div>
        </div>
        
        <div class="table-responsive mb-4">
          <table class="table table-bordered">
            <thead>
              <tr>
                <th scope="col">No</th>
                <th scope="col">Nama Barang</th>
                <th scope="col">Grade</th>
                <th scope="col">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in nota.items" :key="index">
                <td>{{ index + 1 }}</td>
                <td>{{ item.namaBarang }}</td>
                <td>{{ item.grade }}</td>
                <td>{{ item.jumlah }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div v-if="nota.catatan" class="mb-4">
          <h6>Catatan:</h6>
          <p class="mb-0">{{ nota.catatan }}</p>
        </div>
        
        <hr class="my-4">
        
        <div class="row mt-5">
          <div class="col-6 text-center">
            <p class="mb-5">Penerima,</p>
            <div class="signature-line"></div>
            <p class="mb-0">({{ nota.namaPelanggan }})</p>
          </div>
          <div class="col-6 text-center">
            <p class="mb-5">Kasir,</p>
            <div class="signature-line"></div>
            <p class="mb-0">({{ nota.kasir?.nama || 'Kasir' }})</p>
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
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

const route = useRoute()
const nota = ref({})
const isLoading = ref(true)
const showAlert = ref(false)

// Print options
const printOptions = ref({
  nota: true,
  suratJalan: true
})

// Computed
const canPrint = computed(() => {
  return printOptions.value.nota || printOptions.value.suratJalan
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

// Fetch nota details
async function fetchNota() {
  try {
    isLoading.value = true
    const response = await axios.get(`/api/nota/${route.params.id}`)
    nota.value = response.data
    
    // Compatibility check for old data
    if (nota.value.items) {
      nota.value.items = nota.value.items.map(item => {
        // Convert diskon (%) to potonganHarga (Rp) if needed
        if (item.diskon !== undefined && item.potonganHarga === undefined) {
          item.potonganHarga = (item.diskon / 100) * item.hargaSatuan;
        }
        return item;
      });
    }
    
    console.log('Nota data:', nota.value);
  } catch (error) {
    console.error('Error fetching nota:', error)
  } finally {
    isLoading.value = false
  }
}

// Print documents
function printDocuments() {
  if (!canPrint.value) {
    showAlert.value = true
    return
  }
  
  window.print()
}

// Helper function to create PDF from an HTML element
async function elementToPdf(elementId) {
  const element = document.getElementById(elementId)
  if (!element) return null
  
  const canvas = await html2canvas(element, {
    scale: 2,
    logging: false,
    useCORS: true
  })
  
  return {
    imgData: canvas.toDataURL('image/png'),
    width: canvas.width,
    height: canvas.height
  }
}

// Download as PDF
async function downloadPdf() {
  if (!canPrint.value) {
    showAlert.value = true
    return
  }
  
  // Create PDF document
  const pdf = new jsPDF('p', 'mm', 'a4')
  const imgWidth = 210 // A4 width in mm
  
  let currentPage = 0
  
  // Add Nota to PDF if selected
  if (printOptions.value.nota) {
    const notaData = await elementToPdf('notaSection')
    if (notaData) {
      if (currentPage > 0) pdf.addPage()
      
      const imgHeight = (notaData.height * imgWidth) / notaData.width
      pdf.addImage(notaData.imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      currentPage++
    }
  }
  
  // Add Surat Jalan to PDF if selected
  if (printOptions.value.suratJalan) {
    const suratJalanData = await elementToPdf('suratJalanSection')
    if (suratJalanData) {
      if (currentPage > 0) pdf.addPage()
      
      const imgHeight = (suratJalanData.height * imgWidth) / suratJalanData.width
      pdf.addImage(suratJalanData.imgData, 'PNG', 0, 0, imgWidth, imgHeight)
    }
  }
  
  // Generate filename based on selected documents
  let filename = ''
  if (printOptions.value.nota && printOptions.value.suratJalan) {
    filename = `Nota-SuratJalan-${nota.value.nomorNota}.pdf`
  } else if (printOptions.value.nota) {
    filename = `Nota-${nota.value.nomorNota}.pdf`
  } else {
    filename = `SuratJalan-${nota.value.nomorNota}.pdf`
  }
  
  // Save PDF
  pdf.save(filename)
}

onMounted(() => {
  fetchNota()
})
</script>

<style>
.nota-print, .surat-jalan-print {
  max-width: 800px;
  margin: 0 auto;
  font-size: 14px;
}

.signature-line {
  border-bottom: 1px solid #000;
  width: 80%;
  margin: 0 auto 10px;
}

@media print {
  body * {
    visibility: hidden;
  }
  
  .print-container, .print-container * {
    visibility: visible;
  }
  
  .print-container {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
  
  .nota-print, .surat-jalan-print {
    box-shadow: none !important;
    margin-bottom: 0 !important;
    page-break-after: always;
  }
  
  .actions-bar, .alert {
    display: none !important;
  }
}
</style>