<!-- src/views/analisis/AnalisisLabaView.vue -->
<template>
  <div class="analisis-container">
    <div class="analisis-header">
      <div class="header-left">
        <h1 class="page-title">Analisis Laba</h1>
        <!-- <p class="page-subtitle">Lihat dan analisis laba bisnis Anda dalam berbagai periode</p> -->
      </div>
      <div class="header-actions">
        <button class="action-btn" @click="exportData" title="Ekspor Data">
          <i class="fas fa-file-export"></i>
          <span>Ekspor</span>
        </button>
        <button class="action-btn" @click="refreshData" title="Refresh Data">
          <i class="fas fa-sync-alt"></i>
          <span>Refresh</span>
        </button>
      </div>
    </div>
    
    <!-- Filter Panel -->
    <div class="filter-panel">
      <div class="filter-container">
        <div class="filter-group">
          <label for="periodType">Jenis Periode</label>
          <div class="select-container">
            <select id="periodType" v-model="filters.periodType">
              <option value="harian">Harian</option>
              <option value="bulanan">Bulanan</option>
              <option value="tahunan">Tahunan</option>
            </select>
            <i class="fas fa-chevron-down"></i>
          </div>
        </div>
        
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
        
        <div class="filter-group button-group">
          <button class="apply-btn" @click="applyFilters" :disabled="isLoading">
            <i class="fas fa-filter"></i>
            <span>Terapkan Filter</span>
          </button>
        </div>
      </div>
      
      <div class="quick-filters">
        <button 
          @click="setQuickFilter('today')" 
          :class="['quick-filter-btn', { active: activeQuickFilter === 'today' }]">
          Hari Ini
        </button>
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
      </div>
    </div>
    
    <!-- Loading Indicator -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner">
        <i class="fas fa-circle-notch fa-spin"></i>
      </div>
      <p>Memuat data analisis laba...</p>
    </div>
    
    <div v-else>
      <!-- Summary Stats Cards -->
      <div class="stats-cards">
        <div class="stat-card revenue-card">
          <div class="stat-icon">
            <i class="fas fa-money-bill-wave"></i>
          </div>
          <div class="stat-content">
            <h3 class="stat-title">Total Pendapatan</h3>
            <div class="stat-value">Rp {{ formatCurrency(summary.totalPendapatan) }}</div>
            <div v-if="comparisonData.pendapatan" class="stat-comparison" :class="getComparisonClass(comparisonData.pendapatan.percentage)">
              <i :class="getComparisonIcon(comparisonData.pendapatan.percentage)"></i>
              <span>{{ Math.abs(comparisonData.pendapatan.percentage).toFixed(1) }}% {{ getComparisonText(comparisonData.pendapatan.percentage) }}</span>
            </div>
          </div>
        </div>
        
        <div class="stat-card cost-card">
          <div class="stat-icon">
            <i class="fas fa-shopping-cart"></i>
          </div>
          <div class="stat-content">
            <h3 class="stat-title">Total Modal</h3>
            <div class="stat-value">Rp {{ formatCurrency(summary.totalModal) }}</div>
            <div v-if="comparisonData.modal" class="stat-comparison" :class="getComparisonClass(-comparisonData.modal.percentage)">
              <i :class="getComparisonIcon(-comparisonData.modal.percentage)"></i>
              <span>{{ Math.abs(comparisonData.modal.percentage).toFixed(1) }}% {{ getComparisonText(-comparisonData.modal.percentage) }}</span>
            </div>
          </div>
        </div>
        
        <div class="stat-card profit-card">
          <div class="stat-icon">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="stat-content">
            <h3 class="stat-title">Total Laba</h3>
            <div class="stat-value">Rp {{ formatCurrency(summary.totalLaba) }}</div>
            <div v-if="comparisonData.laba" class="stat-comparison" :class="getComparisonClass(comparisonData.laba.percentage)">
              <i :class="getComparisonIcon(comparisonData.laba.percentage)"></i>
              <span>{{ Math.abs(comparisonData.laba.percentage).toFixed(1) }}% {{ getComparisonText(comparisonData.laba.percentage) }}</span>
            </div>
          </div>
        </div>
        
        <div class="stat-card margin-card">
          <div class="stat-icon">
            <i class="fas fa-percentage"></i>
          </div>
          <div class="stat-content">
            <h3 class="stat-title">Margin Laba</h3>
            <div class="stat-value">{{ summary.marginLaba.toFixed(1) }}%</div>
            <div v-if="comparisonData.margin" class="stat-comparison" :class="getComparisonClass(comparisonData.margin.percentage)">
              <i :class="getComparisonIcon(comparisonData.margin.percentage)"></i>
              <span>{{ Math.abs(comparisonData.margin.percentage).toFixed(1) }}% {{ getComparisonText(comparisonData.margin.percentage) }}</span>
            </div>
            <div class="mini-chart">
              <div v-if="profitData.length > 0" class="mini-chart-bars">
                <div 
                  v-for="(item, index) in profitData.slice(-7)" 
                  :key="index" 
                  class="mini-chart-bar"
                  :style="{ height: getMiniChartHeight(item.marginLaba) }"
                  :title="`${item.period}: ${item.marginLaba.toFixed(1)}%`"
                ></div>
              </div>
              <div v-else class="mini-chart-empty">Tidak ada data</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Charts Section -->
      <div class="charts-section">
        <div class="chart-container">
          <div class="chart-header">
            <h2>Grafik Laba</h2>
            <div class="chart-actions">
              <button 
                class="chart-type-btn" 
                :class="{ active: labaChartType === 'line' }"
                @click="labaChartType = 'line'"
                title="Line Chart"
              >
                <i class="fas fa-chart-line"></i>
              </button>
              <button 
                class="chart-type-btn" 
                :class="{ active: labaChartType === 'bar' }"
                @click="labaChartType = 'bar'"
                title="Bar Chart"
              >
                <i class="fas fa-chart-bar"></i>
              </button>
            </div>
          </div>
          <div class="chart-body">
            <div v-if="chartData.labels.length" class="chart-wrapper">
              <Line 
                v-if="labaChartType === 'line'"
                :data="labaChartData" 
                :options="labaChartOptions" 
                class="laba-chart" 
              />
              <Bar
                v-else
                :data="labaChartData" 
                :options="labaChartOptions" 
                class="laba-chart" 
              />
            </div>
            <div v-else class="empty-chart">
              <i class="fas fa-chart-area"></i>
              <p>Belum ada data untuk ditampilkan</p>
            </div>
          </div>
        </div>
        
        <div class="chart-container">
          <div class="chart-header">
            <h2>Grafik Margin Laba</h2>
            <div class="chart-actions">
              <button 
                class="chart-type-btn" 
                :class="{ active: marginChartType === 'line' }"
                @click="marginChartType = 'line'"
                title="Line Chart"
              >
                <i class="fas fa-chart-line"></i>
              </button>
              <button 
                class="chart-type-btn" 
                :class="{ active: marginChartType === 'bar' }"
                @click="marginChartType = 'bar'"
                title="Bar Chart"
              >
                <i class="fas fa-chart-bar"></i>
              </button>
            </div>
          </div>
          <div class="chart-body">
            <div v-if="chartData.labels.length" class="chart-wrapper">
              <Line 
                v-if="marginChartType === 'line'"
                :data="marginChartData" 
                :options="marginChartOptions" 
                class="margin-chart" 
              />
              <Bar
                v-else
                :data="marginChartData" 
                :options="marginChartOptions" 
                class="margin-chart" 
              />
            </div>
            <div v-else class="empty-chart">
              <i class="fas fa-chart-area"></i>
              <p>Belum ada data untuk ditampilkan</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Data Table -->
      <div class="data-table-container">
        <div class="table-header">
          <h2>Detail Laba</h2>
          <div class="table-actions">
            <div class="search-container">
              <i class="fas fa-search"></i>
              <input type="text" placeholder="Cari data..." v-model="searchTerm" class="search-input">
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
                  <th @click="sortTable('period')" class="sortable-header">
                    {{ getPeriodLabel() }}
                    <i :class="getSortIconClass('period')"></i>
                  </th>
                  <th @click="sortTable('totalPendapatan')" class="sortable-header">
                    Pendapatan
                    <i :class="getSortIconClass('totalPendapatan')"></i>
                  </th>
                  <th @click="sortTable('totalModal')" class="sortable-header">
                    Modal
                    <i :class="getSortIconClass('totalModal')"></i>
                  </th>
                  <th @click="sortTable('totalLaba')" class="sortable-header">
                    Laba
                    <i :class="getSortIconClass('totalLaba')"></i>
                  </th>
                  <th @click="sortTable('marginLaba')" class="sortable-header">
                    Margin (%)
                    <i :class="getSortIconClass('marginLaba')"></i>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in filteredAndSortedData" :key="index" class="data-row">
                  <td class="period-cell">{{ formatPeriod(item.period) }}</td>
                  <td class="pendapatan-cell">Rp {{ formatCurrency(item.totalPendapatan) }}</td>
                  <td class="modal-cell">Rp {{ formatCurrency(item.totalModal) }}</td>
                  <td class="laba-cell">Rp {{ formatCurrency(item.totalLaba) }}</td>
                  <td class="margin-cell">{{ item.marginLaba.toFixed(1) }}%</td>
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
                  <td>TOTAL</td>
                  <td>Rp {{ formatCurrency(summary.totalPendapatan) }}</td>
                  <td>Rp {{ formatCurrency(summary.totalModal) }}</td>
                  <td>Rp {{ formatCurrency(summary.totalLaba) }}</td>
                  <td>{{ summary.marginLaba.toFixed(1) }}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import { Line, Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js'
import * as ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)

