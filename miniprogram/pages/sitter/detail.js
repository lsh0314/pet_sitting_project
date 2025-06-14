// pages/sitter/detail.js
const api = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    sitterId: null,
    sitterInfo: null,
    loading: true,
    error: false
  },

  onLoad: function (options) {
    // 获取帮溜员ID
    if (options.id) {
      this.setData({
        sitterId: options.id
      });
      this.fetchSitterDetail();
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

  // 获取帮溜员详情
  fetchSitterDetail: function () {
    this.setData({ loading: true, error: false });
    
    // 调用接口获取帮溜员详情
    api.get(`/api/sitter/${this.data.sitterId}`, {}, false)
      .then(res => {
        // 处理返回的数据
        let sitterInfo = null;
        
        if (res.success && res.data) {
          // 新格式: { success: true, data: {...} }
          sitterInfo = res.data;
        } else if (res.profile) {
          // 旧格式: { profile: {...}, services: [...] }
          sitterInfo = {
            id: res.profile.user_id,
            nickname: res.profile.nickname,
            avatar: res.profile.avatar_url,
            bio: res.profile.bio,
            serviceArea: res.profile.service_area,
            rating: res.profile.rating || 5.0,
            totalServices: res.profile.total_services_completed || 0,
            services: (res.services || []).map(service => ({
              type: service.service_type,
              price: service.price
            })),
            availableDates: res.availableDates || []
          };
        }
        
        // 处理可预约日期
        if (sitterInfo && Array.isArray(sitterInfo.availableDates)) {
          // 将可预约日期转换为星期几的显示
          const weekdayMap = {
            '0': '周日',
            '1': '周一',
            '2': '周二',
            '3': '周三',
            '4': '周四',
            '5': '周五',
            '6': '周六'
          };
          
          // 如果availableDates是数字格式的星期几，转换为中文显示
          if (sitterInfo.availableDates.length > 0 && !isNaN(parseInt(sitterInfo.availableDates[0]))) {
            sitterInfo.availableDates = sitterInfo.availableDates.map(day => weekdayMap[day] || day);
          }
          // 如果availableDates是日期格式（如2023-07-17），转换为星期几显示
          else if (sitterInfo.availableDates.length > 0 && sitterInfo.availableDates[0].includes('-')) {
            const uniqueWeekdays = new Set();
            sitterInfo.availableDates.forEach(dateStr => {
              const date = new Date(dateStr);
              const weekday = date.getDay(); // 0-6
              uniqueWeekdays.add(weekdayMap[weekday]);
            });
            sitterInfo.availableDates = Array.from(uniqueWeekdays);
          }
        }
        
        this.setData({
          sitterInfo: sitterInfo,
          loading: false
        });
      })
      .catch(err => {
        console.error('获取帮溜员详情失败:', err);
        this.setData({
          loading: false,
          error: true
        });
        
        wx.showToast({
          title: '获取帮溜员详情失败',
          icon: 'none'
        });
      });
  },

  // 点击下单按钮
  onTapOrder: function () {
    if (!this.data.sitterInfo) return;
    
    // 跳转到下单页面
    wx.navigateTo({
      url: `/pages/order/create?sitterId=${this.data.sitterId}`
    });
  },

  // 点击重试按钮
  onTapRetry: function () {
    this.fetchSitterDetail();
  },
  
  // 返回上一页
  goBack: function() {
    wx.navigateBack({
      delta: 1
    });
  }
}) 