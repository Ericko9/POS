<!-- src/layouts/MainLayout.vue -->
<template>
  <div class="app-container">
    <!-- Sidebar -->
    <aside :class="['sidebar', {'collapsed': sidebarCollapsed}]">
      <div class="sidebar-header">
        <div class="logo-container">
          <div class="logo">SJ</div>
          <h3 class="brand-name" v-show="!sidebarCollapsed">Sri Jaya Keramik</h3>
        </div>
        <button @click="toggleSidebar" class="toggle-btn" :title="sidebarCollapsed ? 'Expand' : 'Collapse'">
          <i :class="sidebarCollapsed ? 'fas fa-angle-right' : 'fas fa-angle-left'"></i>
        </button>
      </div>

      <div class="user-profile" v-show="!sidebarCollapsed">
        <div class="avatar">
          {{ authStore.user?.nama?.charAt(0).toUpperCase() || 'U' }}
        </div>
        <div class="user-info">
          <h5 class="user-name">{{ authStore.user?.nama || 'User' }}</h5>
          <span class="user-role">{{ authStore.userRole?.toUpperCase() || 'ROLE' }}</span>
        </div>
      </div>
      
      <div class="sidebar-mini-profile" v-show="sidebarCollapsed">
        <div class="avatar-sm">
          {{ authStore.user?.nama?.charAt(0).toUpperCase() || 'U' }}
        </div>
      </div>

      <div class="sidebar-content">
        <nav class="sidebar-menu">
          <ul class="menu-list">
            <li class="menu-item">
              <router-link to="/" class="menu-link" :class="{'active': $route.path === '/'}">
                <i class="fas fa-chart-line"></i>
                <span class="menu-text" v-show="!sidebarCollapsed">Dashboard</span>
              </router-link>
            </li>
            
            <template v-if="authStore.userRole === 'admin'">
              <li class="menu-item has-submenu">
                <a href="#" class="menu-link" @click.prevent="toggleDropdown('barangSubmenu')" 
                   :class="{'active': isSubmenuActive(['barang', 'kategori'])}">
                  <i class="fas fa-box"></i>
                  <span class="menu-text" v-show="!sidebarCollapsed">Manajemen Barang</span>
                  <i class="menu-arrow" v-show="!sidebarCollapsed" 
                     :class="openMenus.barangSubmenu ? 'fas fa-chevron-down' : 'fas fa-chevron-right'"></i>
                </a>
                <transition name="submenu">
                  <ul class="submenu" v-show="openMenus.barangSubmenu && !sidebarCollapsed">
                    <li class="submenu-item">
                      <router-link to="/barang" class="submenu-link" :class="{'active': $route.path === '/barang'}">
                        <i class="fas fa-circle"></i>
                        <span class="menu-text">Daftar Barang</span>
                      </router-link>
                    </li>
                    <li class="submenu-item">
                      <router-link to="/kategori" class="submenu-link" :class="{'active': $route.path === '/kategori'}">
                        <i class="fas fa-circle"></i>
                        <span class="menu-text">Kategori</span>
                      </router-link>
                    </li>
                  </ul>
                </transition>
              </li>
              
              <li class="menu-item">
                <router-link to="/supplier" class="menu-link" :class="{'active': $route.path === '/supplier'}">
                  <i class="fas fa-truck"></i>
                  <span class="menu-text" v-show="!sidebarCollapsed">Manajemen Supplier</span>
                </router-link>
              </li>
              
              <li class="menu-item">
                <router-link to="/kasir" class="menu-link" :class="{'active': $route.path === '/kasir'}">
                  <i class="fas fa-user-tie"></i>
                  <span class="menu-text" v-show="!sidebarCollapsed">Manajemen Kasir</span>
                </router-link>
              </li>
            </template>
            
            <li class="menu-item has-submenu">
              <a href="#" class="menu-link" @click.prevent="toggleDropdown('notaSubmenu')"
                 :class="{'active': isSubmenuActive(['nota', 'retur'])}">
                <i class="fas fa-file-invoice"></i>
                <span class="menu-text" v-show="!sidebarCollapsed">Manajemen Nota</span>
                <i class="menu-arrow" v-show="!sidebarCollapsed" 
                   :class="openMenus.notaSubmenu ? 'fas fa-chevron-down' : 'fas fa-chevron-right'"></i>
              </a>
              <transition name="submenu">
                <ul class="submenu" v-show="openMenus.notaSubmenu && !sidebarCollapsed">
                  <li class="submenu-item">
                    <router-link to="/nota" class="submenu-link" :class="{'active': $route.path === '/nota' && $route.name !== 'createNota'}">
                      <i class="fas fa-circle"></i>
                      <span class="menu-text">Daftar Nota</span>
                    </router-link>
                  </li>
                  <!-- <li class="submenu-item">
                    <router-link to="/nota/create" class="submenu-link" :class="{'active': $route.name === 'createNota'}">
                      <i class="fas fa-circle"></i>
                      <span class="menu-text">Buat Nota</span>
                    </router-link>
                  </li> -->
                  <li class="submenu-item">
                    <router-link to="/retur" class="submenu-link" :class="{'active': $route.path === '/retur'}">
                      <i class="fas fa-circle"></i>
                      <span class="menu-text">Retur Barang</span>
                    </router-link>
                  </li>
                </ul>
              </transition>
            </li>
            
            <template v-if="authStore.userRole === 'admin'">
              <li class="menu-item has-submenu">
                <a href="#" class="menu-link" @click.prevent="toggleDropdown('analisisSubmenu')"
                   :class="{'active': isSubmenuActive(['analisis'])}">
                  <i class="fas fa-chart-bar"></i>
                  <span class="menu-text" v-show="!sidebarCollapsed">Analisis Pendapatan</span>
                  <i class="menu-arrow" v-show="!sidebarCollapsed" 
                     :class="openMenus.analisisSubmenu ? 'fas fa-chevron-down' : 'fas fa-chevron-right'"></i>
                </a>
                <transition name="submenu">
                  <ul class="submenu" v-show="openMenus.analisisSubmenu && !sidebarCollapsed">
                    <li class="submenu-item">
                      <router-link to="/analisis/pendapatan" class="submenu-link" :class="{'active': $route.path === '/analisis/pendapatan'}">
                        <i class="fas fa-circle"></i>
                        <span class="menu-text">Pendapatan</span>
                      </router-link>
                    </li>
                    <li class="submenu-item">
                      <router-link to="/analisis/kategori" class="submenu-link" :class="{'active': $route.path === '/analisis/kategori'}">
                        <i class="fas fa-circle"></i>
                        <span class="menu-text">Kategori</span>
                      </router-link>
                    </li>
                    <li class="submenu-item">
                      <router-link to="/analisis/pelanggan" class="submenu-link" :class="{'active': $route.path === '/analisis/pelanggan'}">
                        <i class="fas fa-circle"></i>
                        <span class="menu-text">Pelanggan</span>
                      </router-link>
                    </li>
                    <li class="submenu-item">
                      <router-link to="/analisis/laba" class="submenu-link" :class="{'active': $route.path === '/analisis/laba'}">
                        <i class="fas fa-circle"></i>
                        <span class="menu-text">Laba</span>
                      </router-link>
                    </li>
                  </ul>
                </transition>
              </li>
            </template>
          </ul>
        </nav>
      </div>

      <div class="sidebar-footer">
        <button @click="handleLogout" class="logout-btn" :title="sidebarCollapsed ? 'Logout' : ''">
          <i class="fas fa-sign-out-alt"></i>
          <span v-show="!sidebarCollapsed">Logout</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="main-content">
      <header class="top-header">
        <div class="header-left">
          <button @click="toggleSidebar" class="menu-trigger d-lg-none">
            <i class="fas fa-bars"></i>
          </button>
          <div class="breadcrumb-container">
            <h2 class="page-title">{{ currentPage }}</h2>
            <nav class="breadcrumb-nav" aria-label="breadcrumb">
              <ol class="breadcrumb">
                <li class="breadcrumb-item"><router-link to="/">Home</router-link></li>
                <li class="breadcrumb-item active" aria-current="page">{{ currentPage }}</li>
              </ol>
            </nav>
          </div>
        </div>
        
        <div class="header-right">
          <div class="header-actions">
            <!-- <button class="action-btn" title="Notifications">
              <i class="fas fa-bell"></i>
              <span class="badge">2</span>
            </button> -->
            
            <div class="dropdown">
              <button class="user-dropdown-toggle" @click="toggleUserDropdown">
                <div class="user-avatar">
                  {{ authStore.user?.nama?.charAt(0).toUpperCase() || 'U' }}
                </div>
                <span class="user-name d-none d-sm-inline">{{ authStore.user?.nama || 'User' }}</span>
                <i class="fas fa-chevron-down"></i>
              </button>
              <div class="dropdown-menu" :class="{'show': userDropdownOpen}">
                <div class="dropdown-header">
                  <strong>{{ authStore.user?.nama || 'User' }}</strong>
                  <span>{{ authStore.userRole }}</span>
                </div>
                <router-link to="/profile" class="dropdown-item">
                  <i class="fas fa-user"></i> Profile Saya
                </router-link>
                <router-link to="/settings" class="dropdown-item">
                  <i class="fas fa-cog"></i> Pengaturan
                </router-link>
                <div class="dropdown-divider"></div>
                <button @click="handleLogout" class="dropdown-item text-danger">
                  <i class="fas fa-sign-out-alt"></i> Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main class="content-wrapper">
        <slot></slot>
      </main>

      <footer class="app-footer">
        <div class="footer-content">
          <span>&copy; {{ currentYear }} Sri Jaya Keramik. All rights reserved.</span>
          <span>Version 1.0.0</span>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Dropdown states
