<!-- src/views/analisis/AnalisisKategoriView.vue -->
<template>
  <div class="analisis-container">
    <div class="analisis-header">
      <div class="header-left">
        <h1 class="page-title">Analisis Kategori</h1>
        <!-- <p class="page-subtitle">Analisis penjualan berdasarkan kategori produk Anda</p> -->
      </div>
      <div class="header-actions">
        <button class="action-btn" @click="exportData" title="Ekspor Data">
          <i class="fas fa-file-export"></i>
          <span>Ekspor</span>
        </button>
        <button class="action-btn" @click="fetchKategoriStats" title="Refresh Data">
          <i class="fas fa-sync-alt"></i>
          <span>Refresh</span>
        </button>
      </div>
    </div>
    
    <!-- Filter Panel -->
    <div class="filter-panel">
      <div class="filter-container">
        <div class="filter-group date-range-group">
          <label>Rentang Waktu</label>
          <div class="date-inputs">
            <div class="date-input-wrapper">
              <i class="fas fa-calendar-alt"></i>
              <input 
                type="date" 
                v-model="filters.startDate"
                class="date-input"
              />
            </div>
            <div class="date-separator">
              <span>s/d</span>
            </div>
            <div class="date-input-wrapper">
              <i class="fas fa-calendar-alt"></i>
              <input 
                type="date" 
                v-model="filters.endDate"
                class="date-input"
              />
            </div>
          </div>
        </div>
        
        <div class="filter-group">
          <label for="kategori">Kategori</label>
          <div class="select-container">
            <select id="kategori" v-model="filters.kategoriId">
              <option value="">Semua Kategori</option>
              <option v-for="kategori in kategoris" :key="kategori._id" :value="kategori._id">
                {{ kategori.nama }}
              </option>
            </select>
            <i class="fas fa-chevron-down"></i>
          </div>
        </div>
        
        <div class="filter-group button-group">
          <button class="apply-btn" @click="applyFilters" :disabled="isLoading">
            <i class="fas fa-filter"></i>
            <span>Terapkan Filter</span>
          </button>
        </div>
      </div>
      
      <div class="quick-filters">
        <button 
          @click="setQuickFilter('week')" 
          :class="['quick-filter-btn', { active: activeQuickFilter === 'week' }]">
          Minggu Ini
        </button>
        <button 
          @click="setQuickFilter('month')" 
          :class="['quick-filter-btn', { active: activeQuickFilter === 'month' }]">
          Bulan Ini
        </button>
        <button 
          @click="setQuickFilter('quarter')" 
          :class="['quick-filter-btn', { active: activeQuickFilter === 'quarter' }]">
          Kuartal Ini
        </button>
        <button 
          @click="setQuickFilter('year')" 
          :class="['quick-filter-btn', { active: activeQuickFilter === 'year' }]">
          Tahun Ini
        </button>
        <button 
          @click="setQuickFilter('all')" 
          :class="['quick-filter-btn', { active: activeQuickFilter === 'all' }]">
          Semua Waktu
        </button>
      </div>
    </div>
    
    <!-- Loading Indicator -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner">
        <i class="fas fa-circle-notch fa-spin"></i>
      </div>
      <p>Memuat data analisis kategori...</p>
    </div>
    
    <div v-else>
      <!-- Summary Stats Cards -->
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-box"></i>
          </div>
          <div class="stat-content">
            <h3 class="stat-title">Total Kategori</h3>
            <div class="stat-value">{{ kategoriStats.length }}</div>
            <p class="stat-subtitle">dengan penjualan aktif</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-boxes"></i>
          </div>
          <div class="stat-content">
            <h3 class="stat-title">Total Barang Terjual</h3>
            <div class="stat-value">{{ totalItems }}</div>
            <p class="stat-subtitle">selama periode</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-money-bill-wave"></i>
          </div>
          <div class="stat-content">
            <h3 class="stat-title">Total Pendapatan</h3>
            <div class="stat-value">Rp {{ formatCurrency(totalPendapatan) }}</div>
            <p class="stat-subtitle">dari semua kategori</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-chart-pie"></i>
          </div>
          <div class="stat-content">
            <h3 class="stat-title">Kategori Teratas</h3>
            <div class="stat-value">{{ topCategory ? topCategory.nama : 'Belum ada' }}</div>
            <p class="stat-subtitle" v-if="topCategory">{{ topCategory.persentase.toFixed(1) }}% dari pendapatan</p>
          </div>
        </div>
      </div>
      
      <!-- Charts Section -->
      <div class="charts-section">
        <div class="chart-container pie-chart-container">
          <div class="chart-header">
            <h2>Persentase Penjualan per Kategori</h2>
            <div class="chart-legend-toggle">
              <button @click="toggleLegendPosition" title="Toggle legend position">
                <i class="fas fa-exchange-alt"></i>
              </button>
            </div>
          </div>
          <div class="chart-body">
            <div v-if="pieChartData.labels.length" class="chart-wrapper">
              <Pie 
                :data="pieChartData" 
                :options="pieChartOptions" 
                class="pie-chart" 
              />
            </div>
            <div v-else class="empty-chart">
              <i class="fas fa-chart-pie"></i>
              <p>Belum ada data untuk ditampilkan</p>
            </div>
          </div>
        </div>
        
        <div class="chart-container bar-chart-container">
          <div class="chart-header">
            <h2>Top 5 Kategori Terlaris</h2>
            <div class="chart-actions">
              <button 
                class="chart-type-btn" 
                :class="{ active: chartType === 'items' }"
                @click="chartType = 'items'"
                title="Jumlah Terjual"
              >
                <i class="fas fa-boxes"></i>
              </button>
              <button 
                class="chart-type-btn" 
                :class="{ active: chartType === 'revenue' }"
                @click="chartType = 'revenue'"
                title="Pendapatan"
              >
                <i class="fas fa-money-bill-wave"></i>
              </button>
            </div>
          </div>
          <div class="chart-body">
            <div v-if="barChartData.labels.length" class="chart-wrapper">
              <Bar 
                :data="barChartData" 
                :options="barChartOptions" 
                class="bar-chart" 
              />
            </div>
            <div v-else class="empty-chart">
              <i class="fas fa-chart-bar"></i>
              <p>Belum ada data untuk ditampilkan</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Category Table -->
      <div class="data-table-container">
        <div class="table-header">
          <h2>Detail Penjualan per Kategori</h2>
          <div class="table-actions">
            <div class="search-container">
              <i class="fas fa-search"></i>
              <input type="text" placeholder="Cari kategori..." v-model="searchTerm" class="search-input">
            </div>
            <button class="table-action-btn" @click="exportData" title="Ekspor ke Excel">
              <i class="fas fa-file-excel"></i>
              <span>Ekspor Excel</span>
            </button>
          </div>
        </div>
        <div class="table-body">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th @click="sortTable('nama')" class="sortable-header">
                    Kategori
                    <i :class="getSortIconClass('nama')"></i>
                  </th>
                  <th @click="sortTable('jumlahTerjual')" class="sortable-header">
                    Jumlah Terjual
                    <i :class="getSortIconClass('jumlahTerjual')"></i>
                  </th>
                  <th @click="sortTable('totalPendapatan')" class="sortable-header">
                    Total Pendapatan
                    <i :class="getSortIconClass('totalPendapatan')"></i>
                  </th>
                  <th @click="sortTable('persentase')" class="sortable-header">
                    Persentase
                    <i :class="getSortIconClass('persentase')"></i>
                  </th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(kategori, index) in filteredAndSortedData" :key="index" class="data-row">
                  <td class="category-name">{{ kategori.nama }}</td>
                  <td class="quantity-cell">{{ kategori.jumlahTerjual }}</td>
                  <td class="revenue-cell">Rp {{ formatCurrency(kategori.totalPendapatan) }}</td>
                  <td class="percentage-cell">
                    <div class="progress-container">
                      <div class="progress">
                        <div 
                          class="progress-bar"
                          :style="{
                            width: `${kategori.persentase}%`,
                            backgroundColor: getProgressColor(kategori.persentase)
                          }"
                        ></div>
                      </div>
                      <span class="progress-text">{{ kategori.persentase.toFixed(1) }}%</span>
                    </div>
                  </td>
                  <td>
                    <button class="detail-btn" @click="showKategoriDetail(kategori)">
                      <i class="fas fa-eye"></i>
                      <span>Detail</span>
                    </button>
                  </td>
                </tr>
                <tr v-if="filteredAndSortedData.length === 0">
                  <td colspan="5" class="empty-table-message">
                    <div class="empty-state">
                      <i class="fas fa-search"></i>
                      <p>{{ searchTerm ? 'Tidak ada hasil yang cocok dengan pencarian Anda' : 'Tidak ada data untuk periode ini' }}</p>
                    </div>
                  </td>
                </tr>
              </tbody>
              <tfoot v-if="filteredAndSortedData.length > 0">
                <tr class="total-row">
                  <td>Total</td>
                  <td>{{ totalItems }}</td>
                  <td>Rp {{ formatCurrency(totalPendapatan) }}</td>
                  <td>100%</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Category Detail Modal -->
    <div class="custom-modal" :class="{ 'show': showDetailModal }">
      <div class="modal-backdrop" @click="closeDetailModal"></div>
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h3>
              <span class="category-color-dot" :style="{ backgroundColor: getCategoryColor(selectedKategori?.nama) }"></span>
              Detail Kategori: {{ selectedKategori?.nama }}
            </h3>
            <button class="close-btn" @click="closeDetailModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body" v-if="selectedKategori">
            <div class="detail-stats">
              <div class="detail-stat-card">
                <div class="stat-icon">
                  <i class="fas fa-boxes"></i>
                </div>
                <div class="stat-details">
                  <span class="stat-label">Jumlah Terjual</span>
                  <span class="stat-value">{{ selectedKategori.jumlahTerjual }}</span>
                  <span class="stat-unit">item</span>
                </div>
              </div>
              
              <div class="detail-stat-card">
                <div class="stat-icon">
                  <i class="fas fa-money-bill-wave"></i>
                </div>
                <div class="stat-details">
                  <span class="stat-label">Total Pendapatan</span>
                  <span class="stat-value">Rp {{ formatCurrency(selectedKategori.totalPendapatan) }}</span>
                </div>
              </div>
              
              <div class="detail-stat-card">
                <div class="stat-icon">
                  <i class="fas fa-percentage"></i>
                </div>
                <div class="stat-details">
                  <span class="stat-label">Kontribusi</span>
                  <span class="stat-value">{{ selectedKategori.persentase.toFixed(1) }}%</span>
                  <span class="stat-unit">dari total</span>
                </div>
              </div>
              
              <div class="detail-stat-card">
                <div class="stat-icon">
                  <i class="fas fa-tag"></i>
                </div>
                <div class="stat-details">
                  <span class="stat-label">Rata-rata Per Item</span>
                  <span class="stat-value">Rp {{ formatCurrency(selectedKategori.jumlahTerjual ? selectedKategori.totalPendapatan / selectedKategori.jumlahTerjual : 0) }}</span>
                </div>
              </div>
            </div>
            
            <div class="detail-trend-chart">
              <h4>Trend Penjualan</h4>
              <div class="chart-container">
                <div v-if="detailChartData.labels.length" class="chart-wrapper">
                  <Line 
                    :data="detailChartData" 
                    :options="detailChartOptions" 
                    class="detail-chart" 
                  />
                </div>
                <div v-else class="empty-chart small">
                  <i class="fas fa-chart-line"></i>
                  <p>Belum ada data trend untuk ditampilkan</p>
                </div>
              </div>
            </div>
            
            <div class="detail-products">
              <h4>Produk Terlaris dalam Kategori</h4>
              <div class="table-responsive">
                <table class="data-table detail-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Barang</th>
                      <th>Grade</th>
                      <th>Jumlah Terjual</th>
                      <th>Total Pendapatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(barang, index) in kategoriProducts" :key="barang._id" class="data-row">
                      <td>{{ index + 1 }}</td>
                      <td class="product-name">{{ barang.nama }}</td>
                      <td>{{ barang.grade }}</td>
                      <td>{{ barang.jumlahTerjual }}</td>
                      <td>Rp {{ formatCurrency(barang.totalPendapatan) }}</td>
                    </tr>
                    <tr v-if="kategoriProducts.length === 0">
                      <td colspan="5" class="empty-table-message">
                        <div class="empty-state small">
                          <i class="fas fa-box-open"></i>
                          <p>Tidak ada data produk untuk periode ini</p>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="secondary-btn" @click="closeDetailModal">Tutup</button>
            <button class="primary-btn" @click="exportCategoryDetail">
              <i class="fas fa-file-export"></i>
              Ekspor Detail
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import { Pie, Bar, Line } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import * as ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend)

