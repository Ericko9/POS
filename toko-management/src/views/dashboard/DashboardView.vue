<!-- src/views/dashboard/DashboardView.vue -->
<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h1 class="page-title">Dashboard</h1>
      <div class="header-actions">
        <button class="refresh-btn" @click="fetchDashboardData">
          <i class="fas fa-sync-alt"></i> Refresh Data
        </button>
        <div class="date-display">
          <i class="fas fa-calendar-alt"></i>
          <span>{{ currentDate }}</span>
        </div>
      </div>
    </div>
    
    <!-- Kartu Statistik -->
    <div class="stats-cards">
      <!-- Kartu Total Pendapatan -->
      <div class="stat-card income-card">
        <div class="stat-icon">
          <i class="fas fa-money-bill-wave"></i>
        </div>
        <div class="stat-content">
          <h3 class="stat-title">Total Pendapatan</h3>
          <div class="stat-value">Rp {{ formatCurrency(totalPendapatan) }}</div>
          <div class="stat-change" :class="{ 'positive': pendapatanTrend > 0, 'negative': pendapatanTrend < 0 }">
            <i :class="pendapatanTrend > 0 ? 'fas fa-arrow-up' : pendapatanTrend < 0 ? 'fas fa-arrow-down' : 'fas fa-equals'"></i>
            <span>{{ Math.abs(pendapatanTrend) }}% dibanding minggu lalu</span>
          </div>
        </div>
      </div>
      
      <!-- Kartu Jumlah Nota -->
      <div class="stat-card notes-card">
        <div class="stat-icon">
          <i class="fas fa-receipt"></i>
        </div>
        <div class="stat-content">
          <h3 class="stat-title">Jumlah Nota</h3>
          <div class="stat-value">{{ totalNota }}</div>
          <div class="stat-change" :class="{ 'positive': notaTrend > 0, 'negative': notaTrend < 0 }">
            <i :class="notaTrend > 0 ? 'fas fa-arrow-up' : notaTrend < 0 ? 'fas fa-arrow-down' : 'fas fa-equals'"></i>
            <span>{{ Math.abs(notaTrend) }}% dibanding minggu lalu</span>
          </div>
        </div>
      </div>
      
      <!-- Kartu Barang Terlaris -->
      <div class="stat-card product-card">
        <div class="stat-icon">
          <i class="fas fa-box"></i>
        </div>
        <div class="stat-content">
          <h3 class="stat-title">Barang Terlaris</h3>
          <div class="stat-value">{{ barangTerlaris?.nama || 'Belum ada' }}</div>
          <div class="stat-subtext" v-if="barangTerlaris?.jumlahTerjual">
            {{ barangTerlaris.jumlahTerjual }} item terjual
            <span class="period-info" v-if="barangTerlaris?.periode">
              ({{ barangTerlaris.periode }} hari terakhir)
            </span>
          </div>
          <div class="stat-subtext" v-else>
            Belum ada penjualan
          </div>
        </div>
      </div>
      
      <!-- Kartu Rata-Rata Penjualan per Hari -->
      <div class="stat-card average-card">
        <div class="stat-icon">
          <i class="fas fa-chart-line"></i>
        </div>
        <div class="stat-content">
          <h3 class="stat-title">Rata-Rata Harian</h3>
          <div class="stat-value">Rp {{ formatCurrency(rataRataHarian) }}</div>
          <div class="stat-subtext">
            Berdasarkan {{ totalHariPenjualan }} hari operasional
          </div>
        </div>
      </div>
    </div>
    
    <!-- Chart Container -->
    <div class="chart-section">
      <div class="chart-card">
        <div class="card-header">
          <h2>Performa Pengguna Seminggu Terakhir</h2>
          <div class="chart-actions">
            <select v-model="chartType" class="chart-selector">
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
            </select>
          </div>
        </div>
        <div class="card-body">
          <div v-if="filteredChartData.labels.length" class="chart-container">
            <Bar 
              v-if="chartType === 'bar'"
              :data="filteredChartData" 
              :options="chartOptions" 
              class="users-chart" 
            />
            <Line
              v-else
              :data="filteredChartData" 
              :options="chartOptions" 
              class="users-chart" 
            />
          </div>
          <div v-else class="empty-chart">
            <i class="fas fa-chart-bar"></i>
            <p>Belum ada data untuk ditampilkan</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Tabel Performa Pengguna -->
    <div class="table-section">
      <div class="table-card">
        <div class="card-header">
          <h2>Pendapatan Per Pengguna</h2>
          <div class="table-actions">
            <div class="search-box">
              <i class="fas fa-search"></i>
              <input type="text" v-model="searchTerm" placeholder="Cari pengguna...">
            </div>
            <div class="filter-box" v-if="isAdmin">
              <select v-model="roleFilter" class="role-filter">
                <option value="all">Semua Role</option>
                <option value="admin">Admin</option>
                <option value="kasir">Kasir</option>
              </select>
            </div>
          </div>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th @click="sortBy('nama')" class="sortable">
                    Nama Pengguna
                    <i v-if="sortColumn === 'nama'" :class="sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'"></i>
                    <i v-else class="fas fa-sort"></i>
                  </th>
                  <th @click="sortBy('role')" class="sortable">
                    Role
                    <i v-if="sortColumn === 'role'" :class="sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'"></i>
                    <i v-else class="fas fa-sort"></i>
                  </th>
                  <th @click="sortBy('jumlahNota')" class="sortable">
                    Jumlah Nota
                    <i v-if="sortColumn === 'jumlahNota'" :class="sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'"></i>
                    <i v-else class="fas fa-sort"></i>
                  </th>
                  <th @click="sortBy('totalPendapatan')" class="sortable">
                    Total Pendapatan
                    <i v-if="sortColumn === 'totalPendapatan'" :class="sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'"></i>
                    <i v-else class="fas fa-sort"></i>
                  </th>
                  <th @click="sortBy('rataRata')" class="sortable">
                    Rata-rata per Nota
                    <i v-if="sortColumn === 'rataRata'" :class="sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'"></i>
                    <i v-else class="fas fa-sort"></i>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in filteredAndSortedUsers" :key="user._id" class="user-row">
                  <td class="user-name">
                    <div class="avatar">{{ user.nama.charAt(0).toUpperCase() }}</div>
                    <span>{{ user.nama }}</span>
                  </td>
                  <td>
                    <span 
                      class="role-badge" 
                      :class="{
                        'admin-badge': user.role === 'admin', 
                        'kasir-badge': user.role === 'kasir'
                      }"
                    >
                      {{ user.role.toUpperCase() }}
                    </span>
                  </td>
                  <td>{{ user.jumlahNota }}</td>
                  <td>Rp {{ formatCurrency(user.totalPendapatan) }}</td>
                  <td>Rp {{ formatCurrency(user.rataRata) }}</td>
                </tr>
                <tr v-if="filteredAndSortedUsers.length === 0">
                  <td colspan="5" class="no-data">
                    <i class="fas fa-search"></i>
                    <p>{{ searchTerm ? 'Tidak ada data yang cocok dengan pencarian' : 'Belum ada data pengguna' }}</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../../stores/auth'
