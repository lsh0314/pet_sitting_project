// 引入API请求库
const api = require('../../utils/api');
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    canIUseGetUserProfile: false, // 是否可以使用getUserProfile
    isLoggingIn: false, // 是否正在登录
    redirect: '', // 跳转目标页
    isDevEnv: true, // 是否为开发环境
    showTestUsers: false, // 是否显示测试用户列表
    testUsers: [
      { id: 1, name: '小明', openid: 'openid_1', role: 'sitter' },
      { id: 2, name: '小红', openid: 'openid_2', role: 'sitter' },
      { id: 3, name: '旺财', openid: 'openid_3', role: 'sitter' },
      { id: 4, name: '小花', openid: 'openid_4', role: 'sitter' },
      { id: 5, name: '大壮', openid: 'openid_5', role: 'sitter' },
      { id: 6, name: '张三', openid: 'openid_6', role: 'pet_owner' },
      { id: 7, name: '李四', openid: 'openid_7', role: 'pet_owner' },
      { id: 8, name: '王五', openid: 'openid_8', role: 'pet_owner' },
      { id: 9, name: '赵六', openid: 'openid_9', role: 'pet_owner' },
      { id: 10, name: '钱七', openid: 'openid_10', role: 'pet_owner' }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 判断是否支持getUserProfile
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      });
    }
    
    // 获取跳转目标页
    if (options.redirect) {
      this.setData({
        redirect: decodeURIComponent(options.redirect)
      });
    }
  },

  /**
   * 使用getUserProfile获取用户信息
   * 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认
   * 详见: https://developers.weixin.qq.com/miniprogram/dev/api/open-api/user-info/wx.getUserProfile.html
   */
  getUserProfile: function (e) {
    // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认
    // 开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
    this.setData({
      isLoggingIn: true
    });
    
    wx.getUserProfile({
      desc: '用于完善用户资料', // 声明获取用户个人信息后的用途
      success: (res) => {
        this.login(res.userInfo);
      },
      fail: (err) => {
        console.error('获取用户信息失败:', err);
        this.setData({
          isLoggingIn: false
        });
        
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 旧版获取用户信息方式
   */
  getUserInfo: function (e) {
    if (e.detail.userInfo) {
      this.login(e.detail.userInfo);
    } else {
      this.setData({
        isLoggingIn: false
      });
      
      wx.showToast({
        title: '获取用户信息失败',
        icon: 'none'
      });
    }
  },

  /**
   * 执行登录流程
   */
  login: function (userInfo) {
    // 获取code
    wx.login({
      success: (res) => {
        if (res.code) {
          // 调用后端登录接口
          api.post('/api/auth/wechat-login', {
            code: res.code,
            userInfo: userInfo
          }, false)
            .then(res => {
              // 登录成功，保存token和用户信息
              const { token, user } = res.data;
              
              wx.setStorageSync('token', token);
              wx.setStorageSync('userInfo', user);
              
              // 更新全局状态
              app.globalData.isLoggedIn = true;
              app.globalData.userInfo = user;
              
              // 登录成功提示
              wx.showToast({
                title: '登录成功',
                icon: 'success',
                duration: 1500
              });
              
              // 登录成功后跳转
              setTimeout(() => {
                if (this.data.redirect) {
                  wx.redirectTo({
                    url: this.data.redirect
                  });
                } else {
                  wx.switchTab({
                    url: '/pages/index/index'
                  });
                }
              }, 1500);
            })
            .catch(err => {
              console.error('登录失败:', err);
              this.setData({
                isLoggingIn: false
              });
              
              wx.showToast({
                title: '登录失败，请重试',
                icon: 'none'
              });
            });
        } else {
          console.error('获取code失败:', res);
          this.setData({
            isLoggingIn: false
          });
          
          wx.showToast({
            title: '登录失败，请重试',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('wx.login调用失败:', err);
        this.setData({
          isLoggingIn: false
        });
        
        wx.showToast({
          title: '登录失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 切换测试用户列表显示状态
   */
  toggleTestUsers: function() {
    this.setData({
      showTestUsers: !this.data.showTestUsers
    });
  },

  /**
   * 选择测试用户登录
   */
  selectTestUser: function(e) {
    const userId = e.currentTarget.dataset.id;
    const user = this.data.testUsers.find(u => u.id === userId);
    
    if (!user) return;
    
    this.setData({
      isLoggingIn: true
    });
    
    // 调用开发环境专用的登录接口
    api.post('/api/auth/dev-login', {
      openid: user.openid
    }, false)
      .then(res => {
        // 登录成功，保存token和用户信息
        const { token, user } = res.data;
        
        wx.setStorageSync('token', token);
        wx.setStorageSync('userInfo', user);
        
        // 更新全局状态
        app.globalData.isLoggedIn = true;
        app.globalData.userInfo = user;
        
        // 登录成功提示
        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1500
        });
        
        // 登录成功后跳转
        setTimeout(() => {
          if (this.data.redirect) {
            wx.redirectTo({
              url: this.data.redirect
            });
          } else {
            wx.switchTab({
              url: '/pages/index/index'
            });
          }
        }, 1500);
      })
      .catch(err => {
        console.error('测试用户登录失败:', err);
        this.setData({
          isLoggingIn: false
        });
        
        wx.showToast({
          title: '登录失败，请重试',
          icon: 'none'
        });
      });
  }
}) 