// Data References
const isLoading = ref(true)
const profitData = ref([])
const summary = ref({
  totalPendapatan: 0,
  totalModal: 0,
  totalLaba: 0,
  marginLaba: 0,
  totalTransaksi: 0
})

// Comparison data
const comparisonData = ref({
  pendapatan: null,
  modal: null,
  laba: null,
  margin: null
})

// Filter and sorting state
const filters = ref({
  periodType: 'bulanan',
  startDate: '',
  endDate: ''
})
const activeQuickFilter = ref('month')
const searchTerm = ref('')
const sortConfig = ref({
  key: 'period',
  direction: 'desc'
})

// Chart type toggle
const labaChartType = ref('line')
const marginChartType = ref('line')

// Filtered and sorted data
const filteredAndSortedData = computed(() => {
  let filteredData = [...profitData.value]
  
  // Apply search filter if any
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    filteredData = filteredData.filter(item => 
      item.period.toLowerCase().includes(term) || 
      item.totalPendapatan.toString().includes(term) ||
      item.totalModal.toString().includes(term) ||
      item.totalLaba.toString().includes(term) ||
      item.marginLaba.toString().includes(term)
    )
  }
  
  // Apply sorting
  filteredData.sort((a, b) => {
    let comparison = 0
    
    if (sortConfig.value.key === 'period') {
      // Special handling for period based on periodType
      if (filters.value.periodType === 'bulanan') {
        // For monthly data in YYYY-MM format
        comparison = a.period.localeCompare(b.period)
      } else if (filters.value.periodType === 'tahunan') {
        // For yearly data
        comparison = parseInt(a.period) - parseInt(b.period)
      } else {
        // For daily data in YYYY-MM-DD format
        comparison = a.period.localeCompare(b.period)
      }
    } else {
      // For numeric columns
      comparison = a[sortConfig.value.key] - b[sortConfig.value.key]
    }
    
    return sortConfig.value.direction === 'asc' ? comparison : -comparison
  })
  
  return filteredData
})