import axios from 'axios'
import { Bar, Line } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend)

const authStore = useAuthStore()
const totalPendapatan = ref(0)
const totalNota = ref(0)
const barangTerlaris = ref({})
const userData = ref([])
const weeklyData = ref([])
const chartType = ref('bar')
const searchTerm = ref('')
const roleFilter = ref('all')
const sortColumn = ref('totalPendapatan')
const sortDirection = ref('desc')

// Statistik tambahan
const pendapatanTrend = ref(0)
const notaTrend = ref(0)
const rataRataHarian = ref(0)
const totalHariPenjualan = ref(0)

// Menentukan role user
const isAdmin = computed(() => authStore.user?.role === 'admin')
const currentUser = computed(() => authStore.user)

// Current date
const currentDate = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('id-ID', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
})

// Filter data berdasarkan role
const filteredUserData = computed(() => {
  if (isAdmin.value) {
    // Admin dapat melihat semua data
    return userData.value
  } else {
    // Kasir hanya dapat melihat data mereka sendiri
    return userData.value.filter(user => user._id === currentUser.value._id)
  }
})

// Filtering and sorting
const filteredAndSortedUsers = computed(() => {
  let result = [...filteredUserData.value]
  
  // Filter by role (hanya jika user adalah admin)
  if (isAdmin.value && roleFilter.value !== 'all') {
    result = result.filter(user => user.role === roleFilter.value)
  }
  
  // Filter by search term
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    result = result.filter(user => user.nama.toLowerCase().includes(term))
  }
  
  // Sort
  result.sort((a, b) => {
    let comparison = 0
    
    if (sortColumn.value === 'nama') {
      comparison = a.nama.localeCompare(b.nama)
    } else if (sortColumn.value === 'role') {
      comparison = a.role.localeCompare(b.role)
    } else {
      comparison = a[sortColumn.value] - b[sortColumn.value]
    }
    
    return sortDirection.value === 'asc' ? comparison : -comparison
  })
  
  return result
})

