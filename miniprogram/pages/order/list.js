Page({
  onLoad: function() {
    // 重定向到正确的页面路径
    wx.redirectTo({
      url: '/pages/order/list/list'
    });
  }
}) 