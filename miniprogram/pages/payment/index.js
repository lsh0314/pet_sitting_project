const api = require('../../utils/api');

Page({
  data: {
    orderId: null,
    orderInfo: null,
    loading: true,
    error: false,
    submitting: false
  },

  onLoad: function (options) {
    // 获取订单ID
    if (options.id) {
      this.setData({
        orderId: options.id
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

  // 获取订单详情
  fetchOrderDetail: function () {
    this.setData({ loading: true, error: false });
    
    api.get(`/api/order/${this.data.orderId}`, {}, true)
      .then(res => {
        console.log('订单详情:', res);
        // 确保我们有正确的数据格式
        let orderInfo = res.data || res;
        
        // 如果需要，处理字段名称不一致的问题
        if (orderInfo) {
          // 确保我们有正确的价格字段
          if (!orderInfo.price && orderInfo.payment && orderInfo.payment.price) {
            orderInfo.price = orderInfo.payment.price;
          }
          
          // 确保服务类型正确映射
          console.log("原始服务类型:", orderInfo.serviceType);
          
          // 处理可能的数据结构差异，确保服务类型正确
          const serviceTypeMap = {
            'walk': '遛狗',
            'feed': '喂食',
            'boarding': '寄养'
          };
          
          // 从不同可能的数据结构中获取服务类型
          let serviceType = orderInfo.serviceType;
          if (!serviceType && orderInfo.service) {
            serviceType = orderInfo.service.type || orderInfo.service.serviceType;
          }
          
          // 确保服务类型值一致
          if (serviceType) {
            orderInfo.serviceType = serviceType;
            // 添加可读的服务类型名称
            orderInfo.serviceTypeName = serviceTypeMap[serviceType] || '其他服务';
            console.log("处理后的服务类型:", orderInfo.serviceType, orderInfo.serviceTypeName);
          }
          
          // 确保我们有宠物信息
          if (!orderInfo.pet) {
            orderInfo.pet = {
              name: orderInfo.petName || '未知宠物'
            };
          }
          
          // 确保我们有帮溜员信息
          if (!orderInfo.sitter) {
            orderInfo.sitter = {
              nickname: orderInfo.sitterNickname || '未知帮溜员',
              avatar: orderInfo.sitterAvatar || '/static/images/default-avatar.png',
              rating: orderInfo.sitterRating || '5.0'
            };
          }
        }
        
        this.setData({
          orderInfo: orderInfo,
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
    if (!this.data.orderInfo || this.data.submitting) return;
    
    this.setData({ submitting: true });
    
    wx.showLoading({
      title: '处理中...',
      mask: true
    });
    
    // 调用支付接口
    api.post(`/api/payment/order/${this.data.orderId}`, {}, true)
      .then(res => {
        wx.hideLoading();
        
        wx.showToast({
          title: '支付成功',
          icon: 'success'
        });
        
        // 跳转到订单详情页
        setTimeout(() => {
          wx.redirectTo({
            url: `/pages/order/detail?id=${this.data.orderId}`
          });
        }, 1500);
      })
      .catch(err => {
        wx.hideLoading();
        console.error('支付失败:', err);
        
        this.setData({ submitting: false });
        
        wx.showToast({
          title: err.message || '支付失败',
          icon: 'none'
        });
      });
  },

  // 点击取消按钮
  onTapCancel: function () {
    wx.navigateBack();
  },
  
  // 返回上一页
  goBack: function() {
    wx.navigateBack({
      delta: 1
    });
  }
}) 