// Memfilter data chart berdasarkan role
const filteredChartData = computed(() => {
  const labels = weeklyData.value.map(day => {
    // Format date to day name
    const date = new Date(day.tanggal)
    return date.toLocaleDateString('id-ID', { weekday: 'short' })
  })
  
  const datasets = []
  
  // Group data by user
  const userMap = new Map()
  
  weeklyData.value.forEach(day => {
    // Filter user data berdasarkan role
    const filteredUsers = isAdmin.value
      ? day.users
      : day.users.filter(u => u._id === currentUser.value._id)
    
    filteredUsers.forEach(u => {
      if (!userMap.has(u.nama)) {
        userMap.set(u.nama, Array(labels.length).fill(0))
      }
      
      const index = weeklyData.value.findIndex(d => d.tanggal === day.tanggal)
      userMap.get(u.nama)[index] = u.pendapatan
    })
  })
  
  // Generate colors for users
  userMap.forEach((data, nama) => {
    const user = weeklyData.value
      .flatMap(day => day.users)
      .find(u => u.nama === nama)
    
    let baseColor
    if (user && user.role === 'admin') {
      baseColor = { r: 65, g: 105, b: 225 } // Royal blue for admin
    } else {
      baseColor = { r: 46, g: 204, b: 113 } // Green for kasir
    }
    
    datasets.push({
      label: nama,
      backgroundColor: `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0.2)`,
      borderColor: `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 1)`,
      borderWidth: 2,
      tension: 0.4,
      pointBackgroundColor: `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 1)`,
      pointRadius: 4,
      pointHoverRadius: 6,
      data
    })
  })
  
  return { labels, datasets }
})

// Chart options
const chartOptions = computed(() => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
          font: {
            family: "'Poppins', sans-serif",
            size: 12
          }
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
              label += 'Rp ' + formatCurrency(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return 'Rp ' + formatCurrency(value);
          },
          font: {
            family: "'Poppins', sans-serif",
            size: 11
          }
        },
        grid: {
          color: 'rgba(200, 200, 200, 0.2)'
        },
        title: {
          display: true,
          text: 'Pendapatan (Rp)',
          font: {
            family: "'Poppins', sans-serif",
            size: 13,
            weight: 'bold'
          }
        }
      },
      x: {
        ticks: {
          font: {
            family: "'Poppins', sans-serif",
            size: 11
          }
        },
        grid: {
          display: false
        }
      }
    }
  }
})

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID').format(value)
}

function sortBy(column) {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'desc'
  }
}

async function fetchDashboardData() {
  try {
    const response = await axios.get('/api/dashboard')
    
    // Jika user adalah kasir, filter total pendapatan dan nota hanya untuk kasir tersebut
    if (!isAdmin.value) {
      const currentUserData = response.data.userData.find(user => user._id === currentUser.value._id)
      totalPendapatan.value = currentUserData ? currentUserData.totalPendapatan : 0
      totalNota.value = currentUserData ? currentUserData.jumlahNota : 0
    } else {
      totalPendapatan.value = response.data.totalPendapatan
      totalNota.value = response.data.totalNota
    }
    
    barangTerlaris.value = response.data.barangTerlaris
    userData.value = response.data.userData
    weeklyData.value = response.data.weeklyData
    
    // Hitung rata-rata harian
    if (weeklyData.value.length > 0) {
      totalHariPenjualan.value = weeklyData.value.length
      
      if (isAdmin.value) {
        // Untuk admin: rata-rata dari semua user
        const totalWeeklyIncome = weeklyData.value.reduce((sum, day) => {
          const dayTotal = day.users.reduce((total, user) => total + user.pendapatan, 0)
          return sum + dayTotal
        }, 0)
        rataRataHarian.value = totalWeeklyIncome / weeklyData.value.length
      } else {
        // Untuk kasir: rata-rata hanya dari data kasir tersebut
        const totalWeeklyIncome = weeklyData.value.reduce((sum, day) => {
          const userIncome = day.users.find(u => u._id === currentUser.value._id)
          return sum + (userIncome ? userIncome.pendapatan : 0)
        }, 0)
        rataRataHarian.value = totalWeeklyIncome / weeklyData.value.length
      }
    }

    // Tambahkan baris ini untuk update tren
    pendapatanTrend.value = response.data.pendapatanTrend;
    notaTrend.value = response.data.notaTrend;

  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
  }
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped>
/* Font imports */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');

.dashboard-container {
  font-family: 'Poppins', sans-serif;
  padding: 24px;
  background-color: #f9fafb;
  min-height: 100vh;
}

/* Dashboard Header */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-btn:hover {
  background-color: #f8fafc;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.refresh-btn i {
  font-size: 14px;
}

.date-display {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  color: #4a5568;
}

/* Stats Cards */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  overflow: hidden;
  position: relative;
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
  width: 6px;
  height: 100%;
}

