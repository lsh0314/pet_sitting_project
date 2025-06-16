// pages/order/detail.js
const api = require('../../utils/api');
const app = getApp();

Page({
  data: {
    orderId: null,
    orderInfo: null,
    loading: true,
    error: false,
    userRole: '',
    orderStatusText: {
      'pending': '待接单',
      'accepted': '待支付',
      'paid': '待服务',
      'in_progress': '服务中',
      'completed': '待确认',
      'confirmed': '已完成',
      'cancelled': '已取消',
      'rejected': '已拒绝'
    }
  },

  onLoad: function (options) {
    // 获取订单ID
    if (options.id) {
      this.setData({
        orderId: options.id
      });
      
      // 获取用户角色
      const userInfo = wx.getStorageSync('userInfo') || {};
      this.setData({
        userRole: userInfo.role || 'pet_owner'
      });
      
      // 获取订单详情
      this.fetchOrderDetail();
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
  
  // 每次页面显示时刷新数据
  onShow: function() {
    if (this.data.orderId) {
      this.fetchOrderDetail();
    }
  },

  // 获取订单详情
  fetchOrderDetail: function () {
    this.setData({ loading: true, error: false });
    
    api.get(`/api/order/${this.data.orderId}`, {}, true)
      .then(res => {
        this.setData({
          orderInfo: res.data,
          loading: false
        });
      })
      .catch(err => {
        console.error('获取订单详情失败:', err);
        this.setData({
          loading: false,
          error: true
        });
        
        wx.showToast({
          title: '获取订单详情失败',
          icon: 'none'
        });
      });
  },

  // 点击支付按钮
  onTapPay: function () {
    if (!this.data.orderInfo) return;
    
    // 跳转到支付页面
    wx.navigateTo({
      url: `/pages/payment/index?id=${this.data.orderId}`
    });
  },

  // 帮溜员开始服务
  onTapStart: function () {
    if (!this.data.orderInfo) return;
    
    wx.showLoading({
      title: '处理中...',
      mask: true
    });
    
    // 调用开始服务接口
    api.post(`/api/order/${this.data.orderId}/start`, {}, true)
      .then(res => {
        wx.hideLoading();
        
        wx.showToast({
          title: '已开始服务',
          icon: 'success'
        });
        
        // 刷新订单数据
        setTimeout(() => {
          this.fetchOrderDetail();
        }, 1500);
      })
      .catch(err => {
        wx.hideLoading();
        console.error('操作失败:', err);
        
        wx.showToast({
          title: err.message || '操作失败',
          icon: 'none'
        });
      });
  },

  // 帮溜员完成服务
  onTapComplete: function () {
    if (!this.data.orderInfo) return;
    
    wx.showLoading({
      title: '处理中...',
      mask: true
    });
    
    // 调用完成服务接口
    api.post(`/api/order/${this.data.orderId}/complete`, {}, true)
      .then(res => {
        wx.hideLoading();
        
        wx.showToast({
          title: '已完成服务',
          icon: 'success'
        });
        
        // 刷新订单数据
        setTimeout(() => {
          this.fetchOrderDetail();
        }, 1500);
      })
      .catch(err => {
        wx.hideLoading();
        console.error('操作失败:', err);
        
        wx.showToast({
          title: err.message || '操作失败',
          icon: 'none'
        });
      });
  },

  // 宠物主确认完成
  onTapConfirm: function () {
    if (!this.data.orderInfo) return;
    
    wx.showLoading({
      title: '处理中...',
      mask: true
    });
    
    // 调用确认完成接口
    api.post(`/api/order/${this.data.orderId}/confirm`, {}, true)
      .then(res => {
        wx.hideLoading();
        
        wx.showToast({
          title: '已确认完成',
          icon: 'success'
        });
        
        // 刷新订单数据
        setTimeout(() => {
          this.fetchOrderDetail();
        }, 1500);
      })
      .catch(err => {
        wx.hideLoading();
        console.error('操作失败:', err);
        
        wx.showToast({
          title: err.message || '操作失败',
          icon: 'none'
        });
      });
  },

  // 点击重试按钮
  onTapRetry: function () {
    this.fetchOrderDetail();
  },
  
  // 返回上一页
  goBack: function() {
    wx.navigateBack({
      delta: 1
    });
  }
}) 