// Data References
const isLoading = ref(true)
const kategoris = ref([])
const kategoriStats = ref([])
const kategoriProducts = ref([])
const selectedKategori = ref(null)
const monthlyTrend = ref([])
const showDetailModal = ref(false)
const searchTerm = ref('')
const chartType = ref('items') // 'items' or 'revenue'
const activeQuickFilter = ref('month')
const legendPosition = ref('right')

// Sort state
const sortConfig = ref({
  key: 'totalPendapatan',
  direction: 'desc'
})

// Filters
const filters = ref({
  startDate: '',
  endDate: '',
  kategoriId: ''
})

// Computed properties
const totalItems = computed(() => {
  return kategoriStats.value.reduce((acc, item) => acc + item.jumlahTerjual, 0)
})

const totalPendapatan = computed(() => {
  return kategoriStats.value.reduce((acc, item) => acc + item.totalPendapatan, 0)
})

const topCategory = computed(() => {
  if (kategoriStats.value.length === 0) return null
  return [...kategoriStats.value].sort((a, b) => b.totalPendapatan - a.totalPendapatan)[0]
})

// Filtered and sorted data
const filteredAndSortedData = computed(() => {
  let filteredData = [...kategoriStats.value]
  
  // Apply search filter if any
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    filteredData = filteredData.filter(item => 
      item.nama.toLowerCase().includes(term)
    )
  }
  
  // Apply sorting
  filteredData.sort((a, b) => {
    let comparison = 0
    
    if (sortConfig.value.key === 'nama') {
      comparison = a.nama.localeCompare(b.nama)
    } else {
      comparison = a[sortConfig.value.key] - b[sortConfig.value.key]
    }
    
    return sortConfig.value.direction === 'asc' ? comparison : -comparison
  })
  
  return filteredData
})

