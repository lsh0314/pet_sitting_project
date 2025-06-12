// pages/my/index.js
const app = getApp();

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
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
  },

  // 跳转到登录页
  goToLogin: function() {
    wx.navigateTo({
      url: '/pages/auth/index'
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