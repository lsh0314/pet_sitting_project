// pages/order/index.js
const api = require('../../utils/api');

Page({
  data: {
    orders: [],
    loading: false,
    currentTab: 0, // 0: 全部, 1: 待支付, 2: 待服务, 3: 服务中, 4: 已完成
    tabs: ['全部', '待支付', '待服务', '服务中', '已完成'],
    statusMap: {
      0: '', // 全部
      1: 'accepted', // 待支付
      2: 'paid', // 待服务
      3: 'in_progress', // 服务中
      4: 'completed,confirmed' // 已完成
    },
    countdownTimers: {}, // 存储订单倒计时定时器
    currentRole: 'pet_owner', // 默认角色为宠物主
    userRoles: [], // 用户拥有的角色列表
    isSitter: false, // 是否是伴宠专员
    checkingSitterStatus: false // 是否正在检查伴宠专员状态
  },

  onLoad: function (options) {
    console.log('页面加载 onLoad');
    // 页面加载时执行
    this.checkUserRoles();
    // 检查用户是否是伴宠专员
    this.checkSitterStatus();
  },

  onShow: function () {
    console.log('页面显示 onShow');
    // 设置底部tabbar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1 // 选中订单页
      });
    }
    
    // 检查用户是否是伴宠专员（每次页面显示时都检查）
    this.checkSitterStatus();
    
    // 获取订单列表
    this.getOrderList();
  },
  
  onHide: function() {
    // 页面隐藏时清除所有倒计时
    this.clearAllCountdowns();
  },
  
  onUnload: function() {
    // 页面卸载时清除所有倒计时
    this.clearAllCountdowns();
  },

  // 检查用户是否是伴宠专员
  checkSitterStatus: function() {
    console.log('开始检查用户是否是伴宠专员...');
    this.setData({ checkingSitterStatus: true });
    
    // 调用API检查用户是否是伴宠专员
    api.get('/api/sitter/profile')
      .then(res => {
        console.log('获取伴宠专员资料结果:', res);
        // 如果返回的profile不为null，说明用户是伴宠专员
        const isSitter = res && res.profile !== null;
        console.log('是否是伴宠专员:', isSitter);
        this.setData({ 
          isSitter: isSitter,
          checkingSitterStatus: false
        });
        
        // 如果当前选择的是伴宠专员角色，但用户不是伴宠专员，自动切换到宠物主角色
        if (this.data.currentRole === 'sitter' && !isSitter) {
          console.log('用户不是伴宠专员，自动切换到宠物主角色');
          this.setData({ currentRole: 'pet_owner' });
          this.getOrderList();
        }
      })
      .catch(err => {
        console.error('检查伴宠专员状态失败:', err);
        this.setData({ 
          isSitter: false,
          checkingSitterStatus: false
        });
      });
  },

  // 检查用户拥有的角色
  checkUserRoles: function() {
    const app = getApp();
    const userInfo = app.globalData.userInfo;
    
    if (!userInfo) {
      return;
    }
    
    // 始终显示两个角色选项，无论用户是否拥有这些角色
    // 如果用户没有特定角色，点击对应选项时会显示空列表
    
    // 更新当前角色（如果未设置）
    if (!this.data.currentRole) {
      this.setData({
        currentRole: 'pet_owner'  // 默认显示宠物主角色
      });
    }
    
    console.log('当前选择的角色:', this.data.currentRole);
  },

  // 切换角色
  switchRole: function(e) {
    const role = e.currentTarget.dataset.role;
    console.log('尝试切换角色:', role);
    
    // 如果要切换到伴宠专员角色
    if (role === 'sitter') {
      // 检查用户是否是伴宠专员
      api.get('/api/sitter/profile')
        .then(res => {
          console.log('获取伴宠专员资料结果:', res);
          // 如果返回的profile为null，说明用户不是伴宠专员
          const isSitter = res && res.profile !== null;
          
          if (!isSitter) {
            console.log('用户不是伴宠专员，显示提示信息');
            // 显示提示信息
            wx.showModal({
              title: '提示',
              content: '还未成为伴宠专员不能接单，请至我的页面申请',
              confirmText: '去申请',
              cancelText: '取消',
              success: (res) => {
                if (res.confirm) {
                  console.log('用户点击去申请，跳转到我的页面');
                  // 跳转到"我的"页面
                  wx.switchTab({
                    url: '/pages/my/index'
                  });
                }
              }
            });
          } else {
            // 用户是伴宠专员，允许切换角色
            console.log('用户是伴宠专员，允许切换角色');
            if (role !== this.data.currentRole) {
              this.setData({
                currentRole: role
              });
              
              // 重新获取订单列表
              this.getOrderList();
            }
          }
        })
        .catch(err => {
          console.error('检查伴宠专员状态失败:', err);
          wx.showToast({
            title: '网络错误，请重试',
            icon: 'none'
          });
        });
    } else {
      // 切换到宠物主角色，直接允许
      if (role !== this.data.currentRole) {
        this.setData({
          currentRole: role
        });
        
        // 重新获取订单列表
        this.getOrderList();
      }
    }
  },

  // 切换标签页
  switchTab: function(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      currentTab: tab
    });
    this.getOrderList();
  },

  // 获取订单列表
  getOrderList: function() {
    // 清除之前的所有倒计时
    this.clearAllCountdowns();
    
    this.setData({ loading: true });
    
    // 获取用户信息
    const app = getApp();
    const userInfo = app.globalData.userInfo;
    
    if (!userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      this.setData({ loading: false });
      return;
    }
    
    // 使用当前选择的角色
    const role = this.data.currentRole;
    
    // 获取当前选中的状态
    const status = this.data.statusMap[this.data.currentTab];
    
    console.log('请求参数:', { role, status });
    
    // 调用API获取订单列表
    api.get('/api/order/my', { role, status })
      .then(res => {
        console.log('获取订单列表成功:', res);
        
        // 处理后端返回的数据格式
        let orders = [];
        
        // 检查返回数据的结构
        if (res && res.success === true && res.data && res.data.orders) {
          // 如果后端返回的是带有success和data的格式
          orders = res.data.orders;
        } else if (res && res.success === true && Array.isArray(res.orders)) {
          // 如果后端返回的是带有success和orders的格式
          orders = res.orders;
        } else if (res && Array.isArray(res)) {
          // 如果后端直接返回数组
          orders = res;
        } else if (res && res.orders && Array.isArray(res.orders)) {
          // 如果后端返回的是带有orders字段的对象
          orders = res.orders;
        } else {
          console.error('未知的响应格式:', res);
          orders = [];
        }
        
        // 确保所有订单都有必要的字段，并为待支付订单添加创建时间和倒计时
        orders = orders.map(order => {
          // 确保有状态文本
          if (!order.statusText) {
            let statusText = '';
            switch(order.status) {
              case 'accepted': statusText = '待支付'; break;
              case 'paid': statusText = '待服务'; break;
              case 'in_progress': statusText = '服务中'; break;
              case 'completed': statusText = '待确认'; break;
              case 'confirmed': statusText = '已完成'; break;
              default: statusText = '未知状态';
            }
            order.statusText = statusText;
          }
          
          // 确保有服务类型文本
          if (!order.serviceTypeText) {
            let serviceTypeText = '';
            switch(order.serviceType) {
              case 'walk': serviceTypeText = '遛狗'; break;
              case 'feed': serviceTypeText = '喂猫'; break;
              case 'boarding': serviceTypeText = '寄养'; break;
              default: serviceTypeText = '其他服务';
            }
            order.serviceTypeText = serviceTypeText;
          }
          
          // 为待支付订单添加倒计时初始值
          if (order.status === 'accepted') {
            // 默认倒计时为15分钟
            order.countdown = '15:00';
            
            // 如果有创建时间，计算剩余时间
            if (order.createdAt) {
              const createdTime = new Date(order.createdAt).getTime();
              const now = new Date().getTime();
              const elapsedSeconds = Math.floor((now - createdTime) / 1000);
              
              // 15分钟 = 900秒
              const remainingSeconds = Math.max(0, 900 - elapsedSeconds);
              
              if (remainingSeconds > 0) {
                const minutes = Math.floor(remainingSeconds / 60);
                const seconds = remainingSeconds % 60;
                order.countdown = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
              } else {
                // 如果已经超过15分钟，设置为00:00
                order.countdown = '00:00';
              }
            }
          }
          
          return order;
        });
        
        this.setData({
          orders,
          loading: false
        });
        
        // 为待支付订单启动倒计时
        this.startCountdowns();
      })
      .catch(err => {
        console.error('获取订单列表失败:', err);
        
        // 显示更友好的错误提示
        let errorMsg = '获取订单失败';
        if (err && err.message) {
          if (err.message.includes('network')) {
            errorMsg = '网络连接失败，请检查网络';
          } else if (err.message.includes('timeout')) {
            errorMsg = '请求超时，请稍后重试';
          }
        }
        
        wx.showToast({
          title: errorMsg,
          icon: 'none'
        });
        
        this.setData({ 
          loading: false,
          orders: []  // 清空订单列表
        });
      });
  },
  
  // 启动所有待支付订单的倒计时
  startCountdowns: function() {
    const { orders, countdownTimers } = this.data;
    
    // 清除之前的所有倒计时
    this.clearAllCountdowns();
    
    // 为每个待支付订单启动倒计时
    orders.forEach((order, index) => {
      if (order.status === 'accepted') {
        // 解析倒计时字符串
        const [minutes, seconds] = order.countdown.split(':').map(Number);
        let totalSeconds = minutes * 60 + seconds;
        
        if (totalSeconds <= 0) {
          // 如果已经超时，直接取消订单
          this.autoCancelOrder(order.orderId);
          return;
        }
        
        // 创建定时器，每秒更新一次倒计时
        const timerId = setInterval(() => {
          totalSeconds--;
          
          if (totalSeconds <= 0) {
            // 倒计时结束，取消订单
            clearInterval(timerId);
            this.autoCancelOrder(order.orderId);
            return;
          }
          
          // 更新倒计时显示
          const newMinutes = Math.floor(totalSeconds / 60);
          const newSeconds = totalSeconds % 60;
          const newCountdown = `${newMinutes.toString().padStart(2, '0')}:${newSeconds.toString().padStart(2, '0')}`;
          
          // 更新数据
          const orderKey = `orders[${index}].countdown`;
          this.setData({
            [orderKey]: newCountdown
          });
        }, 1000);
        
        // 保存定时器ID
        countdownTimers[order.orderId] = timerId;
      }
    });
    
    this.setData({ countdownTimers });
  },
  
  // 清除所有倒计时
  clearAllCountdowns: function() {
    const { countdownTimers } = this.data;
    
    // 清除所有定时器
    Object.values(countdownTimers).forEach(timerId => {
      clearInterval(timerId);
    });
    
    this.setData({
      countdownTimers: {}
    });
  },
  
  // 自动取消订单（倒计时结束）
  autoCancelOrder: function(orderId) {
    console.log('倒计时结束，自动取消订单:', orderId);
    
    // 调用取消订单API
    api.post(`/api/order/${orderId}/cancel`, { reason: '支付超时自动取消' })
      .then(() => {
        console.log('订单自动取消成功');
        // 刷新订单列表
        this.getOrderList();
      })
      .catch(err => {
        console.error('订单自动取消失败:', err);
        // 尝试刷新订单列表
        this.getOrderList();
      });
  },

  // 查看订单详情
  viewOrderDetail: function(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/order/detail?id=${orderId}`
    });
  },

  // 取消订单
  cancelOrder: function(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认取消',
      content: '确定要取消这个订单吗？',
      success: (res) => {
        if (res.confirm) {
          // 调用取消订单API
          api.post(`/api/order/${orderId}/cancel`, { reason: '用户主动取消' })
            .then(() => {
              wx.showToast({
                title: '订单已取消',
                icon: 'success'
              });
              // 刷新订单列表
              this.getOrderList();
            })
            .catch(err => {
              console.error('取消订单失败:', err);
              wx.showToast({
                title: '取消失败',
                icon: 'none'
              });
            });
        }
      }
    });
  },

  // 去支付
  payOrder: function(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/payment/index?id=${orderId}`
    });
  },
  
  // 开始服务
  startService: function(e) {
    const orderId = e.currentTarget.dataset.id;
    
    // 显示确认对话框
    wx.showModal({
      title: '开始服务',
      content: '确定要开始服务吗？开始后需要拍照打卡确认您已到达服务地点',
      confirmText: '确定',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 跳转到服务开始打卡页面
          wx.navigateTo({
            url: `/pages/order/service/start?id=${orderId}`
          });
        }
      }
    });
  }
}) 