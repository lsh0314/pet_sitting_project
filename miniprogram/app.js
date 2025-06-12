// app.js
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
      
      // 可以在这里验证token的有效性
      // this.verifyToken(token)
    }
  },

  // 验证Token的有效性
  verifyToken: function (token) {
    wx.request({
      url: this.globalData.baseAPI + '/api/user/profile',
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + token
      },
      success: (res) => {
        if (res.data.success) {
          // Token有效，更新用户信息
          this.globalData.userInfo = res.data.data
          wx.setStorageSync('userInfo', res.data.data)
        } else {
          // Token无效，清除登录状态
          this.clearLoginStatus()
        }
      },
      fail: () => {
        // 请求失败，可能是网络问题
        console.error('验证Token失败')
      }
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