const openMenus = ref({
  barangSubmenu: false,
  notaSubmenu: false,
  analisisSubmenu: false
})

const sidebarCollapsed = ref(false)
const userDropdownOpen = ref(false)

// Current year for footer
const currentYear = computed(() => new Date().getFullYear())

// Get current page name
const currentPage = computed(() => {
  const path = route.path
  
  if (path === '/') return 'Dashboard'
  
  // Get last part of path
  const parts = path.split('/')
  const lastPart = parts[parts.length - 1]
  
  // Format the page name
  return lastPart.charAt(0).toUpperCase() + lastPart.slice(1)
})

// Check if submenu should be active based on current route
function isSubmenuActive(paths) {
  const currentPath = route.path
  return paths.some(path => currentPath.includes(`/${path}`))
}

// Toggle dropdown menus
function toggleDropdown(menuId) {
  if (sidebarCollapsed.value) {
    sidebarCollapsed.value = false
    // Delay to ensure the sidebar is expanded before opening the menu
    setTimeout(() => {
      openMenus.value[menuId] = true
    }, 300)
    return
  }
  
  // If not collapsed, toggle normally
  openMenus.value[menuId] = !openMenus.value[menuId]
}

// Toggle user dropdown
function toggleUserDropdown() {
  userDropdownOpen.value = !userDropdownOpen.value
}