// Chart data for Laba
const labaChartData = computed(() => {
  const labels = profitData.value.map(item => formatPeriod(item.period))
  
  return {
    labels,
    datasets: [
      {
        label: 'Pendapatan',
        backgroundColor: 'rgba(65, 105, 225, 0.2)',
        borderColor: 'rgba(65, 105, 225, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(65, 105, 225, 1)',
        pointBorderColor: '#fff',
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        data: profitData.value.map(item => item.totalPendapatan)
      },
      {
        label: 'Modal',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(255, 99, 132, 1)',
        pointBorderColor: '#fff',
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        data: profitData.value.map(item => item.totalModal)
      },
      {
        label: 'Laba',
        backgroundColor: 'rgba(46, 204, 113, 0.2)',
        borderColor: 'rgba(46, 204, 113, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(46, 204, 113, 1)',
        pointBorderColor: '#fff',
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        data: profitData.value.map(item => item.totalLaba)
      }
    ]
  }
})

// Chart data for Margin
const marginChartData = computed(() => {
  const labels = profitData.value.map(item => formatPeriod(item.period))
  
  return {
    labels,
    datasets: [
      {
        label: 'Margin Laba (%)',
        backgroundColor: 'rgba(155, 89, 182, 0.2)',
        borderColor: 'rgba(155, 89, 182, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(155, 89, 182, 1)',
        pointBorderColor: '#fff',
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        data: profitData.value.map(item => item.marginLaba)
      }
    ]
  }
})

