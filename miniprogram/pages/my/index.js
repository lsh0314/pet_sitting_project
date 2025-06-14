// pages/my/index.js
const app = getApp();

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    pets: [],
    hasBalance: false,
    menuList: [
      {
        id: 'profile',
        name: '个人资料',
        icon: '/static/images/profile.png'
      },
      {
        id: 'pets',
        name: '我的宠物',
        icon: '/static/images/pets.png'
      },
      {
        id: 'sitter_profile',
        name: '帮溜主页',
        icon: '/static/images/sitter.png'
      },
      {
        id: 'wallet',
        name: '我的钱包',
        icon: '/static/images/wallet.png'
      }
    ]
  },

  onLoad: function (options) {
    // 页面加载时执行
  },

  onShow: function () {
    // 设置底部tabbar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2 // 选中我的页面
      });
    }
    
    // 获取登录状态和用户信息
    this.setData({
      isLoggedIn: app.globalData.isLoggedIn,
      userInfo: app.globalData.userInfo
    });
    
    // 如果已登录，获取宠物列表
    if (this.data.isLoggedIn) {
      this.fetchPets();
    }
  },
  
  // 获取宠物列表
  fetchPets: function() {
    const token = wx.getStorageSync('token');
    if (!token) return;
    
    wx.request({
      url: `${app.globalData.apiBaseUrl}/api/pet`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({
            pets: res.data
          });
        }
      },
      fail: (err) => {
        console.error('获取宠物列表失败:', err);
      }
    });
  },

  // 跳转到登录页
  navigateToLogin: function() {
    wx.navigateTo({
      url: '/pages/auth/index'
    });
  },
  
  // 跳转到我的宠物页面
  navigateToPets: function() {
    if (!this.data.isLoggedIn) {
      this.navigateToLogin();
      return;
    }
    
    wx.navigateTo({
      url: '/pages/my/pets/index'
    });
  },
  
  // 跳转到添加宠物页面
  navigateToAddPet: function() {
    if (!this.data.isLoggedIn) {
      this.navigateToLogin();
      return;
    }
    
    wx.navigateTo({
      url: '/pages/my/pets/add'
    });
  },
  
  // 跳转到宠物详情页面
  navigateToPetDetail: function(e) {
    if (!this.data.isLoggedIn) {
      this.navigateToLogin();
      return;
    }
    
    const petId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/my/pets/detail?id=${petId}`
    });
  },

  // 点击菜单项
  onTapMenuItem: function(e) {
    const id = e.currentTarget.dataset.id;
    
    // 根据ID跳转到不同页面
    switch(id) {
      case 'profile':
        // 跳转到个人资料页
        break;
      case 'pets':
        // 跳转到我的宠物页
        break;
      case 'sitter_profile':
        // 跳转到帮溜主页
        break;
      case 'wallet':
        // 跳转到我的钱包页
        break;
    }
  }
}) 