// Toggle sidebar
function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
  
  // Close all dropdowns when collapsing
  if (sidebarCollapsed.value) {
    for (const key in openMenus.value) {
      openMenus.value[key] = false
    }
  }
  
  // Save state to localStorage
  localStorage.setItem('sidebarCollapsed', sidebarCollapsed.value.toString())
}

// Logout handler
async function handleLogout() {
  await authStore.logout()
  router.push({ name: 'login' })
}

// Close dropdowns when clicking outside
function handleClickOutside(event) {
  // Handle user dropdown
  const userDropdown = document.querySelector('.dropdown')
  if (userDropdownOpen.value && userDropdown && !userDropdown.contains(event.target)) {
    userDropdownOpen.value = false
  }
  
  // Handle sidebar on mobile
  const sidebar = document.querySelector('.sidebar')
  const menuTrigger = document.querySelector('.menu-trigger')
  if (window.innerWidth < 992 && sidebar && menuTrigger) {
    if (
      !sidebar.contains(event.target) && 
      !menuTrigger.contains(event.target) && 
      !sidebarCollapsed.value
    ) {
      sidebarCollapsed.value = true
    }
  }
}

// Watch for route changes to auto-close dropdowns on mobile
watch(route, () => {
  if (window.innerWidth < 992) {
    sidebarCollapsed.value = true
  }
})

// Auto-open submenu based on current route
function updateActiveSubmenu() {
  if (route.path.includes('/barang') || route.path.includes('/kategori')) {
    openMenus.value.barangSubmenu = true
  } else if (route.path.includes('/nota') || route.path.includes('/retur')) {
    openMenus.value.notaSubmenu = true
  } else if (route.path.includes('/analisis')) {
    openMenus.value.analisisSubmenu = true
  }
}

onMounted(() => {
  // Check authentication
  authStore.checkAuth()
  
  // Add click outside event listener
  document.addEventListener('click', handleClickOutside)
  
  // Initialize sidebar state from localStorage
  const savedState = localStorage.getItem('sidebarCollapsed')
  if (savedState !== null) {
    sidebarCollapsed.value = savedState === 'true'
  } else {
    // Default to collapsed on mobile, expanded on desktop
    sidebarCollapsed.value = window.innerWidth < 992
  }
  
  // Update active submenu
  updateActiveSubmenu()
})