// Chart options for Laba
const labaChartOptions = computed(() => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            family: "'Poppins', sans-serif",
            size: 12
          },
          boxWidth: 12,
          usePointStyle: true
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
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += 'Rp ' + new Intl.NumberFormat('id-ID').format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          callback: function(value) {
            return 'Rp ' + formatCurrency(value);
          },
          font: {
            family: "'Poppins', sans-serif",
            size: 11
          }
        },
        title: {
          display: true,
          text: 'Nilai (Rp)',
          font: {
            family: "'Poppins', sans-serif",
            size: 12,
            weight: 'bold'
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
            size: 11
          },
          maxRotation: 45,
          minRotation: 45
        }
      }
    }
  }
})

// Chart options for Margin
const marginChartOptions = computed(() => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            family: "'Poppins', sans-serif",
            size: 12
          },
          boxWidth: 12,
          usePointStyle: true
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
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(1) + '%';
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          callback: function(value) {
            return value.toFixed(1) + '%';
          },
          font: {
            family: "'Poppins', sans-serif",
            size: 11
          }
        },
        title: {
          display: true,
          text: 'Margin Laba (%)',
          font: {
            family: "'Poppins', sans-serif",
            size: 12,
            weight: 'bold'
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
            size: 11
          },
          maxRotation: 45,
          minRotation: 45
        }
      }
    }
  }
})

// Chart data reference for template condition
const chartData = computed(() => ({
  labels: profitData.value.map(item => item.period)
}))

// Utility functions
function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID').format(value)
}

function formatPeriod(period) {
  if (filters.value.periodType === 'harian') {
    // Convert from YYYY-MM-DD to DD/MM/YYYY
    const [year, month, day] = period.split('-')
    return `${day}/${month}/${year}`
  } else if (filters.value.periodType === 'bulanan') {
    // Convert from YYYY-MM to Month Name YYYY
    const [year, month] = period.split('-')
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
    return `${monthNames[parseInt(month) - 1]} ${year}`
  } else {
    // For yearly, just return as is
    return period
  }
}

function getPeriodLabel() {
  switch(filters.value.periodType) {
    case 'harian': return 'Tanggal'
    case 'bulanan': return 'Bulan'
    case 'tahunan': return 'Tahun'
    default: return 'Periode'
  }
}

function getComparisonClass(percentage) {
  if (percentage > 0) return 'positive'
  if (percentage < 0) return 'negative'
  return 'neutral'
}

function getComparisonIcon(percentage) {
  if (percentage > 0) return 'fas fa-arrow-up'
  if (percentage < 0) return 'fas fa-arrow-down'
  return 'fas fa-minus'
}

function getComparisonText(percentage) {
  if (percentage > 0) return 'meningkat'
  if (percentage < 0) return 'menurun'
  return 'tidak berubah'
}

function getSortIconClass(key) {
  if (sortConfig.value.key === key) {
    return sortConfig.value.direction === 'asc' 
      ? 'fas fa-sort-up'
      : 'fas fa-sort-down'
  }
  return 'fas fa-sort'
}

function getMiniChartHeight(value) {
  if (profitData.value.length === 0) return '0%'
  
  // Find max value for margin (usually between 0-100%)
  const maxValue = Math.max(...profitData.value.map(item => item.marginLaba), 50)
  
  // Calculate height as percentage of max (min 10% for visibility)
  const percentage = Math.max(10, (value / maxValue) * 100)
  return `${percentage}%`
}

