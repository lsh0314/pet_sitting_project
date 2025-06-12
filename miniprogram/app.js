// app.js
// 引入API请求库
const api = require('./utils/api');

App({
  onLaunch: function () {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 检查是否已经登录
    this.checkLoginStatus()
  },

  // 检查登录状态
  checkLoginStatus: function () {
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')

    if (token && userInfo) {
      // 如果本地存储有token和用户信息，设置为已登录状态
      this.globalData.isLoggedIn = true
      this.globalData.userInfo = userInfo
      
      // 验证token的有效性并获取最新用户信息
      this.verifyToken(token)
    }
  },

  // 验证Token的有效性
  verifyToken: function (token) {
    // 显示加载提示
    wx.showLoading({
      title: '自动登录中',
      mask: true
    })
    
    // 使用封装的API请求函数调用用户资料接口
    api.get('/api/user/profile')
      .then(res => {
        // 隐藏加载提示
        wx.hideLoading()
        
        // Token有效，更新用户信息
        this.globalData.userInfo = res.data
        wx.setStorageSync('userInfo', res.data)
        console.log('自动登录成功，用户信息已更新')
      })
      .catch(err => {
        // 隐藏加载提示
        wx.hideLoading()
        
        // Token无效或请求失败，清除登录状态
        console.error('验证Token失败:', err)
        this.clearLoginStatus()
      })
  },

  // 清除登录状态
  clearLoginStatus: function () {
    this.globalData.isLoggedIn = false
    this.globalData.userInfo = null
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
  },

  // 全局数据
  globalData: {
    baseAPI: 'http://localhost:3000', // 开发环境API地址
    // baseAPI: 'https://api.petsitting.com', // 生产环境API地址
    isLoggedIn: false,
    userInfo: null
  }
}) 