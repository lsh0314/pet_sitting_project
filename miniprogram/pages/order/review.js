// pages/order/review.js
const api = require('../../utils/api');

Page({
  data: {
    orderId: null,
    orderInfo: null,
    loading: false,
    submitting: false,
    rating: 5, // 默认5星
    ratingText: '非常满意', // 评分对应的文字描述
    comment: '',
    selectedTags: [], // 更改变量名使其更明确
    isAnonymous: false,
    availableTags: ['守时', '有爱心', '专业', '耐心', '沟通顺畅', '宠物喜欢'],
    showSuccess: false, // 控制成功动画显示
    tagActiveStates: {}, // 新增：存储每个标签的选中状态
    isViewMode: false, // 是否为查看模式
    reviewData: null // 评价数据
  },

  onLoad: function (options) {
    if (options.id) {
      this.setData({
        orderId: options.id,
        isViewMode: options.mode === 'view' // 设置是否为查看模式
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
        // 检查订单状态是否可以评价
        if (!this.data.isViewMode) {
          const validStatuses = ['completed', 'confirmed', 'pending_review'];
          if (!validStatuses.includes(res.data.status)) {
            wx.showToast({
              title: '只能评价已完成或已确认的订单',
              icon: 'none',
              duration: 2000
            });
            setTimeout(() => {
              wx.navigateBack();
            }, 2000);
            return;
          }
        }
        
        this.setData({
          orderInfo: res.data,
          loading: false
        });
        
        // 如果是查看模式，获取评价数据
        if (this.data.isViewMode) {
          this.fetchReviewData();
        }
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
  
  // 获取评价数据
  fetchReviewData: function() {
    this.setData({ loading: true });
    
    api.get(`/api/order/${this.data.orderId}/review`, {}, true)
      .then(res => {
        console.log('获取评价数据成功，原始数据:', res);
        
        // 设置评价数据
        if (res.data) {
          console.log('评价数据:', res.data);
          console.log('原始标签数据类型:', typeof res.data.tags);
          console.log('原始标签数据是否为数组:', Array.isArray(res.data.tags));
          console.log('原始标签数据:', res.data.tags);
          
          // 处理标签，确保是数组
          let tags = [];
          
          // 确保标签是数组
          if (res.data.tags && Array.isArray(res.data.tags)) {
            console.log('标签已经是数组格式');
            tags = res.data.tags;
          } else if (res.data.tags && typeof res.data.tags === 'string') {
            try {
              console.log('尝试解析JSON字符串:', res.data.tags);
              tags = JSON.parse(res.data.tags);
              console.log('JSON解析结果:', tags);
            } catch (e) {
              console.error('解析评价标签失败:', e);
              tags = [];
            }
          }
          
          console.log('最终处理后的标签数据:', tags);
          
          // 设置标签激活状态
          const tagActiveStates = {};
          tags.forEach(tag => {
            tagActiveStates[tag] = true;
          });
          
          // 格式化评价时间
          let createdAtFormatted = '未知时间';
          if (res.data.createdAt) {
            try {
              const date = new Date(res.data.createdAt);
              createdAtFormatted = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            } catch (e) {
              console.error('日期格式化失败:', e);
            }
          }
          
          // 更新评价数据
          const reviewData = {
            ...res.data,
            createdAt: createdAtFormatted
          };
          
          console.log('处理后的评价数据:', reviewData);
          
          this.setData({
            reviewData: reviewData,
            rating: reviewData.rating || 5,
            comment: reviewData.comment || '',
            selectedTags: tags,
            tagActiveStates: tagActiveStates,
            ratingText: this.getRatingText(reviewData.rating || 5),
            loading: false
          });
        } else {
          this.setData({ 
            loading: false,
            reviewData: null
          });
          
          wx.showToast({
            title: '该订单暂无评价',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        console.error('获取评价数据失败:', err);
        this.setData({ loading: false });
        
        wx.showToast({
          title: '获取评价数据失败',
          icon: 'none'
        });
      });
  },

  // 根据评分获取文字描述
  getRatingText: function(rating) {
    const ratingTextMap = {
      1: '非常不满意',
      2: '不太满意',
      3: '一般',
      4: '满意',
      5: '非常满意'
    };
    return ratingTextMap[rating] || '未知评价';
  },

  // 设置评分
  onRatingChange: function (e) {
    // 查看模式下不允许修改
    if (this.data.isViewMode) return;
    
    const rating = parseInt(e.currentTarget.dataset.rating);
    // 根据评分设置对应的文字描述
    const ratingTextMap = {
      1: '非常不满意',
      2: '不太满意',
      3: '一般',
      4: '满意',
      5: '非常满意'
    };
    
    this.setData({ 
      rating,
      ratingText: ratingTextMap[rating]
    });
  },

  // 输入评价内容
  onCommentInput: function (e) {
    // 查看模式下不允许修改
    if (this.data.isViewMode) return;
    
    this.setData({
      comment: e.detail.value
    });
  },

  // 选择/取消选择标签
  onTagTap: function (e) {
    // 查看模式下不允许修改
    if (this.data.isViewMode) return;
    
    const tag = e.currentTarget.dataset.tag;
    const { selectedTags, tagActiveStates } = this.data;
    
    console.log('点击标签:', tag);
    console.log('当前选中标签:', selectedTags);
    
    if (selectedTags.indexOf(tag) > -1) {
      // 取消选择
      const newTags = selectedTags.filter(t => t !== tag);
      const newActiveStates = { ...tagActiveStates };
      newActiveStates[tag] = false;
      console.log('取消选择后:', newTags);
      this.setData({
        selectedTags: newTags,
        tagActiveStates: newActiveStates
      });
    } else {
      // 选择，限制最多选择3个标签
      if (selectedTags.length >= 3) {
        wx.showToast({
          title: '最多选择3个标签',
          icon: 'none'
        });
        return;
      }
      const newTags = [...selectedTags, tag];
      const newActiveStates = { ...tagActiveStates };
      newActiveStates[tag] = true;
      console.log('选择后:', newTags);
      this.setData({
        selectedTags: newTags,
        tagActiveStates: newActiveStates
      });
    }
  },

  // 切换匿名评价
  onAnonymousChange: function (e) {
    // 查看模式下不允许修改
    if (this.data.isViewMode) return;
    
    this.setData({
      isAnonymous: e.detail.value
    });
  },

  // 提交评价
  onSubmit: function () {
    // 查看模式下不允许提交
    if (this.data.isViewMode) return;
    
    if (!this.data.orderInfo) return;
    
    const { rating, comment, selectedTags, isAnonymous } = this.data;
    
    if (rating < 1 || rating > 5) {
      wx.showToast({
        title: '请选择评分',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ submitting: true });
    
    // 调用评价接口
    api.post(`/api/order/${this.data.orderId}/review`, {
      rating,
      comment,
      tags: selectedTags,
      anonymous: isAnonymous
    }, true)
    .then(res => {
      this.setData({ 
        submitting: false,
        showSuccess: true
      });
      
      // 设置全局变量，标记订单列表需要刷新
      getApp().globalData.orderListNeedRefresh = true;
      
      // 显示成功动画后返回
      setTimeout(() => {
        this.setData({ showSuccess: false });
        wx.navigateBack();
      }, 1500);
    })
    .catch(err => {
      this.setData({ submitting: false });
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