// Chart data
const pieChartData = computed(() => {
  return {
    labels: kategoriStats.value.map(item => item.nama),
    datasets: [
      {
        backgroundColor: kategoriStats.value.map(item => getCategoryColor(item.nama)),
        hoverBackgroundColor: kategoriStats.value.map(item => getHoverColor(getCategoryColor(item.nama))),
        borderColor: '#ffffff',
        borderWidth: 2,
        data: kategoriStats.value.map(item => item.totalPendapatan)
      }
    ]
  }
})

const pieChartOptions = computed(() => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: legendPosition.value,
        labels: {
          font: {
            family: "'Poppins', sans-serif",
            size: 12
          },
          boxWidth: 15,
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: 'rgba(20, 20, 20, 0.9)',
        titleFont: {
          family: "'Poppins', sans-serif",
          size: 13
        },
        bodyFont: {
          family: "'Poppins', sans-serif",
          size: 12
        },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            const label = context.label || ''
            const value = context.raw || 0
            const total = context.dataset.data.reduce((a, b) => a + b, 0)
            const percentage = Math.round((value / total) * 100)
            return `${label}: Rp ${new Intl.NumberFormat('id-ID').format(value)} (${percentage}%)`
          }
        }
      }
    }
  }
})

const barChartData = computed(() => {
  // Get top 5 categories by sales or revenue
  let topCategories
  
  if (chartType.value === 'items') {
    topCategories = [...kategoriStats.value]
      .sort((a, b) => b.jumlahTerjual - a.jumlahTerjual)
      .slice(0, 5)
  } else {
    topCategories = [...kategoriStats.value]
      .sort((a, b) => b.totalPendapatan - a.totalPendapatan)
      .slice(0, 5)
  }
  
  return {
    labels: topCategories.map(item => item.nama),
    datasets: [
      {
        label: chartType.value === 'items' ? 'Jumlah Terjual' : 'Pendapatan (Rp)',
        backgroundColor: topCategories.map(item => getCategoryColor(item.nama, 0.7)),
        borderColor: topCategories.map(item => getCategoryColor(item.nama)),
        borderWidth: 1,
        borderRadius: 4,
        data: chartType.value === 'items' 
          ? topCategories.map(item => item.jumlahTerjual)
          : topCategories.map(item => item.totalPendapatan)
      }
    ]
  }
})

