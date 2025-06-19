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
    isTracking: false, // 是否正在记录轨迹
    trackTimer: null, // 轨迹记录定时器
    orderStatusText: {
      'accepted': '待支付',
      'paid': '待服务',
      'ongoing': '服务中',
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
        // 处理服务报告数据
        const orderInfo = res.data;
        
        console.log('原始订单信息:', JSON.stringify(orderInfo));
        
        // 处理服务报告中的时间戳和确保imageUrls是数组
        if (orderInfo.reports && orderInfo.reports.length > 0) {
          console.log('原始服务报告:', JSON.stringify(orderInfo.reports));
          
          orderInfo.reports = orderInfo.reports.map(report => {
            // 格式化时间戳
            if (report.timestamp) {
              const date = new Date(report.timestamp);
              report.createdAt = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            } else {
              report.createdAt = '未知时间';
            }
            
            // 确保imageUrls是数组
            if (!report.imageUrls) {
              report.imageUrls = [];
            } else if (!Array.isArray(report.imageUrls)) {
              try {
                report.imageUrls = JSON.parse(report.imageUrls);
                console.log('解析后的imageUrls:', report.imageUrls);
              } catch (e) {
                console.error('解析imageUrls失败:', e);
                report.imageUrls = [];
              }
            }
            
            return report;
          });
          
          console.log('处理后的服务报告:', JSON.stringify(orderInfo.reports));
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
    if (!this.data.orderInfo) return;
    
    // 跳转到支付页面
    wx.navigateTo({
      url: `/pages/payment/index?id=${this.data.orderId}`
    });
  },

  // 帮溜员开始服务
  onTapStart: function () {
    if (!this.data.orderInfo) return;
    
    // 跳转到服务开始打卡页面
    wx.navigateTo({
      url: `/pages/order/service/start?id=${this.data.orderId}`
    });
  },

  // 帮溜员完成服务
  onTapComplete: function () {
    if (!this.data.orderInfo) return;
    
    // 跳转到服务完成打卡页面
    wx.navigateTo({
      url: `/pages/order/service/complete?id=${this.data.orderId}`
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

  // 宠物主评价服务
  onTapReview: function() {
    if (!this.data.orderInfo) return;
    
    // 跳转到评价页面
    wx.navigateTo({
      url: `/pages/order/review?id=${this.data.orderId}`
    });
  },

  // 帮溜员上传照片/视频
  onTapAddReport: function() {
    if (!this.data.orderInfo) return;
    
    // 跳转到上传照片/视频页面
    wx.navigateTo({
      url: `/pages/order/report?id=${this.data.orderId}`
    });
  },

  // 预览图片
  previewImage: function(e) {
    const urls = e.currentTarget.dataset.urls;
    const current = e.currentTarget.dataset.current;
    
    wx.previewImage({
      current: current, // 当前显示图片的链接
      urls: urls // 需要预览的图片链接列表
    });
  },

  // 开始/停止记录轨迹
  onTapTrackLocation: function() {
    if (this.data.isTracking) {
      this.stopTracking();
    } else {
      this.startTracking();
    }
  },

  // 开始记录轨迹
  startTracking: function() {
    const that = this;
    
    // 请求位置权限
    wx.authorize({
      scope: 'scope.userLocation',
      success: function() {
        // 开始监听位置变化
        wx.startLocationUpdate({
          success: function() {
            console.log('开始监听位置变化');
            
            // 设置定时器，每30秒上传一次位置
            const timer = setInterval(() => {
              that.uploadLocation();
            }, 30000); // 30秒
            
            that.setData({
              isTracking: true,
              trackTimer: timer
            });
            
            wx.showToast({
              title: '开始记录轨迹',
              icon: 'success'
            });
          },
          fail: function(err) {
            console.error('开始监听位置失败:', err);
            wx.showToast({
              title: '开始记录失败',
              icon: 'none'
            });
          }
        });
      },
      fail: function() {
        wx.showToast({
          title: '需要位置权限',
          icon: 'none'
        });
      }
    });
  },

  // 停止记录轨迹
  stopTracking: function() {
    // 清除定时器
    if (this.data.trackTimer) {
      clearInterval(this.data.trackTimer);
    }
    
    // 停止监听位置变化
    wx.stopLocationUpdate({
      success: function() {
        console.log('停止监听位置变化');
      }
    });
    
    this.setData({
      isTracking: false,
      trackTimer: null
    });
    
    wx.showToast({
      title: '停止记录轨迹',
      icon: 'success'
    });
  },

  // 上传位置
  uploadLocation: function() {
    const that = this;
    
    // 获取当前位置
    wx.getLocation({
      type: 'gcj02',
      success: function(res) {
        const { latitude, longitude } = res;
        
        // 上传位置到服务器
        api.post(`/api/order/${that.data.orderId}/track`, {
          latitude,
          longitude
        }, true)
        .then(res => {
          console.log('位置上传成功');
        })
        .catch(err => {
          console.error('位置上传失败:', err);
        });
      }
    });
  },

  // 返回上一页
  goBack: function() {
    wx.navigateBack();
  },
  
  // 重试加载
  onTapRetry: function() {
    this.fetchOrderDetail();
  },
  
  // 页面卸载时清理资源
  onUnload: function() {
    // 如果正在记录轨迹，停止记录
    if (this.data.isTracking) {
      this.stopTracking();
    }
  }
}) 