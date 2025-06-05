<!-- src/views/nota/ReturDetailView.vue -->
<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1>Detail Retur</h1>
      <router-link to="/retur" class="btn btn-outline-secondary">
        <i class="bi bi-arrow-left me-2"></i> Kembali ke Retur
      </router-link>
    </div>

    <!-- Loading indicator -->
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3">Memuat data retur...</p>
    </div>

    <!-- Error message -->
    <div v-else-if="error" class="alert alert-danger" role="alert">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ error }}
    </div>

    <!-- Retur details -->
    <div v-else-if="retur" class="card mb-4">
      <div class="card-header bg-white">
        <h5 class="card-title mb-0">Detail Retur</h5>
      </div>
      <div class="card-body">
        <div class="row mb-4">
          <div class="col-md-6">
            <table class="table table-sm table-borderless">
              <tr>
                <th style="width: 150px">ID Retur</th>
                <td>{{ retur._id }}</td>
              </tr>
              <tr>
                <th>Tanggal Retur</th>
                <td>{{ formatDate(retur.tanggal) }}</td>
              </tr>
              <tr>
                <th>Nomor Nota</th>
                <td>
                  <router-link :to="`/nota/${retur.notaId?._id}`">
                    {{ retur.notaId?.nomorNota || 'Nota tidak tersedia' }}
                  </router-link>
                </td>
              </tr>
            </table>
          </div>
          
          <div class="col-md-6" v-if="retur.notaId">
            <table class="table table-sm table-borderless">
              <tr>
                <th style="width: 150px">Nama Pelanggan</th>
                <td>{{ retur.notaId?.namaPelanggan || '-' }}</td>
              </tr>
              <tr>
                <th>No. HP</th>
                <td>{{ retur.notaId?.noHpPelanggan || '-' }}</td>
              </tr>
              <tr>
                <th>Tanggal Nota</th>
                <td>{{ formatDate(retur.notaId?.tanggal) || '-' }}</td>
              </tr>
            </table>
          </div>
        </div>
        
        <h6 class="mb-3">Informasi Barang</h6>
        <div class="table-responsive">
          <table class="table table-bordered">
            <thead>
              <tr>
                <th>Nama Barang</th>
                <th>Grade</th>
                <th>Harga</th>
                <th>Diskon</th>
                <th>Harga Setelah Diskon</th>
                <th>Jumlah Retur</th>
                <th>Kondisi</th>
                <th>Alasan</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{{ retur.namaBarang }}</td>
                <td>{{ retur.grade }}</td>
                <td>Rp {{ formatCurrency(retur.hargaSatuan || notaItemDetails?.hargaSatuan || 0) }}</td>
                <td>Rp {{ formatCurrency(retur.potonganHarga || notaItemDetails?.potonganHarga || 0) }}</td>
                <td>Rp {{ formatCurrency(getHargaSetelahDiskon()) }}</td>
                <td>{{ retur.jumlahRetur }}</td>
                <td>
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
    
    <!-- Not found message -->
    <div v-else class="text-center py-5">
      <i class="bi bi-file-earmark-x display-1 text-muted"></i>
      <p class="mt-3">Data retur tidak ditemukan</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const returId = route.params.id

const retur = ref(null)
const notaItemDetails = ref(null)
const isLoading = ref(true)
const error = ref(null)

// Functions
function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID').format(value)
}

function formatDate(dateString) {
  if (!dateString) return '-'
  
  const options = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(dateString).toLocaleDateString('id-ID', options)
}

function getHargaSetelahDiskon() {
  if (!retur.value) return 0;
  
  // Gunakan harga satuan dari retur jika ada, jika tidak gunakan dari notaItemDetails
  const hargaSatuan = retur.value.hargaSatuan || notaItemDetails.value?.hargaSatuan || 0;
  
  // Gunakan potongan harga dari retur jika ada, jika tidak gunakan dari notaItemDetails
  let potonganHarga = 0;
  
  if (retur.value.potonganHarga !== undefined && retur.value.potonganHarga > 0) {
    potonganHarga = retur.value.potonganHarga;
  } else if (notaItemDetails.value?.potonganHarga !== undefined) {
    potonganHarga = notaItemDetails.value.potonganHarga;
  } else if (retur.value.diskon !== undefined) {
    potonganHarga = (retur.value.diskon / 100) * hargaSatuan;
  } else if (notaItemDetails.value?.diskon !== undefined) {
    potonganHarga = (notaItemDetails.value.diskon / 100) * hargaSatuan;
  }
  
  return Math.max(0, hargaSatuan - potonganHarga);
}

// Fetch nota item details
async function fetchNotaItemDetails() {
  if (!retur.value || !retur.value.notaId || !retur.value.barangId) return;
  
  try {
    const notaResponse = await axios.get(`/api/nota/${retur.value.notaId._id}`);
    const nota = notaResponse.data;
    
    // Cari item nota yang cocok dengan barang di retur
    const notaItem = nota.items.find(item => 
      item.barangId === retur.value.barangId
    );
    
    if (notaItem) {
      notaItemDetails.value = notaItem;
      
      // Update retur data jika diperlukan
      if ((!retur.value.hargaSatuan || retur.value.hargaSatuan === 0) && notaItem.hargaSatuan) {
        try {
          await axios.patch(`/api/retur/${retur.value._id}/update-price`, {
            hargaSatuan: notaItem.hargaSatuan,
            potonganHarga: notaItem.potonganHarga || (notaItem.diskon ? (notaItem.diskon / 100) * notaItem.hargaSatuan : 0)
          });
          console.log("Retur price data updated");
        } catch (e) {
          console.warn("Could not update retur price data:", e);
        }
      }
    }
  } catch (e) {
    console.warn("Could not fetch nota details for price info:", e);
  }
}

// Fetch retur details
async function fetchReturDetails() {
  try {
    isLoading.value = true
    error.value = null
    
    const response = await axios.get(`/api/retur/${returId}`)
    retur.value = response.data
    
    // Jika tidak ada informasi harga, coba ambil dari nota
    if (retur.value && (!retur.value.hargaSatuan || retur.value.hargaSatuan === 0)) {
      await fetchNotaItemDetails();
    }
    
  } catch (err) {
    console.error('Error fetching retur details:', err)
    error.value = err.response?.data?.message || 'Terjadi kesalahan saat mengambil data retur'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchReturDetails()
})
</script>