const barChartOptions = computed(() => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          callback: function(value) {
            if (chartType.value === 'revenue') {
              return 'Rp ' + formatCurrency(value);
            }
            return value;
          },
          font: {
            family: "'Poppins', sans-serif",
            size: 11
          }
        },
        title: {
          display: true,
          text: chartType.value === 'items' ? 'Jumlah Terjual' : 'Pendapatan (Rp)',
          font: {
            family: "'Poppins', sans-serif",
            size: 12,
            weight: 'bold'
          }
        }
      },
      y: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            family: "'Poppins', sans-serif",
            size: 11
          }
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(20, 20, 20, 0.9)',
        titleFont: {
          family: "'Poppins', sans-serif",
          size: 13
        },
        bodyFont: {
          family: "'Poppins', sans-serif",
          size: 12
        },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (chartType.value === 'revenue') {
              label += 'Rp ' + formatCurrency(context.parsed.x);
            } else {
              label += context.parsed.x;
            }
            return label;
          }
        }
      }
    }
  }
})

const detailChartData = computed(() => {
  return {
    labels: monthlyTrend.value.map(item => item.bulan),
    datasets: [
      {
        label: 'Jumlah Terjual',
        backgroundColor: 'rgba(65, 105, 225, 0.2)',
        borderColor: 'rgba(65, 105, 225, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(65, 105, 225, 1)',
        pointBorderColor: '#fff',
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        data: monthlyTrend.value.map(item => item.jumlahTerjual)
      },
      {
        label: 'Pendapatan',
        backgroundColor: 'rgba(46, 204, 113, 0.2)',
        borderColor: 'rgba(46, 204, 113, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(46, 204, 113, 1)',
        pointBorderColor: '#fff',
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        data: monthlyTrend.value.map(item => item.pendapatan),
        yAxisID: 'y1'
      }
    ]
  }
})

const detailChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      position: 'left',
      grid: {
        color: 'rgba(0, 0, 0, 0.05)'
      },
      title: {
        display: true,
        text: 'Jumlah Terjual',
        font: {
          family: "'Poppins', sans-serif",
          size: 11,
          weight: 'bold'
        }
      },
      ticks: {
        font: {
          family: "'Poppins', sans-serif",
          size: 10
        }
      }
    },
    y1: {
      beginAtZero: true,
      position: 'right',
      grid: {
        display: false
      },
      title: {
        display: true,
        text: 'Pendapatan (Rp)',
        font: {
          family: "'Poppins', sans-serif",
          size: 11,
          weight: 'bold'
        }
      },
      ticks: {
        callback: function(value) {
          return 'Rp ' + formatCurrency(value);
        },
        font: {
          family: "'Poppins', sans-serif",
          size: 10
        }
      }
    },
    x: {
      grid: {
        display: false
      },
      ticks: {
        font: {
          family: "'Poppins', sans-serif",
          size: 10
        },
        maxRotation: 45,
        minRotation: 45
      }
    }
  },
  plugins: {
    legend: {
      position: 'top',
      labels: {
        font: {
          family: "'Poppins', sans-serif",
          size: 11
        },
        boxWidth: 12,
        usePointStyle: true
      }
    },
    tooltip: {
      backgroundColor: 'rgba(20, 20, 20, 0.9)',
      titleFont: {
        family: "'Poppins', sans-serif",
        size: 12
      },
      bodyFont: {
        family: "'Poppins', sans-serif",
        size: 11
      },
      padding: 10,
      cornerRadius: 8,
      callbacks: {
        label: function(context) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.datasetIndex === 1) {
            if (context.parsed.y !== null) {
              label += 'Rp ' + formatCurrency(context.parsed.y);
            }
          } else {
            if (context.parsed.y !== null) {
              label += context.parsed.y;
            }
          }
          return label;
        }
      }
    }
  }
}

// Utility Functions
function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID').format(value)
}

function getSortIconClass(key) {
  if (sortConfig.value.key === key) {
    return sortConfig.value.direction === 'asc' 
      ? 'fas fa-sort-up'
      : 'fas fa-sort-down'
  }
  return 'fas fa-sort'
}

function getProgressColor(percentage) {
  if (percentage >= 60) return '#4caf50';
  if (percentage >= 30) return '#2196f3';
  if (percentage >= 15) return '#ff9800';
  return '#9e9e9e';
}

function getCategoryColor(name, opacity = 1) {
  if (!name) return `rgba(149, 165, 166, ${opacity})`;
  
  // Generate a deterministic color based on the category name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    `rgba(65, 105, 225, ${opacity})`, // Royal Blue
    `rgba(46, 204, 113, ${opacity})`, // Emerald Green
    `rgba(155, 89, 182, ${opacity})`, // Amethyst Purple
    `rgba(241, 196, 15, ${opacity})`, // Sunflower Yellow
    `rgba(231, 76, 60, ${opacity})`,  // Pomegranate Red
    `rgba(52, 152, 219, ${opacity})`, // Peter River Blue
    `rgba(230, 126, 34, ${opacity})`, // Carrot Orange
    `rgba(26, 188, 156, ${opacity})`, // Turquoise
    `rgba(243, 156, 18, ${opacity})`, // Orange
    `rgba(211, 84, 0, ${opacity})`,   // Pumpkin
    `rgba(192, 57, 43, ${opacity})`,  // Red
    `rgba(142, 68, 173, ${opacity})`, // Purple
    `rgba(44, 62, 80, ${opacity})`,   // Midnight Blue
    `rgba(39, 174, 96, ${opacity})`,  // Green
    `rgba(41, 128, 185, ${opacity})`, // Blue
    `rgba(127, 140, 141, ${opacity})` // Asbestos
  ];
  
  return colors[Math.abs(hash) % colors.length];
}

function getHoverColor(color) {
  // Brighten the color for hover effect
  return color.replace(/rgba\((\d+), (\d+), (\d+), [\d\.]+\)/, (match, r, g, b) => {
    return `rgba(${Math.min(255, parseInt(r) + 20)}, ${Math.min(255, parseInt(g) + 20)}, ${Math.min(255, parseInt(b) + 20)}, 1)`;
  });
}