// Date utility functions
function setQuickFilter(filterType) {
  activeQuickFilter.value = filterType
  
  const today = new Date()
  let startDate, endDate
  
  switch (filterType) {
    case 'today':
      startDate = new Date(today)
      endDate = new Date(today)
      filters.value.periodType = 'harian'
      break
      
    case 'week':
      // Start of current week (Sunday)
      startDate = new Date(today)
      startDate.setDate(today.getDate() - today.getDay())
      
      // End of current week (Saturday)
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
      
      filters.value.periodType = 'harian'
      break
      
    case 'month':
      // Start of current month
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      
      // End of current month
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 1)
      
      filters.value.periodType = 'harian'
      break
      
    case 'quarter':
      // Determine current quarter
      const currentQuarter = Math.floor(today.getMonth() / 3)
      
      // Start of current quarter
      startDate = new Date(today.getFullYear(), currentQuarter * 3, 1)
      
      // End of current quarter
      endDate = new Date(today.getFullYear(), (currentQuarter + 1) * 3, 1)
      
      filters.value.periodType = 'bulanan'
      break
      
    case 'year':
      // Start of current year
      startDate = new Date(today.getFullYear(), 0, 1)
      
      // End of current year
      endDate = new Date(today.getFullYear(), 11, 31)
      
      filters.value.periodType = 'bulanan'
      break
  }
  
  // Format dates for input fields
  filters.value.startDate = startDate.toISOString().split('T')[0]
  filters.value.endDate = endDate.toISOString().split('T')[0]
  
  // Apply the filters
  applyFilters()
}

// Initialize date range for current month
function initDateRange() {
  setQuickFilter('month')
}

// Fetch profit data
async function fetchProfitData() {
  try {
    isLoading.value = true
    
    const response = await axios.get('/api/analisis/laba', { 
      params: {
        periodType: filters.value.periodType,
        startDate: filters.value.startDate,
        endDate: filters.value.endDate
      }
    })
    
    profitData.value = response.data.data
    summary.value = response.data.summary
    comparisonData.value = response.data.comparisonData
    
    // Reset sort to default when new data is loaded
    sortConfig.value = { key: 'period', direction: 'desc' }
  } catch (error) {
    console.error('Error fetching profit data:', error)
  } finally {
    isLoading.value = false
  }
}

// Apply filters
function applyFilters() {
  fetchProfitData()
}

// Refresh data
function refreshData() {
  fetchProfitData()
}

// Sort table
function sortTable(key) {
  if (sortConfig.value.key === key) {
    // Toggle direction if same key
    sortConfig.value.direction = sortConfig.value.direction === 'asc' ? 'desc' : 'asc'
  } else {
    // Set new sort key with default desc direction
    sortConfig.value.key = key
    sortConfig.value.direction = 'desc'
  }
}

// Export data to Excel
async function exportData() {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Laba')
  
  // Add title and styling
  worksheet.mergeCells('A1:E1')
  const titleCell = worksheet.getCell('A1')
  titleCell.value = 'Laporan Laba'
  titleCell.font = { size: 16, bold: true }
  titleCell.alignment = { horizontal: 'center' }
  
  // Add period
  worksheet.mergeCells('A2:E2')
  const periodCell = worksheet.getCell('A2')
  periodCell.value = `Periode: ${filters.value.startDate} s/d ${filters.value.endDate}`
  periodCell.alignment = { horizontal: 'center' }
  
  // Add summary section
  worksheet.mergeCells('A4:E4')
  worksheet.getCell('A4').value = 'Ringkasan'
  worksheet.getCell('A4').font = { bold: true }
  worksheet.getCell('A4').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE9ECEF' }
  }
  
  worksheet.addRow(['Total Pendapatan', `Rp ${formatCurrency(summary.value.totalPendapatan)}`, '', '', ''])
  worksheet.addRow(['Total Modal', `Rp ${formatCurrency(summary.value.totalModal)}`, '', '', ''])
  worksheet.addRow(['Total Laba', `Rp ${formatCurrency(summary.value.totalLaba)}`, '', '', ''])
  worksheet.addRow(['Margin Laba', `${summary.value.marginLaba.toFixed(1)}%`, '', '', ''])
  
  // Add spacing
  worksheet.addRow([])
  
  // Add data table header
  worksheet.addRow([getPeriodLabel(), 'Pendapatan', 'Modal', 'Laba', 'Margin (%)'])
  
  // Style the header
  const headerRow = worksheet.getRow(10)
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
  profitData.value.forEach(item => {
    worksheet.addRow([
      formatPeriod(item.period),
      item.totalPendapatan,
      item.totalModal,
      item.totalLaba,
      item.marginLaba
    ])
  })
  
  // Add total row
  worksheet.addRow([
    'TOTAL',
    summary.value.totalPendapatan,
    summary.value.totalModal,
    summary.value.totalLaba,
    summary.value.marginLaba
  ])
  
  const totalRow = worksheet.getRow(11 + profitData.value.length)
  totalRow.font = { bold: true }
  totalRow.eachCell(cell => {
    cell.border = {
      top: { style: 'double' },
      bottom: { style: 'double' }
    }
  })
  
  // Set column widths
  worksheet.getColumn(1).width = 20
  worksheet.getColumn(2).width = 20
  worksheet.getColumn(3).width = 20
  worksheet.getColumn(4).width = 20
  worksheet.getColumn(5).width = 15
  
  // Format numbers
  for (let i = 11; i <= 11 + profitData.value.length; i++) {
    const row = worksheet.getRow(i)
    
    // Format currency for Pendapatan, Modal, and Laba columns
    row.getCell(2).numFmt = '"Rp "#,##0'
    row.getCell(3).numFmt = '"Rp "#,##0'
    row.getCell(4).numFmt = '"Rp "#,##0'
    
    // Format percentage for Margin column
    row.getCell(5).numFmt = '0.0"%"'
  }
  
  // Format summary values
  worksheet.getRow(5).getCell(2).numFmt = '"Rp "#,##0'
  worksheet.getRow(6).getCell(2).numFmt = '"Rp "#,##0'
  worksheet.getRow(7).getCell(2).numFmt = '"Rp "#,##0'
  worksheet.getRow(8).getCell(2).numFmt = '0.0"%"'
  
  // Export
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, `Laporan_Laba_${filters.value.periodType}_${new Date().toISOString().slice(0,10)}.xlsx`)
}

