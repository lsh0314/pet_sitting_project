// pages/order/review.js
const api = require('../../utils/api');

Page({
  data: {
    orderId: null,
    orderInfo: null,
    loading: false,
    rating: 5, // 默认5星
    comment: '',
    tags: [],
    isAnonymous: false,
    availableTags: ['守时', '有爱心', '专业', '耐心', '沟通顺畅', '宠物喜欢']
  },

  onLoad: function (options) {
    if (options.id) {
      this.setData({
        orderId: options.id
      });
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
    this.setData({ loading: true });
    
    api.get(`/api/order/${this.data.orderId}`, {}, true)
      .then(res => {
        this.setData({
          orderInfo: res.data,
          loading: false
        });
      })
      .catch(err => {
        console.error('获取订单详情失败:', err);
        this.setData({ loading: false });
        
        wx.showToast({
          title: '获取订单详情失败',
          icon: 'none'
        });
      });
  },

  // 设置评分
  onRatingChange: function (e) {
    const rating = parseInt(e.currentTarget.dataset.rating);
    this.setData({ rating });
  },

  // 输入评价内容
  onCommentInput: function (e) {
    this.setData({
      comment: e.detail.value
    });
  },

  // 选择/取消选择标签
  onTagTap: function (e) {
    const tag = e.currentTarget.dataset.tag;
    const { tags } = this.data;
    
    if (tags.includes(tag)) {
      // 取消选择
      this.setData({
        tags: tags.filter(t => t !== tag)
      });
    } else {
      // 选择
      this.setData({
        tags: [...tags, tag]
      });
    }
  },

  // 切换匿名评价
  onAnonymousChange: function (e) {
    this.setData({
      isAnonymous: e.detail.value
    });
  },

  // 提交评价
  onSubmit: function () {
    if (!this.data.orderInfo) return;
    
    const { rating, comment, tags, isAnonymous } = this.data;
    
    if (rating < 1 || rating > 5) {
      wx.showToast({
        title: '请选择评分',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ loading: true });
    
    // 调用评价接口
    api.post(`/api/order/${this.data.orderId}/review`, {
      rating,
      comment,
      tags,
      isAnonymous
    }, true)
    .then(res => {
      this.setData({ loading: false });
      
      wx.showToast({
        title: '评价成功',
        icon: 'success'
      });
      
      // 返回订单详情页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    })
    .catch(err => {
      this.setData({ loading: false });
      console.error('评价失败:', err);
      
      wx.showToast({
        title: err.message || '评价失败',
        icon: 'none'
      });
    });
  },

  // 返回上一页
  goBack: function () {
    wx.navigateBack();
  }
}) 