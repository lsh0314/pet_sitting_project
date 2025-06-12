// pages/order/index.js
Page({
  data: {
    orders: [],
    loading: false,
    currentTab: 0, // 0: 全部, 1: 待接单, 2: 待支付, 3: 待服务, 4: 服务中, 5: 已完成
    tabs: ['全部', '待接单', '待支付', '待服务', '服务中', '已完成']
  },

  onLoad: function (options) {
    // 页面加载时执行
  },

  onShow: function () {
    // 设置底部tabbar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1 // 选中订单页
      });
    }
    
    // 获取订单列表
    this.getOrderList();
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
    // 在实际开发中会根据currentTab获取不同状态的订单
    this.setData({ loading: true });
    
    // 这里暂时使用模拟数据
    setTimeout(() => {
      this.setData({
        orders: [
          // 模拟订单数据
        ],
        loading: false
      });
    }, 500);
  }
}) 