import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const loading = ref(false)
  const error = ref(null)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin' || user.value?.role === 'super_admin')

  // 操作
  async function login(credentials) {
    try {
      loading.value = true
      error.value = null
      // 管理员登录接口为 /api/auth/admin-login
      const response = await axios.post('/api/auth/admin-login', credentials)
      token.value = response.data.token
      user.value = response.data.user
      // 保存到本地存储
      localStorage.setItem('token', token.value)
      localStorage.setItem('user', JSON.stringify(user.value))
      // 设置请求头的授权信息
      axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || '登录失败，请检查您的凭据'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  function logout() {
    token.value = ''
    user.value = null
    
    // 清除本地存储
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    // 清除请求头的授权信息
    delete axios.defaults.headers.common['Authorization']
  }

  async function getProfile() {
    try {
      loading.value = true
      error.value = null
      
      const response = await axios.get('/api/admin/auth/profile')
      user.value = response.data
      localStorage.setItem('user', JSON.stringify(user.value))
      
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || '获取用户资料失败'
      if (err.response?.status === 401) {
        logout()
      }
      throw error.value
    } finally {
      loading.value = false
    }
  }

  // 初始化 Axios 请求头
  if (token.value) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  }

  return {
    token,
    user,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    getProfile
  }
}) 