onBeforeUnmount(() => {
  // Clean up event listener
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style>
/* Importing fonts and icons */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');

/* ===== Reset and Base Styles ===== */
:root {
  --primary-color: #4361ee;
  --primary-light: #4361ee1a;
  --primary-dark: #3249c2;
  --secondary-color: #6366f1;
  --success-color: #10b981;
  --danger-color: #ef4444;
  --warning-color: #f59e0b;
  --info-color: #3b82f6;
  --dark-color: #1e293b;
  --light-color: #f1f5f9;
  --gray-color: #94a3b8;
  --border-color: #e2e8f0;
  
  --sidebar-width: 260px;
  --sidebar-collapsed-width: 70px;
  --header-height: 70px;
  --footer-height: 50px;
  
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  
  --transition: all 0.3s ease;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  color: var(--dark-color);
  background-color: var(--light-color);
  line-height: 1.5;
  width: 100vw;
  overflow-x: hidden;
}

/* ===== App Container ===== */
.app-container {
  display: flex;
  width: 100vw;
  min-height: 100vh;
  overflow-x: hidden;
}

/* ===== Sidebar Styles ===== */
.sidebar {
  width: var(--sidebar-width);
  height: 100vh;
  background: linear-gradient(to bottom, var(--primary-color), var(--primary-dark));
  color: white;
  transition: var(--transition);
  position: fixed;
  left: 0;
  top: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
}

.sidebar.collapsed {
  width: var(--sidebar-collapsed-width);
}

/* Sidebar Header */
.sidebar-header {
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  height: var(--header-height);
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
}

.logo {
  min-width: 38px;
  height: 38px;
  background-color: white;
  color: var(--primary-color);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
}

.brand-name {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
}

.toggle-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  cursor: pointer;
  transition: var(--transition);
}

.toggle-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

/* User Profile Section */
.user-profile {
  padding: 20px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
}

.avatar-sm {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.user-info {
  overflow: hidden;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  display: block;
  margin-top: 2px;
}

.sidebar-mini-profile {
  padding: 20px 0;
  display: flex;
  justify-content: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* Sidebar Content */
.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
}

/* Scrollbar styling */
.sidebar-content::-webkit-scrollbar {
  width: 4px;
}

.sidebar-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
}

.sidebar-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

/* Menu styles */
.menu-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.menu-item {
  margin-bottom: 4px;
}

.menu-link {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: var(--transition);
  border-radius: 6px;
  margin: 0 8px;
  position: relative;
}

.menu-link:hover {
  color: white;
  background-color: rgba(255, 255, 255, 0.1);
}

.menu-link.active {
  color: white;
  background-color: rgba(255, 255, 255, 0.15);
}

.menu-link i:first-child {
  min-width: 18px;
  text-align: center;
  font-size: 16px;
  margin-right: 12px;
}

.sidebar.collapsed .menu-link i:first-child {
  margin-right: 0;
}

.menu-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.menu-arrow {
  font-size: 10px;
  transition: transform 0.3s ease;
}

/* Submenu styles */
.submenu {
  list-style: none;
  padding: 0;
  margin: 5px 0 0 0;
  overflow: hidden;
}

.submenu-enter-active,
.submenu-leave-active {
  transition: all 0.3s ease;
  max-height: 300px;
}

.submenu-enter-from,
.submenu-leave-to {
  max-height: 0;
  opacity: 0;
}

.submenu-item {
  margin: 2px 0;
}

.submenu-link {
  display: flex;
  align-items: center;
  padding: 8px 16px 8px 48px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: var(--transition);
  border-radius: 6px;
  margin: 0 8px;
}

.submenu-link:hover {
  color: white;
  background-color: rgba(255, 255, 255, 0.1);
}

.submenu-link.active {
  color: white;
  background-color: rgba(255, 255, 255, 0.15);
}

.submenu-link i {
  font-size: 8px;
  margin-right: 10px;
}

/* Sidebar Footer */
.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: var(--transition);
}

.logout-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.sidebar.collapsed .logout-btn {
  padding: 10px 0;
}

.logout-btn i {
  font-size: 16px;
}

/* ===== Main Content ===== */
.main-content {
  flex: 1;
  min-width: 0;
  width: 100vw;
  margin-left: var(--sidebar-width);
  transition: var(--transition);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow-x: hidden;
}

