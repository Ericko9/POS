// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// Auth Views
import LoginView from '../views/auth/LoginView.vue'
import LogoutView from '../views/auth/LogoutView.vue'

// Main Views
import DashboardView from '../views/dashboard/DashboardView.vue'

// Lazy-loaded views
const BarangListView = () => import('../views/barang/BarangListView.vue')
const BarangDetailView = () => import('../views/barang/BarangDetailView.vue')
const BarangFormView = () => import('../views/barang/BarangFormView.vue')
const KategoriView = () => import('../views/barang/KategoriView.vue')

const SupplierListView = () => import('../views/supplier/SupplierListView.vue')
const SupplierDetailView = () => import('../views/supplier/SupplierDetailView.vue')
const SupplierFormView = () => import('../views/supplier/SupplierFormView.vue')

const KasirListView = () => import('../views/kasir/KasirListView.vue')
const KasirDetailView = () => import('../views/kasir/KasirDetailView.vue')
const KasirFormView = () => import('../views/kasir/KasirFormView.vue')

const NotaListView = () => import('../views/nota/NotaListView.vue')
const NotaFormView = () => import('../views/nota/NotaFormView.vue')
const NotaPrintView = () => import('../views/nota/NotaPrintView.vue')
const SuratJalanPrintView = () => import('../views/nota/SuratJalanPrintView.vue')
const CombinedPrintView = () => import('../views/nota/CombinedPrintView.vue')
const ReturView = () => import('../views/nota/ReturView.vue')
const ReturDetailView = () => import('../views/nota/ReturDetailView.vue')

const AnalisisPendapatanView = () => import('../views/analisis/AnalisisPendapatanView.vue')
const AnalisisKategoriView = () => import('../views/analisis/AnalisisKategoriView.vue')
const AnalisisPelangganView = () => import('../views/analisis/AnalisisPelangganView.vue')
const AnalisisLabaView = () => import('../views/analisis/AnalisisLabaView.vue')

const ProfileView = () => import('../views/profile/ProfileView.vue')

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { requiresAuth: false, layout: 'auth' }
  },
  {
    path: '/logout',
    name: 'logout',
    component: LogoutView,
    meta: { requiresAuth: true, layout: 'auth' }
  },
  {
    path: '/',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true, layout: 'main' }
  },
  
  // Barang routes
  {
    path: '/barang',
    name: 'barang-list',
    component: BarangListView,
    meta: { requiresAuth: true, role: 'admin', layout: 'main' }
  },
  {
    path: '/barang/:id',
    name: 'barang-detail',
    component: BarangDetailView,
    meta: { requiresAuth: true, role: 'admin', layout: 'main' }
  },
  {
    path: '/barang/create',
    name: 'barang-create',
    component: BarangFormView,
    meta: { requiresAuth: true, role: 'admin', layout: 'main' }
  },
  {
    path: '/barang/:id/edit',
    name: 'barang-edit',
    component: BarangFormView,
    meta: { requiresAuth: true, role: 'admin', layout: 'main' }
  },
  {
    path: '/kategori',
    name: 'kategori',
    component: KategoriView,
    meta: { requiresAuth: true, role: 'admin', layout: 'main' }
  },
  
  // Supplier routes
  {
    path: '/supplier',
    name: 'supplier-list',
    component: SupplierListView,
    meta: { requiresAuth: true, role: 'admin', layout: 'main' }
  },
  {
    path: '/supplier/:id',
    name: 'supplier-detail',
    component: SupplierDetailView,
    meta: { requiresAuth: true, role: 'admin', layout: 'main' }
  },
  {
    path: '/supplier/create',
    name: 'supplier-create',
    component: SupplierFormView,
    meta: { requiresAuth: true, role: 'admin', layout: 'main' }
  },
  {
    path: '/supplier/:id/edit',
    name: 'supplier-edit',
    component: SupplierFormView,
    meta: { requiresAuth: true, role: 'admin', layout: 'main' }
  },
  
  // Kasir routes
  {
    path: '/kasir',
    name: 'kasir-list',
    component: KasirListView,
    meta: { requiresAuth: true, role: 'admin', layout: 'main' }
  },
  {
    path: '/kasir/:id',
    name: 'kasir-detail',
    component: KasirDetailView,
    meta: { requiresAuth: true, role: 'admin', layout: 'main' }
  },
  {
    path: '/kasir/create',
    name: 'kasir-create',
    component: KasirFormView,
    meta: { requiresAuth: true, role: 'admin', layout: 'main' }
  },
  {
    path: '/kasir/:id/edit',
    name: 'kasir-edit',
    component: KasirFormView,
    meta: { requiresAuth: true, role: 'admin', layout: 'main' }
  },
  
  // Nota routes
  {
    path: '/nota',
    name: 'nota-list',
    component: NotaListView,
    meta: { requiresAuth: true, layout: 'main' }
  },
  {
    path: '/nota/create',
    name: 'nota-create',
    component: NotaFormView,
    meta: { requiresAuth: true, layout: 'main' }
  },
  {
    path: '/nota/:id/print',
    name: 'nota-print',
    component: NotaPrintView,
    meta: { requiresAuth: true, layout: 'main' }
  },
  {
    path: '/nota/:id/surat-jalan',
    name: 'nota-surat-jalan',
    component: SuratJalanPrintView,
    meta: { requiresAuth: true, layout: 'main' }
  },
  {
    path: '/nota/:id/combined-print',
    name: 'nota-combined-print',
    component: CombinedPrintView,
    meta: { requiresAuth: true, layout: 'main' }
  },
  {
    path: '/retur',
    name: 'retur',
    component: ReturView,
    meta: { requiresAuth: true, layout: 'main' }
  },
  {
    path: '/retur/detail/:id',
    name: 'returDetail',
    component: ReturDetailView,
    meta: { requiresAuth: true , layout: 'main'}
  },

  
  // Analisis routes
  {
    path: '/analisis/pendapatan',
    name: 'analisis-pendapatan',
    component: AnalisisPendapatanView,
    meta: { requiresAuth: true, role: 'admin', layout: 'main' }
  },
  {
    path: '/analisis/kategori',
    name: 'analisis-kategori',
    component: AnalisisKategoriView,
    meta: { requiresAuth: true, role: 'admin', layout: 'main' }
  },
  {
    path: '/analisis/pelanggan',
    name: 'analisis-pelanggan',
    component: AnalisisPelangganView,
    meta: { requiresAuth: true, role: 'admin', layout: 'main' }
  },
  {
    path: '/analisis/laba',
    name: 'analisis-laba',
    component: AnalisisLabaView,
    meta: { requiresAuth: true, role: 'admin', layout: 'main' }
  },

  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: { requiresAuth: true, layout: 'main' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login' })
  } else if (to.meta.role && authStore.userRole !== to.meta.role) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router