// Toggle pie chart legend position
function toggleLegendPosition() {
  legendPosition.value = legendPosition.value === 'right' ? 'bottom' : 'right';
}

// Date utility functions
function setQuickFilter(filterType) {
  activeQuickFilter.value = filterType;
  
  const today = new Date();
  let startDate, endDate;
  
  switch (filterType) {
    case 'week':
      // Start of current week (Sunday)
      startDate = new Date(today);
      startDate.setDate(today.getDate() - today.getDay());
      
      // End of current week (Saturday)
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      break;
      
    case 'month':
      // Start of current month
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      
      // End of current month
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      break;
      
    case 'quarter':
      // Determine current quarter
      const currentQuarter = Math.floor(today.getMonth() / 3);
      
      // Start of current quarter
      startDate = new Date(today.getFullYear(), currentQuarter * 3, 1);
      
      // End of current quarter
      endDate = new Date(today.getFullYear(), (currentQuarter + 1) * 3, 1);
      break;
      
    case 'year':
      // Start of current year
      startDate = new Date(today.getFullYear(), 0, 1);
      
      // End of current year
      endDate = new Date(today.getFullYear(), 11, 31);
      break;
      
    case 'all':
      // Use a very broad range for "all time"
      startDate = new Date(2000, 0, 1);
      endDate = new Date(today.getFullYear() + 1, 11, 31);
      break;
  }
  
  // Format dates for input fields
  filters.value.startDate = startDate.toISOString().split('T')[0];
  filters.value.endDate = endDate.toISOString().split('T')[0];
  
  // Apply the filters
  applyFilters();
}

// Initialize date range for current month
function initDateRange() {
  setQuickFilter('month');
}

// Sort table
function sortTable(key) {
  if (sortConfig.value.key === key) {
    // Toggle direction if same key
    sortConfig.value.direction = sortConfig.value.direction === 'asc' ? 'desc' : 'asc';
  } else {
    // Set new sort key with default desc direction
    sortConfig.value.key = key;
    sortConfig.value.direction = 'desc';
  }
}

// Fetch all kategoris
async function fetchKategoris() {
  try {
    const response = await axios.get('/api/kategori');
    kategoris.value = response.data;
  } catch (error) {
    console.error('Error fetching kategoris:', error);
  }
}

// Fetch kategori stats
async function fetchKategoriStats() {
  try {
    isLoading.value = true;
    
    const params = {
      startDate: filters.value.startDate,
      endDate: filters.value.endDate,
      kategoriId: filters.value.kategoriId
    };
    
    const response = await axios.get('/api/analisis/kategori', { params });
    kategoriStats.value = response.data;
    
    // Reset sort to default when new data is loaded
    sortConfig.value = { key: 'totalPendapatan', direction: 'desc' };
  } catch (error) {
    console.error('Error fetching kategori stats:', error);
  } finally {
    isLoading.value = false;
  }
}

// Show kategori detail
async function showKategoriDetail(kategori) {
  selectedKategori.value = kategori;
  showDetailModal.value = true;
  
  try {
    // Fetch products in this category
    const productsResponse = await axios.get(`/api/analisis/kategori/${kategori._id}/products`, {
      params: {
        startDate: filters.value.startDate,
        endDate: filters.value.endDate
      }
    });
    kategoriProducts.value = productsResponse.data;
    
    // Fetch monthly trend for this category
    const trendResponse = await axios.get(`/api/analisis/kategori/${kategori._id}/trend`, {
      params: {
        startDate: filters.value.startDate,
        endDate: filters.value.endDate
      }
    });
    monthlyTrend.value = trendResponse.data;
  } catch (error) {
    console.error('Error fetching kategori details:', error);
  }
}

// Close detail modal
function closeDetailModal() {
  showDetailModal.value = false;
}

// Apply filters
function applyFilters() {
  fetchKategoriStats();
}