.income-card::before {
  background-color: #4c51bf;
}

.notes-card::before {
  background-color: #38a169;
}

.product-card::before {
  background-color: #3182ce;
}

.average-card::before {
  background-color: #805ad5;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 22px;
}

.income-card .stat-icon {
  background-color: rgba(76, 81, 191, 0.1);
  color: #4c51bf;
}

.notes-card .stat-icon {
  background-color: rgba(56, 161, 105, 0.1);
  color: #38a169;
}

.product-card .stat-icon {
  background-color: rgba(49, 130, 206, 0.1);
  color: #3182ce;
}

.average-card .stat-icon {
  background-color: rgba(128, 90, 213, 0.1);
  color: #805ad5;
}

.stat-content {
  flex: 1;
}

.stat-title {
  font-size: 14px;
  font-weight: 500;
  color: #718096;
  margin: 0 0 6px 0;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-change {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-change.positive {
  color: #38a169;
}

.stat-change.negative {
  color: #e53e3e;
}

.stat-subtext {
  font-size: 12px;
  color: #718096;
}

/* Chart Section */
.chart-section {
  margin-bottom: 24px;
}

.chart-card {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.chart-card .card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-card .card-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

.chart-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chart-selector {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  color: #4a5568;
  background-color: #fff;
  cursor: pointer;
}

.chart-card .card-body {
  padding: 20px;
}

.chart-container {
  height: 400px;
  position: relative;
}

.empty-chart {
  height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #a0aec0;
}

.empty-chart i {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-chart p {
  font-size: 15px;
}

/* Table Section */
.table-section {
  margin-bottom: 24px;
}

.table-card {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.table-card .card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.table-card .card-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

.table-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
}

.search-box i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #a0aec0;
}

.search-box input {
  padding: 8px 12px 8px 36px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  width: 200px;
}

.role-filter {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  color: #4a5568;
  background-color: #fff;
}

.table-card .card-body {
  padding: 0;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background-color: #f8fafc;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #4a5568;
  font-size: 14px;
  border-bottom: 1px solid #e2e8f0;
}

.data-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.data-table th.sortable i {
  margin-left: 5px;
  font-size: 12px;
}

.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  color: #2d3748;
  font-size: 14px;
}

.user-row:hover {
  background-color: #f8fafc;
}

.user-name {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #edf2f7;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #4a5568;
  font-size: 14px;
}

.role-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.admin-badge {
  background-color: rgba(76, 81, 191, 0.15);
  color: #4c51bf;
}

.kasir-badge {
  background-color: rgba(56, 161, 105, 0.15);
  color: #38a169;
}

.no-data {
  text-align: center;
  padding: 32px !important;
  color: #a0aec0 !important;
}

.no-data i {
  font-size: 32px;
  margin-bottom: 12px;
}

.no-data p {
  font-size: 15px;
  margin: 8px 0 0 0;
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard-container {
    padding: 16px;
  }
  
  .dashboard-header {
    flex-direction: column;
    align-items: start;
    gap: 16px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .table-card .card-header {
    flex-direction: column;
    align-items: start;
  }
  
  .table-actions {
    width: 100%;
    margin-top: 12px;
  }
  
  .search-box, .search-box input {
    width: 100%;
  }
  
  .filter-box {
    width: 100%;
  }
  
  .role-filter {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .stat-value {
    font-size: 20px;
  }
  
  .chart-container {
    height: 300px;
  }
}

/* Users chart */
.users-chart {
  height: 100%;
}

/* Tambahkan di bagian style Anda */
.period-info {
  font-size: 11px;
  color: #718096;
  font-style: italic;
  margin-left: 4px;
}
</style>