onMounted(() => {
  initDateRange()
  fetchProfitData()
})
</script>

<style scoped>
/* Base Styles */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');

.analisis-container {
  font-family: 'Poppins', sans-serif;
  color: #2d3748;
}

.analisis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: nowrap;
  gap: 20px;
  padding: 5px 0;
}

.header-left {
  flex: 1;
  min-width: 300px;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
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
  min-width: 100px;
  height: 40px;
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
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 24px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 5px;
  height: 100%;
}

.revenue-card::before {
  background-color: #4361ee;
}

.cost-card::before {
  background-color: #e74c3c;
}

.profit-card::before {
  background-color: #2ecc71;
}

.margin-card::before {
  background-color: #9b59b6;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.revenue-card .stat-icon {
  background-color: #4361ee1a;
  color: #4361ee;
}

.cost-card .stat-icon {
  background-color: #e74c3c1a;
  color: #e74c3c;
}

.profit-card .stat-icon {
  background-color: #2ecc711a;
  color: #2ecc71;
}

.margin-card .stat-icon {
  background-color: #9b59b61a;
  color: #9b59b6;
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
  margin: 0 0 8px;
}

.stat-comparison {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
}

.stat-comparison.positive {
  color: #2ecc71;
}

.stat-comparison.negative {
  color: #e74c3c;
}

.stat-comparison.neutral {
  color: #7f8c8d;
}

.mini-chart {
  margin-top: 10px;
  height: 40px;
  display: flex;
  align-items: flex-end;
  gap: 2px;
}

.mini-chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  width: 100%;
}

.mini-chart-bar {
  flex: 1;
  background-color: #9b59b6;
  border-radius: 2px 2px 0 0;
  opacity: 0.7;
  transition: all 0.2s;
}

.mini-chart-bar:hover {
  opacity: 1;
}

.mini-chart-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a0aec0;
  font-size: 12px;
  background-color: #f8fafc;
  border-radius: 4px;
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

.chart-actions {
  display: flex;
  gap: 8px;
}

.chart-type-btn {
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

.chart-type-btn:hover {
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

.period-cell {
  font-weight: 500;
}

.pendapatan-cell, .modal-cell, .laba-cell {
  font-family: "Consolas", monospace;
}

.margin-cell {
  font-family: "Consolas", monospace;
  color: #9b59b6;
  font-weight: 500;
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

.total-row {
  font-weight: 600;
  background-color: #f8fafc;
}

.total-row td {
  border-top: 2px solid #e2e8f0;
  border-bottom: none !important;
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
}

/* Chart Height */
.laba-chart, 
.margin-chart {
  height: 100%;
}
</style>