import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const token = ref(localStorage.getItem('token') || '')
  let userStr = localStorage.getItem('user')
  try {
    userStr = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null
  } catch (e) {
    userStr = null
  }
  const user = ref(userStr)
  const loading = ref(false)
  const error = ref(null)

  // 计算属性
    // 计算属性
  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => {
    console.log('Current user:', user.value); // 调试日志
    return user.value?.role === 'admin' || 
           user.value?.role === 'super_admin' || 
           user.value?.role === '系统管理员';
  })

  // 操作  
  async function login(credentials) {
    try {
      loading.value = true
      error.value = null
      
      // 管理员登录接口为 /api/auth/admin-login
      const response = await axios.post('/api/auth/admin-login', credentials)
        // 确保从正确的位置获取 token
      const receivedToken = response.data.data?.token || response.data.token;
      const userData = response.data.data?.user || response.data.user;
      
      // 同步更新状态和本地存储
      token.value = receivedToken;
      user.value = userData;
      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // 设置请求头的授权信息
      axios.defaults.headers.common['Authorization'] = `Bearer ${receivedToken}`;
      
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || '登录失败，请检查您的凭据'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  function logout() {
    // 先清除本地存储
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    // 再清除内存中的状态
    token.value = ''
    user.value = null
    
    // 最后清除请求头
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
