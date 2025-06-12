// pages/sitter/detail.js
const api = require('../../utils/api');

Page({
  data: {
    sitterId: null,
    sitterInfo: null,
    loading: true,
    error: false
  },

  onLoad: function (options) {
    // 获取帮溜员ID
    if (options.id) {
      this.setData({
        sitterId: options.id
      });
      this.fetchSitterDetail();
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 获取帮溜员详情
  fetchSitterDetail: function () {
    this.setData({ loading: true, error: false });
    
    // 调用接口获取帮溜员详情
    api.get(`/api/sitter/${this.data.sitterId}`, {}, false)
      .then(res => {
        this.setData({
          sitterInfo: res.data,
          loading: false
        });
      })
      .catch(err => {
        console.error('获取帮溜员详情失败:', err);
        this.setData({
          loading: false,
          error: true
        });
        
        wx.showToast({
          title: '获取帮溜员详情失败',
          icon: 'none'
        });
      });
  },

  // 点击下单按钮
  onTapOrder: function () {
    if (!this.data.sitterInfo) return;
    
    // 跳转到下单页面
    wx.navigateTo({
      url: `/pages/order/create?sitterId=${this.data.sitterId}`
    });
  },

  // 点击重试按钮
  onTapRetry: function () {
    this.fetchSitterDetail();
  }
}) 