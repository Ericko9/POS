<!-- src/views/kasir/KasirDetailView.vue -->
<template>
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1>Detail Kasir</h1>
        <div>
          <router-link :to="`/kasir/${kasirId}/edit`" class="btn btn-outline-primary me-2">
            <i class="bi bi-pencil me-1"></i> Edit
          </router-link>
          <router-link to="/kasir" class="btn btn-outline-secondary">
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
        <!-- Kasir Info Card -->
        <div class="card mb-4">
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <h2 class="mb-3">{{ kasir.nama }}</h2>
                <p class="mb-2">
                  <i class="bi bi-person me-2"></i> {{ kasir.username }}
                </p>
                <p v-if="kasir.email" class="mb-2">
                  <i class="bi bi-envelope me-2"></i> {{ kasir.email }}
                </p>
                <p v-if="kasir.noHp" class="mb-0">
                  <i class="bi bi-telephone me-2"></i> {{ kasir.noHp }}
                </p>
              </div>
              
              <div class="col-md-6 mt-4 mt-md-0">
                <div class="row">
                  <div class="col-6">
                    <div class="card bg-primary text-white h-100">
                      <div class="card-body text-center">
                        <h6 class="card-title">Total Penjualan</h6>
                        <h3 class="mb-0">Rp {{ formatCurrency(summary.totalPendapatan) }}</h3>
                      </div>
                    </div>
                  </div>
                  
                  <div class="col-6">
                    <div class="card bg-success text-white h-100">
                      <div class="card-body text-center">
                        <h6 class="card-title">Total Nota</h6>
                        <h3 class="mb-0">{{ summary.totalNota }}</h3>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Filter -->
        <div class="card mb-4">
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Periode</label>
                <div class="input-group">
                  <input 
                    type="date" 
                    class="form-control" 
                    v-model="filters.startDate"
                  />
                  <span class="input-group-text">s/d</span>
                  <input 
                    type="date" 
                    class="form-control" 
                    v-model="filters.endDate"
                  />
                </div>
              </div>
              
              <div class="col-md-3 d-flex align-items-end">
                <button class="btn btn-primary w-100" @click="applyFilters">
                  <i class="bi bi-funnel-fill me-2"></i> Terapkan
                </button>
              </div>
              
              <div class="col-md-3 d-flex align-items-end">
                <button class="btn btn-outline-secondary w-100" @click="exportData">
                  <i class="bi bi-download me-2"></i> Ekspor Excel
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Tabs for Detail Information -->
        <ul class="nav nav-tabs mb-4" id="kasirTab" role="tablist">
          <li class="nav-item" role="presentation">
            <button class="nav-link active" id="performance-tab" data-bs-toggle="tab" data-bs-target="#performance-tab-pane" type="button">
              Performa Penjualan
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link" id="transactions-tab" data-bs-toggle="tab" data-bs-target="#transactions-tab-pane" type="button">
              Riwayat Transaksi
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link" id="notes-tab" data-bs-toggle="tab" data-bs-target="#notes-tab-pane" type="button">
              Catatan Kinerja
            </button>
          </li>
        </ul>
        
        <div class="tab-content" id="kasirTabContent">
          <!-- Performance Tab -->
          <div class="tab-pane fade show active" id="performance-tab-pane" role="tabpanel" aria-labelledby="performance-tab" tabindex="0">
            <div class="card">
              <div class="card-header bg-white">
                <h5 class="card-title mb-0">Grafik Performa Bulanan</h5>
              </div>
              <div class="card-body">
                <Line 
                  v-if="chartData.labels.length" 
                  :data="chartData" 
                  :options="chartOptions" 
                  class="performance-chart" 
                />
                <div v-else class="text-center py-5 text-muted">
                  <i class="bi bi-graph-up display-1"></i>
                  <p class="mt-3">Belum ada data untuk ditampilkan</p>
                </div>
              </div>
            </div>
            
            <div class="card mt-4">
              <div class="card-header bg-white">
                <h5 class="card-title mb-0">Statistik Performa</h5>
              </div>
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table table-striped">
                    <thead>
                      <tr>
                        <th>Bulan</th>
                        <th>Jumlah Nota</th>
                        <th>Total Penjualan</th>
                        <th>Rata-Rata per Nota</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, index) in monthlyStats" :key="index">
                        <td>{{ item.bulan }}</td>
                        <td>{{ item.jumlahNota }}</td>
                        <td>Rp {{ formatCurrency(item.totalPendapatan) }}</td>
                        <td>Rp {{ formatCurrency(item.rataRata) }}</td>
                      </tr>
                      <tr v-if="monthlyStats.length === 0">
                        <td colspan="4" class="text-center">Tidak ada data untuk ditampilkan</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Transactions Tab -->
          <div class="tab-pane fade" id="transactions-tab-pane" role="tabpanel" aria-labelledby="transactions-tab" tabindex="0">
            <div class="card">
              <div class="card-header bg-white">
                <h5 class="card-title mb-0">Riwayat Transaksi</h5>
              </div>
              <div class="card-body">
                <div v-if="isLoadingTransactions" class="text-center py-4">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                  <p class="mt-2">Memuat data transaksi...</p>
                </div>
                <div v-else-if="transactions.length === 0" class="text-center py-5 text-muted">
                  <i class="bi bi-receipt display-1"></i>
                  <p class="mt-3">Belum ada transaksi untuk periode ini</p>
                </div>
                <div v-else class="table-responsive">
                  <table class="table table-hover">
                    <thead>
                      <tr>
                        <th>Tanggal</th>
                        <th>Nomor Nota</th>
                        <th>Pelanggan</th>
                        <th>Jumlah Item</th>
                        <th>Total</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="nota in transactions" :key="nota._id">
                        <td>{{ formatDate(nota.tanggal) }}</td>
                        <td>{{ nota.nomorNota }}</td>
                        <td>{{ nota.namaPelanggan }}</td>
                        <td>{{ nota.items.length }} item</td>
                        <td>Rp {{ formatCurrency(nota.totalHarga) }}</td>
                        <td>
                          <router-link :to="`/nota/${nota._id}/print`" class="btn btn-sm btn-outline-primary">
                            <i class="bi bi-eye"></i>
                          </router-link>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <!-- Pagination -->
                <div v-if="transactions.length > 0" class="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    Menampilkan {{ transactions.length }} dari {{ totalTransactions }} nota
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
          </div>
          
          <!-- Notes Tab -->
          <div class="tab-pane fade" id="notes-tab-pane" role="tabpanel" aria-labelledby="notes-tab" tabindex="0">
            <div class="card">
              <div class="card-body">
                <div v-if="!kasir.catatan" class="text-center py-5 text-muted">
                  <i class="bi bi-journal-text display-1"></i>
                  <p class="mt-3">Belum ada catatan kinerja untuk kasir ini</p>
                  <router-link :to="`/kasir/${kasirId}/edit`" class="btn btn-primary">
                    <i class="bi bi-pencil me-2"></i> Tambahkan Catatan
                  </router-link>
                </div>
                <div v-else>
                  <h5 class="mb-3">Catatan Kinerja</h5>
                  <div class="p-3 bg-light rounded border">
                    <p class="mb-0 white-space-pre-wrap">{{ kasir.catatan }}</p>
                  </div>
                  <div class="mt-3 text-end">
                    <router-link :to="`/kasir/${kasirId}/edit`" class="btn btn-outline-primary">
                      <i class="bi bi-pencil me-2"></i> Edit Catatan
                    </router-link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import axios from 'axios'
  import { Line } from 'vue-chartjs'
  import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
  import * as ExcelJS from 'exceljs'
  import { saveAs } from 'file-saver'
  
  ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)
  
  const route = useRoute()
  const kasirId = computed(() => route.params.id)
  
  // Data
  const kasir = ref({})
  const monthlyStats = ref([])
  const transactions = ref([])
  const isLoading = ref(true)
  const isLoadingTransactions = ref(false)
  const currentPage = ref(1)
  const totalPages = ref(1)
  const totalTransactions = ref(0)
  const limit = 10
  
  // Summary data
  const summary = ref({
    totalPendapatan: 0,
    totalNota: 0,
    rataRata: 0
  })
  
  // Filters
  const filters = ref({
    startDate: '',
    endDate: ''
  })
  
  // Alert message
  const alert = ref({
    show: false,
    type: 'success',
    message: ''
  })
  
  // Chart data
  const chartData = computed(() => {
    const labels = monthlyStats.value.map(stat => stat.bulan)
    
    return {
      labels,
      datasets: [
        {
          label: 'Pendapatan',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(75, 192, 192, 1)',
          tension: 0.3,
          data: monthlyStats.value.map(stat => stat.totalPendapatan)
        },
        {
          label: 'Jumlah Nota',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(54, 162, 235, 1)',
          tension: 0.3,
          data: monthlyStats.value.map(stat => stat.jumlahNota)
        }
      ]
    }
  })
  
  // Chart options
  const chartOptions = ref({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Pendapatan (Rp)'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top'
      }
    }
  })
  
  // Computed
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
  
  // Functions
  function formatCurrency(value) {
    return new Intl.NumberFormat('id-ID').format(value)
  }
  
  function formatDate(dateString) {
    if (!dateString) return '-'
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date(dateString).toLocaleDateString('id-ID', options)
  }
  
  // Initialize date range for current year
  function initDateRange() {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), 0, 1) // January 1st of current year
    const lastDay = new Date(now.getFullYear(), 11, 31) // December 31st of current year
    
    filters.value.startDate = firstDay.toISOString().split('T')[0]
    filters.value.endDate = lastDay.toISOString().split('T')[0]
  }
  
  // Fetch kasir details
  async function fetchKasir() {
    try {
      isLoading.value = true
      const response = await axios.get(`/api/kasir/${kasirId.value}`)
      kasir.value = response.data
    } catch (error) {
      showAlert('danger', 'Gagal memuat data kasir')
      console.error('Error fetching kasir:', error)
    } finally {
      isLoading.value = false
    }
  }
  
  // Fetch monthly stats
  async function fetchMonthlyStats() {
    try {
      const response = await axios.get(`/api/kasir/${kasirId.value}/stats`, {
        params: {
          startDate: filters.value.startDate,
          endDate: filters.value.endDate
        }
      })
      
      monthlyStats.value = response.data.monthlyStats
      summary.value = response.data.summary
    } catch (error) {
      console.error('Error fetching monthly stats:', error)
    }
  }
  
  // Fetch transactions
  async function fetchTransactions() {
    try {
      isLoadingTransactions.value = true
      
      const response = await axios.get(`/api/kasir/${kasirId.value}/transactions`, {
        params: {
          page: currentPage.value,
          limit,
          startDate: filters.value.startDate,
          endDate: filters.value.endDate
        }
      })
      
      transactions.value = response.data.transactions
      totalTransactions.value = response.data.total
      totalPages.value = Math.ceil(response.data.total / limit)
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      isLoadingTransactions.value = false
    }
  }
  
  // Apply filters
  function applyFilters() {
    currentPage.value = 1
    fetchMonthlyStats()
    fetchTransactions()
  }
  
  // Change page
  function changePage(page) {
    currentPage.value = page
    fetchTransactions()
  }
  
  // Export data to Excel
  async function exportData() {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Performa Kasir')
    
    // Add title
    worksheet.mergeCells('A1:D1')
    const titleCell = worksheet.getCell('A1')
    titleCell.value = `Laporan Performa Kasir: ${kasir.value.nama}`
    titleCell.font = { size: 16, bold: true }
    titleCell.alignment = { horizontal: 'center' }
    
    // Add period
    worksheet.mergeCells('A2:D2')
    const periodCell = worksheet.getCell('A2')
    periodCell.value = `Periode: ${filters.value.startDate} s/d ${filters.value.endDate}`
    periodCell.alignment = { horizontal: 'center' }
    
    // Add headers
    worksheet.addRow([])
    worksheet.addRow(['Bulan', 'Jumlah Nota', 'Total Penjualan', 'Rata-rata per Nota'])
    
    // Style the header
    const headerRow = worksheet.getRow(4)
    headerRow.font = { bold: true }
    headerRow.eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE9ECEF' }
      }
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      }
    })
    
    // Add data rows
    monthlyStats.value.forEach(item => {
      worksheet.addRow([
        item.bulan,
        item.jumlahNota,
        item.totalPendapatan,
        item.rataRata
      ])
    })
    
    // Add total row
    worksheet.addRow([
      'TOTAL',
      summary.value.totalNota,
      summary.value.totalPendapatan,
      summary.value.rataRata
    ])
    
    const totalRow = worksheet.getRow(5 + monthlyStats.value.length)
    totalRow.font = { bold: true }
    
    // Set column widths
    worksheet.getColumn(1).width = 20
    worksheet.getColumn(2).width = 15
    worksheet.getColumn(3).width = 20
    worksheet.getColumn(4).width =20
 
 // Format numbers
 for (let i = 5; i <= 5 + monthlyStats.value.length; i++) {
   const row = worksheet.getRow(i)
   
   // Format currency for Total Penjualan and Rata-rata columns
   row.getCell(3).numFmt = '"Rp "#,##0'
   row.getCell(4).numFmt = '"Rp "#,##0'
 }
 
 // Export
 const buffer = await workbook.xlsx.writeBuffer()
 const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
 saveAs(blob, `Laporan_Kasir_${kasir.value.nama}_${new Date().toISOString().slice(0,10)}.xlsx`)
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
 initDateRange()
 fetchKasir()
 fetchMonthlyStats()
 fetchTransactions()
})

// Watch for filter changes
watch([currentPage], () => {
 if (currentPage.value > 1) {
   fetchTransactions()
 }
})
</script>

<style scoped>
.performance-chart {
 height: 400px;
}

.white-space-pre-wrap {
 white-space: pre-wrap;
}
</style>