.sidebar.collapsed ~ .main-content {
  margin-left: var(--sidebar-collapsed-width);
}

/* Top Header */
.top-header {
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background-color: white;
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 900;
  transition: var(--transition);
}

.header-left {
  display: flex;
  align-items: center;
}

.menu-trigger {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  border: 1px solid var(--border-color);
  color: var(--dark-color);
  cursor: pointer;
  margin-right: 16px;
  transition: var(--transition);
}

.menu-trigger:hover {
  background-color: var(--light-color);
}

.breadcrumb-container {
  display: flex;
  flex-direction: column;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: var(--dark-color);
}

.breadcrumb-nav {
  margin-top: 4px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  list-style: none;
  padding: 0;
  margin: 0;
}

.breadcrumb-item {
  font-size: 12px;
  color: var(--gray-color);
}

.breadcrumb-item a {
  color: var(--primary-color);
  text-decoration: none;
}

.breadcrumb-item a:hover {
  text-decoration: underline;
}

.breadcrumb-item + .breadcrumb-item::before {
  content: "/";
  margin: 0 6px;
  color: var(--gray-color);
}

.breadcrumb-item.active {
  color: var(--dark-color);
}

.header-right {
  display: flex;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  border: 1px solid var(--border-color);
  color: var(--dark-color);
  cursor: pointer;
  position: relative;
  transition: var(--transition);
}

.action-btn:hover {
  background-color: var(--light-color);
}

.badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: var(--danger-color);
  color: white;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

/* User Dropdown */
.dropdown {
  position: relative;
}

.user-dropdown-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 8px;
  background-color: transparent;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: var(--transition);
}

.user-dropdown-toggle:hover {
  background-color: var(--light-color);
}

.user-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: var(--primary-light);
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.user-name {
  font-weight: 500;
  color: var(--dark-color);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 240px;
  background-color: white;
  border-radius: 8px;
  box-shadow: var(--shadow-md);
  z-index: 1000;
  overflow: hidden;
  opacity: 0;
  visibility: hidden;
  transform: translateY(10px);
  transition: all 0.3s ease;
}

.dropdown-menu.show {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.dropdown-header {
  padding: 16px;
  background-color: var(--primary-light);
  display: flex;
  flex-direction: column;
}

.dropdown-header strong {
  font-size: 14px;
  color: var(--dark-color);
}

.dropdown-header span {
  font-size: 12px;
  color: var(--gray-color);
  margin-top: 4px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  text-decoration: none;
  color: var(--dark-color);
  transition: var(--transition);
  background-color: transparent;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
}

.dropdown-item:hover {
  background-color: var(--light-color);
}

.dropdown-item i {
  margin-right: 10px;
  font-size: 14px;
  width: 16px;
  text-align: center;
}

.dropdown-divider {
  height: 1px;
  background-color: var(--border-color);
  margin: 8px 0;
}

.text-danger {
  color: var(--danger-color) !important;
}

/* Content Wrapper */
.content-wrapper {
  flex: 1;
  padding: 24px;
  background-color: var(--light-color);
  min-height: calc(100vh - var(--header-height) - var(--footer-height));
}

/* Footer */
.app-footer {
  height: var(--footer-height);
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid var(--border-color);
  padding: 0 24px;
}

.footer-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  color: var(--gray-color);
  font-size: 12px;
}

/* ===== Responsive Styles ===== */
@media (max-width: 991.98px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    width: var(--sidebar-width);
    z-index: 1000;
    transform: translateX(-100%);
    transition: var(--transition);
  }
  .sidebar:not(.collapsed) {
    transform: translateX(0);
  }
  .main-content {
    margin-left: 0 !important;
    width: 100vw;
    min-width: 0;
    overflow-x: hidden;
  }
}

@media (max-width: 767.98px) {
  .page-title {
    font-size: 18px;
  }
  
  .breadcrumb-nav {
    display: none;
  }
  
  .header-right {
    gap: 4px;
  }
  
  .action-btn, .user-dropdown-toggle {
    padding: 6px;
  }
  
  .user-name {
    display: none !important;
  }
  
  .dropdown-menu {
    width: 200px;
  }
}

@media (max-width: 575.98px) {
  .content-wrapper {
    padding: 12px;
  }
  
  .sidebar {
    width: 240px;
  }
  
  .action-btn {
    width: 36px;
    height: 36px;
  }
  
  .footer-content {
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
}
</style>