// 引入API请求库
const api = require('../../utils/api');
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    sitters: [], // 帮溜员列表
    loading: false, // 加载状态
    error: false, // 错误状态
    currentPage: 1, // 当前页码
    hasMore: true, // 是否还有更多数据
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.fetchSitters();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0 // 选中首页
      });
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    // 重置数据
    this.setData({
      sitters: [],
      currentPage: 1,
      hasMore: true,
      loading: true,
      error: false
    });
    
    // 重新加载数据
    this.fetchSitters();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreSitters();
    }
  },

  /**
   * 获取帮溜员列表
   */
  fetchSitters: function () {
    // 如果已经在加载中或没有更多数据，直接返回
    if (this.data.loading && !this.data.currentPage === 1) return;
    
    this.setData({ loading: true, error: false });
    
    // 调用接口获取帮溜员列表
    api.get('/api/sitter', { page: this.data.currentPage, size: 10 }, false)
      .then(res => {
        console.log('获取帮溜员列表成功:', res);
        // 处理不同的响应格式
        let newSitters = [];
        if (res.success && res.data) {
          // 格式: { success: true, data: [...] }
          newSitters = res.data;
        } else if (res.data) {
          // 格式: { data: [...] }
          newSitters = res.data;
        } else if (Array.isArray(res)) {
          // 格式: [...]
          newSitters = res;
        }
        
        const hasMore = newSitters.length === 10; // 假设每页10条
        
        this.setData({
          sitters: this.data.currentPage === 1 ? newSitters : [...this.data.sitters, ...newSitters],
          loading: false,
          hasMore
        });
        
        wx.stopPullDownRefresh();
      })
      .catch(err => {
        console.error('获取帮溜员列表失败:', err);
        this.setData({
          loading: false,
          error: true
        });
        
        wx.stopPullDownRefresh();
        
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        });
      });
  },

  /**
   * 加载更多帮溜员
   */
  loadMoreSitters: function () {
    if (this.data.hasMore) {
      this.setData({
        currentPage: this.data.currentPage + 1
      });
      this.fetchSitters();
    }
  },

  /**
   * 点击帮溜员项
   */
  onTapSitter: function (e) {
    const sitterId = e.currentTarget.dataset.id;
    
    // 跳转到帮溜员详情页
    wx.navigateTo({
      url: `/pages/sitter/detail?id=${sitterId}`
    });
  },

  /**
   * 点击重试按钮
   */
  onTapRetry: function () {
    this.setData({
      error: false,
      loading: true
    });
    this.fetchSitters();
  },

  /**
   * 导航到服务页面
   */
  navigateToService: function (e) {
    const type = e.currentTarget.dataset.type;
    const app = getApp();
    
    if (app.globalData.isLoggedIn) {
      // 保存选择的服务类型到全局变量
      app.globalData.selectedServiceType = type === 'cat' ? 'feed' : type === 'dog' ? 'walk' : 'boarding';
      console.log('选择服务类型:', app.globalData.selectedServiceType);
      
      // 已登录，跳转到相应服务页面
      if (type === 'cat') {
        wx.navigateTo({
          url: '/pages/sitter-list/index?type=feed'
        });
      } else if (type === 'dog') {
        wx.navigateTo({
          url: '/pages/sitter-list/index?type=walk'
        });
      } else if (type === 'boarding') {
        wx.navigateTo({
          url: '/pages/sitter-list/index?type=boarding'
        });
      }
    } else {
      // 未登录，跳转到登录页
      wx.navigateTo({
        url: '/pages/auth/index'
      });
    }
  },

  /**
   * 导航到功能页面
   */
  navigateToFeature: function (e) {
    const feature = e.currentTarget.dataset.feature;
    
    switch (feature) {
      case 'subscribe':
        // 关注公众号
        wx.showToast({
          title: '请扫描公众号二维码',
          icon: 'none'
        });
        break;
      case 'coupon':
        // 储值优惠
        if (app.globalData.isLoggedIn) {
          wx.navigateTo({
            url: '/pages/wallet/index'
          });
        } else {
          wx.navigateTo({
            url: '/pages/auth/index'
          });
        }
        break;
      case 'adoption':
        // 宠物领养
        wx.navigateTo({
          url: '/pages/adoption/index'
        });
        break;
    }
  }
}) 