// Export data to Excel
async function exportData() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Kategori');
  
  // Add title
  worksheet.mergeCells('A1:E1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'Laporan Penjualan per Kategori';
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: 'center' };
  
  // Add period
  worksheet.mergeCells('A2:E2');
  const periodCell = worksheet.getCell('A2');
  periodCell.value = `Periode: ${filters.value.startDate} s/d ${filters.value.endDate}`;
  periodCell.alignment = { horizontal: 'center' };
  
  // Add summary section
  worksheet.mergeCells('A4:E4');
  worksheet.getCell('A4').value = 'Ringkasan';
  worksheet.getCell('A4').font = { bold: true };
  worksheet.getCell('A4').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE9ECEF' }
  };
  
  worksheet.addRow(['Total Kategori', kategoriStats.value.length, '', '', '']);
  worksheet.addRow(['Total Barang Terjual', totalItems.value, '', '', '']);
  worksheet.addRow(['Total Pendapatan', `Rp ${formatCurrency(totalPendapatan.value)}`, '', '', '']);
  
  if (topCategory.value) {
    worksheet.addRow(['Kategori Teratas', topCategory.value.nama, `${topCategory.value.persentase.toFixed(1)}%`, '', '']);
  }
  
  // Add spacing
  worksheet.addRow([]);
  
  // Add headers
  worksheet.addRow(['Kategori', 'Jumlah Terjual', 'Total Pendapatan', 'Persentase', 'Rata-rata per Item']);
  
  // Style the header
  const headerRow = worksheet.getRow(9);
  headerRow.font = { bold: true };
  headerRow.eachCell(cell => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE9ECEF' }
    };
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  // Add data rows
  kategoriStats.value.forEach(item => {
    worksheet.addRow([
      item.nama,
      item.jumlahTerjual,
      item.totalPendapatan,
      `${item.persentase.toFixed(1)}%`,
      item.jumlahTerjual > 0 ? item.totalPendapatan / item.jumlahTerjual : 0
    ]);
  });
  
  // Add total row
  worksheet.addRow([
    'TOTAL',
    totalItems.value,
    totalPendapatan.value,
    '100%',
    totalItems.value > 0 ? totalPendapatan.value / totalItems.value : 0
  ]);
  
  const totalRow = worksheet.getRow(10 + kategoriStats.value.length);
  totalRow.font = { bold: true };
  totalRow.eachCell(cell => {
    cell.border = {
      top: { style: 'double' },
      bottom: { style: 'double' }
    };
  });
  
  // Set column widths
  worksheet.getColumn(1).width = 25;
  worksheet.getColumn(2).width = 15;
  worksheet.getColumn(3).width = 20;
  worksheet.getColumn(4).width = 15;
  worksheet.getColumn(5).width = 20;
  
  // Format numbers
  for (let i = 10; i <= 10 + kategoriStats.value.length; i++) {
    const row = worksheet.getRow(i);
    
    // Format currency for Total Pendapatan and Rata-rata per Item columns
    row.getCell(3).numFmt = '"Rp "#,##0';
    row.getCell(5).numFmt = '"Rp "#,##0';
  }
  
  // Format summary values
  worksheet.getRow(7).getCell(2).numFmt = '"Rp "#,##0';
  
  // Export
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Laporan_Kategori_${new Date().toISOString().slice(0,10)}.xlsx`);
}

// Export category detail to Excel
async function exportCategoryDetail() {
  if (!selectedKategori.value) return;
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(`Kategori - ${selectedKategori.value.nama}`);
  
  // Add title
  worksheet.mergeCells('A1:E1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `Detail Kategori: ${selectedKategori.value.nama}`;
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: 'center' };
  
  // Add period
  worksheet.mergeCells('A2:E2');
  const periodCell = worksheet.getCell('A2');
  periodCell.value = `Periode: ${filters.value.startDate} s/d ${filters.value.endDate}`;
  periodCell.alignment = { horizontal: 'center' };
  
  // Add summary section
  worksheet.mergeCells('A4:B4');
  worksheet.getCell('A4').value = 'Ringkasan Kategori';
  worksheet.getCell('A4').font = { bold: true };
  worksheet.getCell('A4').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE9ECEF' }
  };
  
  worksheet.mergeCells('D4:E4');
  worksheet.getCell('D4').value = 'Ringkasan Pendapatan';
  worksheet.getCell('D4').font = { bold: true };
  worksheet.getCell('D4').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE9ECEF' }
  };
  
  worksheet.addRow(['Jumlah Terjual', selectedKategori.value.jumlahTerjual, '', 'Total Pendapatan', `Rp ${formatCurrency(selectedKategori.value.totalPendapatan)}`]);
  worksheet.addRow(['Kontribusi', `${selectedKategori.value.persentase.toFixed(1)}%`, '', 'Rata-rata per Item', `Rp ${formatCurrency(selectedKategori.value.jumlahTerjual ? selectedKategori.value.totalPendapatan / selectedKategori.value.jumlahTerjual : 0)}`]);
  
  // Add spacing
  worksheet.addRow([]);
  
  // Add trend section title
  if (monthlyTrend.value.length > 0) {
    worksheet.mergeCells('A8:E8');
    worksheet.getCell('A8').value = 'Trend Bulanan';
    worksheet.getCell('A8').font = { bold: true };
    worksheet.getCell('A8').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE9ECEF' }
    };
    
    // Add trend headers
    worksheet.addRow(['Bulan', 'Jumlah Terjual', 'Pendapatan', '', '']);
    
    // Style the trend header
    const trendHeaderRow = worksheet.getRow(9);
    trendHeaderRow.font = { bold: true };
    
    // Add trend data
    monthlyTrend.value.forEach(item => {
      worksheet.addRow([
        item.bulan,
        item.jumlahTerjual,
        item.pendapatan,
        '',
        ''
      ]);
    });
    
    // Format trend data
    for (let i = 10; i < 10 + monthlyTrend.value.length; i++) {
      const row = worksheet.getRow(i);
      row.getCell(3).numFmt = '"Rp "#,##0';
    }
    
    // Add spacing
    worksheet.addRow([]);
  }
  
  // Add products section title
  const productsStartRow = monthlyTrend.value.length > 0 ? 12 + monthlyTrend.value.length : 9;
  
  worksheet.mergeCells(`A${productsStartRow}:E${productsStartRow}`);
  worksheet.getCell(`A${productsStartRow}`).value = 'Produk dalam Kategori';
  worksheet.getCell(`A${productsStartRow}`).font = { bold: true };
  worksheet.getCell(`A${productsStartRow}`).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE9ECEF' }
  };
  
  // Add product headers
  worksheet.addRow(['No', 'Barang', 'Grade', 'Jumlah Terjual', 'Total Pendapatan']);
  
  // Style the product header
  const productHeaderRow = worksheet.getRow(productsStartRow + 1);
  productHeaderRow.font = { bold: true };
  
  // Add product data
  kategoriProducts.value.forEach((item, index) => {
    worksheet.addRow([
      index + 1,
      item.nama,
      item.grade,
      item.jumlahTerjual,
      item.totalPendapatan
    ]);
  });
  
  // Format product data
  for (let i = productsStartRow + 2; i < productsStartRow + 2 + kategoriProducts.value.length; i++) {
    const row = worksheet.getRow(i);
    row.getCell(5).numFmt = '"Rp "#,##0';
  }
  
  // Set column widths
  worksheet.getColumn(1).width = 10;
  worksheet.getColumn(2).width = 30;
  worksheet.getColumn(3).width = 10;
  worksheet.getColumn(4).width = 15;
  worksheet.getColumn(5).width = 20;
  
  // Add total row for products
  if (kategoriProducts.value.length > 0) {
    const totalRow = worksheet.addRow([
      '',
      'TOTAL',
      '',
      kategoriProducts.value.reduce((sum, item) => sum + item.jumlahTerjual, 0),
      kategoriProducts.value.reduce((sum, item) => sum + item.totalPendapatan, 0)
    ]);
    
    totalRow.font = { bold: true };
    totalRow.getCell(5).numFmt = '"Rp "#,##0';
  }
  
  // Format summary values
  worksheet.getRow(5).getCell(5).numFmt = '"Rp "#,##0';
  worksheet.getRow(6).getCell(5).numFmt = '"Rp "#,##0';
  
  // Export
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Detail_Kategori_${selectedKategori.value.nama}_${new Date().toISOString().slice(0,10)}.xlsx`);
}

