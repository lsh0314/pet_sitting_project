const api = require('../../utils/api');

Page({
  data: {
    orderId: null,
    orderInfo: null,
    loading: true
  },

  onLoad: function (options) {
    // 获取订单ID
    if (options.id) {
      this.setData({
        orderId: options.id
      });
      // 获取订单详情
      this.getOrderDetail(options.id);
    } else {
      wx.showToast({
        title: '订单参数错误',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 获取订单详情
  getOrderDetail: function (orderId) {
    this.setData({ loading: true });
    api.get(`/api/order/${orderId}`)
      .then(res => {
        this.setData({
          orderInfo: res,
          loading: false
        });
      })
      .catch(err => {
        console.error('获取订单详情失败:', err);
        wx.showToast({
          title: '获取订单信息失败',
          icon: 'none'
        });
        this.setData({ loading: false });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      });
  },

  // 支付订单
  payOrder: function () {
    const { orderId } = this.data;
    
    wx.showLoading({
      title: '支付处理中...',
      mask: true
    });

    // 调用支付接口
    api.post(`/api/payment/order/${orderId}`)
      .then(res => {
        wx.hideLoading();
        
        // MVP阶段，直接显示支付成功
        wx.showToast({
          title: '支付成功',
          icon: 'success'
        });
        
        // 延迟返回订单列表页
        setTimeout(() => {
          // 返回订单列表页并刷新
          const pages = getCurrentPages();
          // 如果有上一页
          if (pages.length > 1) {
            // 返回上一页
            wx.navigateBack({
              success: function() {
                // 通知上一页刷新数据
                const prevPage = pages[pages.length - 2];
                prevPage.getOrderList && prevPage.getOrderList();
              }
            });
          } else {
            // 如果没有上一页，直接跳转到订单列表页
            wx.redirectTo({
              url: '/pages/order/index'
            });
          }
        }, 1500);
      })
      .catch(err => {
        wx.hideLoading();
        console.error('支付失败:', err);
        wx.showToast({
          title: '支付失败，请重试',
          icon: 'none'
        });
      });
  },

  // 取消支付
  cancelPay: function () {
    wx.navigateBack();
  }
}) 