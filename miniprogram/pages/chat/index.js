// pages/chat/index.js
Page({
  data: {
    // 页面数据
    chatList: []
  },

  onLoad: function (options) {
    // 页面加载时执行
  },

  onShow: function () {
    // 页面显示时执行
    this.getChatList();
  },

  // 获取聊天列表
  getChatList: function() {
    // 在实际开发中会从服务器获取聊天列表
    // 这里暂时使用模拟数据
    this.setData({
      chatList: [
        // 模拟聊天数据
      ]
    });
  }
}) 