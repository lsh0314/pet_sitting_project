let app = null;
try {
  app = getApp();
} catch (e) {
  console.error('获取app实例失败:', e);
}

// 获取API基础URL
const getApiBaseUrl = () => {
  try {
    if (!app) {
      app = getApp();
    }
    return (app && app.globalData && app.globalData.apiBaseUrl) || 'http://localhost:3000';
  } catch (e) {
    console.error('获取apiBaseUrl失败，使用默认值:', e);
    return 'http://localhost:3000';
  }
};

Page({
  /**
   * 页面的初始数据
   */
  data: {
    profileData: {
      bio: '',
      service_area: '',
      available_dates: []
    },
    services: [
      { service_type: 'walk', name: '遛狗', price: '', checked: false },
      { service_type: 'feed', name: '喂食', price: '', checked: false },
      { service_type: 'boarding', name: '寄养', price: '', checked: false }
    ],
    datePickerVisible: false,
    selectedDates: [],
    futureDates: [], // 未来30天的日期数组
    isSubmitting: false,
    error: null,
    isLoading: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 生成未来30天的日期
    this.generateFutureDates();
    // 获取帮溜员资料
    this.fetchSitterProfile();
  },

  /**
   * 生成未来30天的日期
   */
  generateFutureDates: function() {
    const dates = [];
    const now = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const dateString = date.toISOString().split('T')[0]; // 格式：YYYY-MM-DD
      dates.push(dateString);
    }
    
    this.setData({
      futureDates: dates
    });
  },

  /**
   * 获取帮溜员资料
   */
  fetchSitterProfile: function () {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.navigateTo({
        url: '/pages/auth/index'
      });
      return;
    }

    this.setData({ isLoading: true });

    wx.request({
      url: `${getApiBaseUrl()}/api/sitter/profile`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if (res.statusCode === 200) {
          const { profile, services } = res.data;
          
          if (profile) {
            // 处理日期数据
            let availableDates = [];
            if (profile.available_dates) {
              try {
                if (typeof profile.available_dates === 'string') {
                  availableDates = JSON.parse(profile.available_dates);
                } else {
                  availableDates = profile.available_dates;
                }
              } catch (e) {
                console.error('解析日期数据失败:', e);
              }
            }
            
            this.setData({
              'profileData.bio': profile.bio || '',
              'profileData.service_area': profile.service_area || '',
              selectedDates: availableDates || [],
              'profileData.available_dates': availableDates || []
            });
          }
          
          // 处理服务数据
          if (Array.isArray(services) && services.length > 0) {
            const updatedServices = [...this.data.services];
            
            services.forEach(service => {
              const index = updatedServices.findIndex(s => s.service_type === service.service_type);
              if (index !== -1) {
                updatedServices[index].price = service.price.toString();
                updatedServices[index].checked = true;
              }
            });
            
            this.setData({ services: updatedServices });
          }
        } else {
          this.setData({
            error: res.data.message || '获取帮溜员资料失败'
          });
        }
      },
      fail: (err) => {
        this.setData({
          error: '网络请求失败，请检查网络连接'
        });
        console.error('获取帮溜员资料失败:', err);
      },
      complete: () => {
        this.setData({ isLoading: false });
      }
    });
  },

  /**
   * 输入框内容变化处理
   */
  onInputChange: function (e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`profileData.${field}`]: value
    });
  },

  /**
   * 服务选择状态变化处理
   */
  onServiceCheckChange: function (e) {
    const index = e.currentTarget.dataset.index;
    const checked = e.detail.value;
    
    this.setData({
      [`services[${index}].checked`]: checked
    });
  },

  /**
   * 服务价格输入处理
   */
  onServicePriceChange: function (e) {
    const index = e.currentTarget.dataset.index;
    const value = e.detail.value;
    
    // 自动勾选服务
    if (value && !this.data.services[index].checked) {
      this.setData({
        [`services[${index}].checked`]: true
      });
    }
    
    this.setData({
      [`services[${index}].price`]: value
    });
  },

  /**
   * 显示日期选择器
   */
  showDatePicker: function () {
    this.setData({
      datePickerVisible: true
    });
  },

  /**
   * 日期选择处理
   */
  onDateSelect: function (e) {
    const date = e.currentTarget.dataset.date;
    const selectedDates = [...this.data.selectedDates];
    
    const index = selectedDates.indexOf(date);
    if (index > -1) {
      selectedDates.splice(index, 1);
    } else {
      selectedDates.push(date);
    }
    
    this.setData({
      selectedDates,
      'profileData.available_dates': selectedDates
    });
  },

  /**
   * 关闭日期选择器
   */
  closeDatePicker: function () {
    this.setData({
      datePickerVisible: false
    });
  },

  /**
   * 提交表单
   */
  submitForm: function () {
    // 表单验证
    if (!this.data.profileData.bio) {
      wx.showToast({
        title: '请填写个人简介',
        icon: 'none'
      });
      return;
    }
    
    if (!this.data.profileData.service_area) {
      wx.showToast({
        title: '请填写服务区域',
        icon: 'none'
      });
      return;
    }
    
    // 检查是否至少选择了一项服务
    const selectedServices = this.data.services.filter(s => s.checked);
    if (selectedServices.length === 0) {
      wx.showToast({
        title: '请至少选择一项服务',
        icon: 'none'
      });
      return;
    }
    
    // 检查所有选中的服务是否都有价格
    for (const service of selectedServices) {
      if (!service.price) {
        wx.showToast({
          title: `请为${service.name}设置价格`,
          icon: 'none'
        });
        return;
      }
    }
    
    // 设置提交状态
    this.setData({
      isSubmitting: true,
      error: null
    });
    
    // 准备提交数据
    const submitData = {
      profile: this.data.profileData,
      services: selectedServices.map(s => ({
        service_type: s.service_type,
        price: parseFloat(s.price)
      }))
    };
    
    // 调用API更新帮溜员资料
    const token = wx.getStorageSync('token');
    wx.request({
      url: `${getApiBaseUrl()}/api/sitter/profile`,
      method: 'PUT',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      data: submitData,
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          // 更新成功
          wx.showToast({
            title: '资料更新成功',
            icon: 'success',
            duration: 2000,
            success: () => {
              // 返回上一页
              setTimeout(() => {
                wx.navigateBack();
              }, 2000);
            }
          });
        } else {
          // 更新失败
          this.setData({
            error: res.data.message || '资料更新失败，请重试',
            isSubmitting: false
          });
        }
      },
      fail: (err) => {
        this.setData({
          error: '网络请求失败，请检查网络连接',
          isSubmitting: false
        });
        console.error('更新帮溜员资料失败:', err);
      }
    });
  }
}); 