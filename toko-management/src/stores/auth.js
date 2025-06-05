// src/stores/auth.js
import { defineStore } from 'pinia'
import axios from 'axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.token,
    userRole: (state) => state.user?.role || null
  },
  
  actions: {
    async login(username, password) {
      try {
        const response = await axios.post('/api/auth/login', { username, password })
        
        this.token = response.data.token
        this.user = response.data.user
        
        localStorage.setItem('token', this.token)
        
        return true
      } catch (error) {
        console.error('Login error:', error)
        return false
      }
    },
    
    async logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('token')
    },
    
    async checkAuth() {
      if (!this.token) return false
      
      try {
        const response = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${this.token}` }
        })
        
        this.user = response.data
        return true
      } catch (error) {
        this.logout()
        return false
      }
    }
  }
})