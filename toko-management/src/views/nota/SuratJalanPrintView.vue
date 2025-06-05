<!-- src/views/nota/SuratJalanPrintView.vue -->
<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4 actions-bar">
      <router-link :to="'/nota'" class="btn btn-outline-secondary">
        <i class="bi bi-arrow-left me-2"></i> Kembali
      </router-link>
      
      <div>
        <button class="btn btn-outline-primary me-2" @click="printSuratJalan">
          <i class="bi bi-printer me-2"></i> Cetak
        </button>
        <button class="btn btn-outline-success" @click="downloadPdf">
          <i class="bi bi-file-earmark-pdf me-2"></i> Download PDF
        </button>
      </div>
    </div>
    
    <!-- Loading Indicator -->
    <div v-if="isLoading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Memuat data...</p>
    </div>
    
    <!-- Surat Jalan Print Preview -->
    <div v-else id="printSection" class="surat-jalan-print p-4 bg-white shadow">
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
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

const route = useRoute()
const nota = ref({})
const isLoading = ref(true)

// Functions
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
    console.log('Nota data for Surat Jalan:', nota.value)
  } catch (error) {
    console.error('Error fetching nota for surat jalan:', error)
  } finally {
    isLoading.value = false
  }
}

// Print nota
function printSuratJalan() {
  window.print()
}

// Download as PDF
async function downloadPdf() {
  const element = document.getElementById('printSection')
  const canvas = await html2canvas(element, {
    scale: 2,
    logging: false,
    useCORS: true
  })
  
  const imgData = canvas.toDataURL('image/png')
  
  // Calculate PDF size from canvas
  const imgWidth = 210 // A4 width in mm
  const pageHeight = 297 // A4 height in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width
  
  const pdf = new jsPDF('p', 'mm', 'a4')
  
  // Add image to PDF
  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
  
  // Save PDF
  pdf.save(`SuratJalan-${nota.value.nomorNota}.pdf`)
}

onMounted(() => {
  fetchNota()
})
</script>

<style>
.surat-jalan-print {
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
  
  #printSection, #printSection * {
    visibility: visible;
  }
  
  #printSection {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    box-shadow: none !important;
  }
  
  .actions-bar {
    display: none !important;
  }
}
</style>