// Watch for changes in search term for UI updates
watch(searchTerm, () => {
  // No need to reset sort when searching
});

// Watch chart type changes to update chart
watch(chartType, () => {
  // No action needed, computed property will update
});

onMounted(() => {
  initDateRange();
  fetchKategoris();
  fetchKategoriStats();
});
</script>

<style scoped>
/* Base Styles */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');

.analisis-container {
  font-family: 'Poppins', sans-serif;
  color: #2d3748;
}

/* Header Styles */
.analisis-header {
  display: flex;
  justify-content: space-between;
  align-items: center; /* Ubah dari flex-start ke center */
  margin-bottom: 24px;
  flex-wrap: nowrap; /* Ubah menjadi nowrap untuk mencegah wrapping pada ukuran layar normal */
  gap: 20px;
  padding: 5px 0; /* Tambah padding atas dan bawah */
}

.header-left {
  flex: 1;
  min-width: 300px;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0; /* Mencegah tombol menyusut */
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center; /* Centering konten tombol */
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #e2e8f0;
  background-color: white;
  color: #4a5568;
  min-width: 100px; /* Menetapkan lebar minimum */
  height: 40px; /* Menetapkan tinggi tetap */
}

.action-btn:hover {
  background-color: #f7fafc;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.action-btn i {
  font-size: 14px;
}

/* Filter Panel Styles */
.filter-panel {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 24px;
  margin-bottom: 24px;
}

.filter-container {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-bottom: 20px;
}

.filter-group {
  flex: 1;
  min-width: 200px;
}

.date-range-group {
  flex: 2;
  min-width: 360px;
}

.button-group {
  flex: 0 0 auto;
  display: flex;
  align-items: flex-end;
}

.filter-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #4a5568;
}

.select-container {
  position: relative;
}

.select-container select {
  width: 100%;
  padding: 10px 14px;
  appearance: none;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s;
}

.select-container select:focus {
  outline: none;
  border-color: #4361ee;
  box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.15);
}

.select-container i {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #a0aec0;
  pointer-events: none;
}

.date-inputs {
  display: flex;
  align-items: center;
  gap: 12px;
}

.date-input-wrapper {
  position: relative;
  flex: 1;
}

.date-input-wrapper i {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #a0aec0;
  pointer-events: none;
}

.date-input {
  width: 100%;
  padding: 10px 14px 10px 40px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  color: #4a5568;
  transition: all 0.2s;
}

.date-input:focus {
  outline: none;
  border-color: #4361ee;
  box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.15);
}

.date-separator {
  color: #a0aec0;
  font-size: 14px;
  padding: 0 4px;
}

.apply-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background-color: #4361ee;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.apply-btn:hover {
  background-color: #3249c2;
  transform: translateY(-1px);
}

.apply-btn:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
  transform: none;
}

.apply-btn i {
  font-size: 14px;
}

.quick-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.quick-filter-btn {
  padding: 6px 12px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  font-size: 12px;
  color: #718096;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-filter-btn:hover {
  background-color: #edf2f7;
}

.quick-filter-btn.active {
  background-color: #4361ee1a;
  border-color: #4361ee;
  color: #4361ee;
  font-weight: 500;
}

/* Loading Indicator */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #a0aec0;
}

.loading-spinner {
  font-size: 40px;
  margin-bottom: 16px;
  color: #4361ee;
}

.loading-container p {
  font-size: 15px;
}

/* Stats Cards */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background-color: #4361ee1a;
  color: #4361ee;
}

.stat-content {
  flex: 1;
}

.stat-title {
  font-size: 14px;
  font-weight: 500;
  color: #718096;
  margin: 0 0 6px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 4px;
}

.stat-subtitle {
  font-size: 12px;
  color: #a0aec0;
  margin: 0;
}

/* Charts Section */
.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.chart-container {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.chart-header {
  padding: 20px 24px;
  border-bottom: 1px solid #edf2f7;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #2d3748;
}

.chart-actions, .chart-legend-toggle {
  display: flex;
  gap: 8px;
}

.chart-type-btn, .chart-legend-toggle button {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #718096;
  cursor: pointer;
  transition: all 0.2s;
}

.chart-type-btn:hover, .chart-legend-toggle button:hover {
  background-color: #edf2f7;
}

.chart-type-btn.active {
  background-color: #4361ee;
  border-color: #4361ee;
  color: white;
}

.chart-body {
  padding: 16px 24px 24px;
  height: 400px;
}

.chart-wrapper {
  height: 100%;
  width: 100%;
}

.empty-chart {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #a0aec0;
  gap: 16px;
}

.empty-chart i {
  font-size: 48px;
}

.empty-chart p {
  font-size: 15px;
  margin: 0;
}

.empty-chart.small {
  height: auto;
  min-height: 150px;
}

.empty-chart.small i {
  font-size: 32px;
}

/* Data Table Styles */
.data-table-container {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  margin-bottom: 24px;
}

.table-header {
  padding: 20px 24px;
  border-bottom: 1px solid #edf2f7;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.table-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #2d3748;
}

.table-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.search-container {
  position: relative;
}

.search-container i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #a0aec0;
  pointer-events: none;
}

