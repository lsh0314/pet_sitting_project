// 引入API请求库
const api = require('../../utils/api');
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    serviceType: '', // 服务类型：'feed'(喂猫) 或 'walk'(遛狗)
    serviceTypeText: '', // 服务类型文本
    sitters: [], // 帮溜员列表
    loading: false, // 加载状态
    error: false, // 错误状态
    currentPage: 1, // 当前页码
    hasMore: true, // 是否还有更多数据
    activeFilter: 'all' // 当前筛选条件：'all', 'rating', 'orders'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 获取服务类型参数
    const serviceType = options.type || '';
    
    // 设置服务类型文本
    let serviceTypeText = '推荐帮溜员';
    if (serviceType === 'feed') {
      serviceTypeText = '上门喂猫';
    } else if (serviceType === 'walk') {
      serviceTypeText = '上门遛狗';
    } else if (serviceType === 'boarding') {
      serviceTypeText = '宠物寄养';
    }
    
    this.setData({
      serviceType,
      serviceTypeText
    });
    
    // 加载帮溜员列表
    this.fetchSitters();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    // 重置数据
    this.setData({
      sitters: [],
      currentPage: 1,
      hasMore: true,
      loading: true,
      error: false
    });
    
    // 重新加载数据
    this.fetchSitters();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreSitters();
    }
  },

  /**
   * 获取帮溜员列表
   */
  fetchSitters: function () {
    // 如果已经在加载中或没有更多数据，直接返回
    if (this.data.loading && !this.data.currentPage === 1) return;
    
    this.setData({ loading: true, error: false });
    
    // 构建请求参数
    const params = { 
      page: this.data.currentPage,
      size: 10
    };
    
    // 添加服务类型筛选
    if (this.data.serviceType) {
      if (this.data.serviceType === 'feed') {
        params.service_type = 'feed';
      } else if (this.data.serviceType === 'walk') {
        params.service_type = 'walk';
      } else if (this.data.serviceType === 'boarding') {
        params.service_type = 'boarding';
      }
    }
    
    // 添加排序筛选
    if (this.data.activeFilter === 'rating') {
      params.sort = 'rating';
    } else if (this.data.activeFilter === 'orders') {
      params.sort = 'orders';
    }
    
    // 调用接口获取帮溜员列表
    api.get('/api/sitter', params, false)
      .then(res => {
        console.log('获取帮溜员列表成功:', res);
        // 处理不同的响应格式
        let newSitters = [];
        if (res.success && res.data) {
          // 格式: { success: true, data: [...] }
          newSitters = res.data;
        } else if (res.data) {
          // 格式: { data: [...] }
          newSitters = res.data;
        } else if (Array.isArray(res)) {
          // 格式: [...]
          newSitters = res;
        }
        
        const hasMore = newSitters.length === 10; // 假设每页10条
        
        this.setData({
          sitters: this.data.currentPage === 1 ? newSitters : [...this.data.sitters, ...newSitters],
          loading: false,
          hasMore
        });
        
        wx.stopPullDownRefresh();
      })
      .catch(err => {
        console.error('获取帮溜员列表失败:', err);
        this.setData({
          loading: false,
          error: true
        });
        
        wx.stopPullDownRefresh();
        
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        });
      });
  },

  /**
   * 加载更多帮溜员
   */
  loadMoreSitters: function () {
    if (this.data.hasMore) {
      this.setData({
        currentPage: this.data.currentPage + 1
      });
      this.fetchSitters();
    }
  },

  /**
   * 点击帮溜员项
   */
  onTapSitter: function (e) {
    const sitterId = e.currentTarget.dataset.id;
    
    // 跳转到帮溜员详情页
    wx.navigateTo({
      url: `/pages/sitter/detail?id=${sitterId}`
    });
  },

  /**
   * 点击重试按钮
   */
  onTapRetry: function () {
    this.setData({
      error: false,
      loading: true
    });
    this.fetchSitters();
  },

  /**
   * 设置筛选条件
   */
  setFilter: function (e) {
    const filter = e.currentTarget.dataset.filter;
    
    if (filter !== this.data.activeFilter) {
      this.setData({
        activeFilter: filter,
        sitters: [],
        currentPage: 1,
        hasMore: true,
        loading: true,
        error: false
      });
      
      this.fetchSitters();
    }
  },

  /**
   * 返回上一页
   */
  goBack: function () {
    wx.navigateBack({
      delta: 1
    });
  }
}); 