.search-input {
  padding: 8px 12px 8px 36px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  color: #4a5568;
  width: 250px;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #4361ee;
  box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.15);
}

.table-action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: #4361ee;
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.table-action-btn:hover {
  background-color: #3249c2;
}

.table-action-btn i {
  font-size: 14px;
}

.table-body {
  padding: 0;
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th, 
.data-table td {
  padding: 16px 24px;
  text-align: left;
  font-size: 14px;
}

.data-table th {
  background-color: #f8fafc;
  font-weight: 600;
  color: #4a5568;
  white-space: nowrap;
}

.sortable-header {
  cursor: pointer;
  user-select: none;
}

.sortable-header i {
  margin-left: 6px;
  font-size: 12px;
}

.data-table td {
  border-bottom: 1px solid #edf2f7;
  color: #2d3748;
}

.data-row:hover {
  background-color: #f8fafc;
}

.category-name {
  font-weight: 500;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress {
  flex: 1;
  height: 8px;
  background-color: #edf2f7;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.detail-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: #4361ee0f;
  border: 1px solid #4361ee33;
  border-radius: 6px;
  color: #4361ee;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.detail-btn:hover {
  background-color: #4361ee1a;
}

.detail-btn i {
  font-size: 12px;
}

.empty-table-message {
  padding: 40px !important;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #a0aec0;
  gap: 16px;
}

.empty-state i {
  font-size: 32px;
}

.empty-state p {
  font-size: 15px;
  margin: 0;
}

.empty-state.small {
  gap: 8px;
}

.empty-state.small i {
  font-size: 24px;
}

.empty-state.small p {
  font-size: 13px;
}

.total-row {
  font-weight: 600;
  background-color: #f8fafc;
}

.total-row td {
  border-top: 2px solid #e2e8f0;
  border-bottom: none !important;
}

/* Custom Modal Styles - DIPERBAIKI */
.custom-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}

.custom-modal.show {
  opacity: 1;
  visibility: visible;
}

.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(3px);
  z-index: 1001; /* Pastikan backdrop berada di bawah dialog */
}

.modal-dialog {
  position: relative;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  transform: translateY(20px);
  transition: transform 0.3s ease;
  z-index: 1002; /* Pastikan dialog berada di atas backdrop */
}

.custom-modal.show .modal-dialog {
  transform: translateY(0);
}

.modal-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 90vh;
  background-color: white; /* Pastikan background putih solid */
  border-radius: 12px;
  overflow: hidden;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #edf2f7;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: white; /* Pastikan background putih solid */
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #2d3748;
  display: flex;
  align-items: center;
  gap: 10px;
}

.category-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #718096;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: #edf2f7;
  color: #e53e3e;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
  background-color: white; /* Pastikan background putih solid */
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #edf2f7;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background-color: white; /* Pastikan background putih solid */
}

.primary-btn, .secondary-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.primary-btn {
  background-color: #4361ee;
  border: none;
  color: white;
}

.primary-btn:hover {
  background-color: #3249c2;
}

.secondary-btn {
  background-color: white;
  border: 1px solid #e2e8f0;
  color: #4a5568;
}

.secondary-btn:hover {
  background-color: #f8fafc;
}

/* Detail Modal Content Styles */
.detail-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.detail-stat-card {
  background-color: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.detail-stat-card .stat-icon {
  width: 40px;
  height: 40px;
  font-size: 16px;
}

.stat-details {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 12px;
  color: #718096;
  margin-bottom: 4px;
}

.stat-details .stat-value {
  font-size: 18px;
  margin: 0;
}

.stat-unit {
  font-size: 11px;
  color: #a0aec0;
  margin-top: 2px;
}

.detail-trend-chart {
  margin-bottom: 24px;
}

.detail-trend-chart h4, .detail-products h4 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #2d3748;
}

.detail-trend-chart .chart-container {
  height: 250px;
}

.detail-products .data-table {
  margin-bottom: 0;
}

.detail-table th, .detail-table td {
  padding: 12px 16px;
  font-size: 13px;
}

.product-name {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Charts */
.pie-chart, .bar-chart {
  height: 100%;
}

.detail-chart {
  height: 100%;
}

/* Responsive Styles */
@media (max-width: 768px) {
  .charts-section {
    grid-template-columns: 1fr;
  }
  
  .search-input {
    width: 100%;
  }
  
  .date-inputs {
    flex-direction: column;
  }
  
  .date-separator {
    display: none;
  }
  
  .filter-container {
    gap: 16px;
  }
  
  .filter-group {
    min-width: 100%;
  }
  
  .date-range-group {
    min-width: 100%;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .chart-header {
    padding: 16px;
  }
  
  .chart-body {
    padding: 12px 16px 16px;
  }
  
  .table-header {
    padding: 16px;
    flex-direction: column;
    align-items: flex-start;
  }
  
  .table-actions {
    width: 100%;
  }
  
  .search-container {
    width: 100%;
  }
  
  .data-table th, 
  .data-table td {
    padding: 12px 16px;
  }
  
  .detail-stats {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .modal-header, .modal-body, .modal-footer {
    padding: 16px;
  }
  
  .progress-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .progress {
    width: 100%;
  }
}

@media (max-width: 576px) {
  .action-btn span, .table-action-btn span, .detail-btn span {
    display: none;
  }
  
  .action-btn, .table-action-btn {
    width: 40px;
    justify-content: center;
  }
  
  .detail-btn {
    width: 32px;
    padding: 6px;
  }
}
</style>
