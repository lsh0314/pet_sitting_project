// pages/order/create.js
const api = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    sitterId: null,
    sitterInfo: null,
    pets: [],
    selectedPetId: null,
    serviceType: 'walk', // 默认遛狗
    serviceDate: util.getCurrentDate(),
    startTime: '08:00',
    endTime: '09:00',
    address: '',
    remarks: '',
    loading: false,
    submitting: false,
    
    // 日历组件相关
    minDate: util.getCurrentDate(), // 最小可选日期为今天
    maxDate: util.getDateAfterDays(60), // 最大可选日期为60天后
    daysColor: [] // 日期颜色配置
  },

  onLoad: function (options) {
    // 获取帮溜员ID
    if (options.sitterId) {
      this.setData({
        sitterId: options.sitterId
      });
      
      // 获取帮溜员信息
      this.fetchSitterInfo();
      
      // 获取宠物列表
      this.fetchPets();
      
      // 延迟再次获取宠物列表，以防第一次请求失败
      setTimeout(() => {
        if (this.data.pets.length === 0) {
          console.log('尝试再次获取宠物列表');
          this.fetchPets();
        }
      }, 2000);
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
  fetchSitterInfo: function () {
    this.setData({ loading: true });
    
    api.get(`/api/sitter/${this.data.sitterId}`, {}, true)
      .then(res => {
        const sitterInfo = res.data || {};
        
        // 设置帮溜员信息
        this.setData({
          sitterInfo,
          loading: false
        });
        
        // 处理可用日期
        this.processAvailableDates(sitterInfo.availableDates);
      })
      .catch(err => {
        console.error('获取帮溜员详情失败:', err);
        this.setData({
          loading: false
        });
        
        wx.showToast({
          title: '获取帮溜员详情失败',
          icon: 'none'
        });
      });
  },
  
  // 处理帮溜员可用日期
  processAvailableDates: function(availableDates) {
    if (!availableDates || !Array.isArray(availableDates) || availableDates.length === 0) {
      return;
    }
    
    // 将中文星期几转换为数字 (0-6，0表示周日)
    const weekdayMap = {
      '周日': 0,
      '周一': 1,
      '周二': 2,
      '周三': 3,
      '周四': 4,
      '周五': 5,
      '周六': 6
    };
    
    // 检查是否是星期几格式（周一、周二等）
    const isWeekdayFormat = availableDates.some(day => weekdayMap[day] !== undefined);
    
    // 如果不是星期几格式，可能已经是日期格式，直接使用
    if (!isWeekdayFormat) {
      console.log('可用日期已经是日期格式:', availableDates);
      if (this.data.sitterInfo) {
        this.data.sitterInfo.availableDates = availableDates;
        this.setData({
          sitterInfo: this.data.sitterInfo
        });
      }
      return;
    }
    
    // 将可用日期转换为星期几的数字集合
    const availableWeekdays = new Set();
    availableDates.forEach(day => {
      if (weekdayMap[day] !== undefined) {
        availableWeekdays.add(weekdayMap[day]);
      }
    });
    
    console.log('可用星期几:', Array.from(availableWeekdays));
    
    // 获取当前日期
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 月份从1开始
    
    // 更新帮溜员可用日期
    if (this.data.sitterInfo) {
      // 存储原始的可用星期几
      this.data.sitterInfo.originalAvailableDates = [...availableDates];
      this.setData({
        sitterInfo: this.data.sitterInfo
      });
      
      // 处理当前月份的可用日期
      this.processAvailableDatesForMonth(currentYear, currentMonth);
    }
  },

  // 获取宠物列表
  fetchPets: function () {
    api.get('/api/pet', {}, true)
      .then(res => {
        console.log('获取宠物列表成功:', res);
        let pets = [];
        
        // 处理不同的响应格式
        if (Array.isArray(res)) {
          // 直接返回数组
          pets = res;
        } else if (res.data && Array.isArray(res.data)) {
          // { data: [...] } 格式
          pets = res.data;
        } else if (res.success && res.data && Array.isArray(res.data)) {
          // { success: true, data: [...] } 格式
          pets = res.data;
        }
        
        console.log('处理后的宠物列表:', pets);
        
        this.setData({
          pets,
          selectedPetId: pets.length > 0 ? pets[0].id : null
        });
        
        // 如果没有宠物，显示提示
        if (pets.length === 0) {
          wx.showToast({
            title: '请先添加宠物信息',
            icon: 'none',
            duration: 2000
          });
        }
      })
      .catch(err => {
        console.error('获取宠物列表失败:', err);
        wx.showToast({
          title: '获取宠物列表失败',
          icon: 'none'
        });
      });
  },

  // 选择宠物
  onSelectPet: function (e) {
    this.setData({
      selectedPetId: e.currentTarget.dataset.id
    });
  },

  // 选择服务类型
  onSelectServiceType: function (e) {
    this.setData({
      serviceType: e.currentTarget.dataset.type
    });
  },

  // 选择服务日期
  bindDateChange: function (e) {
    const dateStr = e.detail.dateString;
    console.log('选择日期:', dateStr);
    
    // 检查日期是否为当前月份
    const selectedDate = new Date(dateStr);
    const currentDate = new Date();
    
    // 如果帮溜员有可用日期限制，则检查所选日期是否可用
    if (this.data.sitterInfo && 
        this.data.sitterInfo.availableDates && 
        Array.isArray(this.data.sitterInfo.availableDates) && 
        this.data.sitterInfo.availableDates.length > 0) {
      
      console.log('检查日期是否可用:', dateStr);
      console.log('可用日期列表:', this.data.sitterInfo.availableDates);
      
      // 检查所选日期是否在帮溜员的可用日期中
      if (!this.data.sitterInfo.availableDates.includes(dateStr)) {
        wx.showToast({
          title: '该日期帮溜员不可用',
          icon: 'none'
        });
        return;
      } else {
        console.log('日期可用!');
      }
    } else {
      // 如果没有明确的可用日期，检查所选日期是否是工作日
      const weekday = selectedDate.getDay(); // 0-6，0表示周日
      
      // 假设默认工作日为周一到周五 (1-5)
      if (weekday === 0 || weekday === 6) {
        wx.showToast({
          title: '周末帮溜员可能不可用',
          icon: 'none'
        });
        // 这里不返回，允许用户继续选择周末，但给出提示
      }
    }
    
    this.setData({
      serviceDate: dateStr
    });
  },

  // 选择开始时间
  bindStartTimeChange: function (e) {
    this.setData({
      startTime: e.detail.value
    });
    
    // 如果开始时间大于或等于结束时间，自动调整结束时间
    if (this.data.startTime >= this.data.endTime) {
      // 将结束时间设置为开始时间后一小时
      const startHour = parseInt(this.data.startTime.split(':')[0]);
      const startMinute = parseInt(this.data.startTime.split(':')[1]);
      
      let endHour = startHour + 1;
      const endMinute = startMinute;
      
      // 处理跨天情况
      if (endHour >= 24) {
        endHour = 23;
      }
      
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      
      this.setData({
        endTime: endTime
      });
    }
  },

  // 选择结束时间
  bindEndTimeChange: function (e) {
    const endTime = e.detail.value;
    
    // 检查结束时间是否大于开始时间
    if (endTime <= this.data.startTime) {
      wx.showToast({
        title: '结束时间必须晚于开始时间',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      endTime: endTime
    });
  },

  // 输入地址
  inputAddress: function (e) {
    this.setData({
      address: e.detail.value
    });
  },

  // 输入备注
  inputRemarks: function (e) {
    this.setData({
      remarks: e.detail.value
    });
  },

  // 提交订单
  submitOrder: function () {
    // 表单验证
    if (this.data.pets.length === 0) {
      wx.showToast({
        title: '请先添加宠物信息',
        icon: 'none'
      });
      
      // 跳转到添加宠物页面
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/my/pets/add'
        });
      }, 1500);
      
      return;
    }
    
    if (!this.data.selectedPetId) {
      wx.showToast({
        title: '请选择宠物',
        icon: 'none'
      });
      return;
    }
    
    if (!this.data.serviceDate) {
      wx.showToast({
        title: '请选择服务日期',
        icon: 'none'
      });
      return;
    }
    
    // 验证日期是否在帮溜员可用日期内
    if (this.data.sitterInfo && 
        this.data.sitterInfo.availableDates && 
        Array.isArray(this.data.sitterInfo.availableDates) && 
        this.data.sitterInfo.availableDates.length > 0) {
      
      console.log('提交订单 - 检查日期是否可用:', this.data.serviceDate);
      console.log('提交订单 - 可用日期列表:', this.data.sitterInfo.availableDates);
      
      if (!this.data.sitterInfo.availableDates.includes(this.data.serviceDate)) {
        wx.showToast({
          title: '所选日期帮溜员不可用',
          icon: 'none'
        });
        return;
      }
    } else {
      // 如果没有明确的可用日期列表，检查所选日期是否是工作日
      const selectedDate = new Date(this.data.serviceDate);
      const weekday = selectedDate.getDay(); // 0-6，0表示周日
      
      // 如果是周末，再次确认
      if (weekday === 0 || weekday === 6) {
        wx.showModal({
          title: '提示',
          content: '您选择的是周末，帮溜员可能不接单，是否继续？',
          success: (res) => {
            if (res.confirm) {
              // 用户确认，继续提交
              this.continueSubmitOrder();
            }
          }
        });
        return;
      }
    }
    
    if (!this.data.address) {
      wx.showToast({
        title: '请输入服务地址',
        icon: 'none'
      });
      return;
    }
    
    // 继续提交订单
    this.continueSubmitOrder();
  },
  
  // 继续提交订单（抽取共用逻辑）
  continueSubmitOrder: function() {
    // 防止重复提交
    if (this.data.submitting) return;
    
    this.setData({ submitting: true });
    
    // 构建订单数据
    const orderData = {
      targetSitter: this.data.sitterId,
      petId: this.data.selectedPetId,
      serviceType: this.data.serviceType,
      serviceDate: this.data.serviceDate,
      startTime: this.data.startTime,
      endTime: this.data.endTime,
      address: this.data.address,
      remarks: this.data.remarks
    };
    
    // 调用创建订单接口
    api.post('/api/order', orderData, true)
      .then(res => {
        wx.showToast({
          title: '下单成功',
          icon: 'success'
        });
        
        // 跳转到订单详情页
        setTimeout(() => {
          wx.redirectTo({
            url: `/pages/order/detail?id=${res.orderId || res.data?.id || ''}`
          });
        }, 1500);
      })
      .catch(err => {
        console.error('创建订单失败:', err);
        this.setData({
          submitting: false
        });
        
        wx.showToast({
          title: err.message || '创建订单失败',
          icon: 'none'
        });
      });
  },
  
  // 调试方法：刷新宠物列表
  refreshPetList: function() {
    wx.showLoading({
      title: '刷新中...',
    });
    
    api.get('/api/pet', {}, true)
      .then(res => {
        console.log('刷新宠物列表成功:', res);
        let pets = [];
        
        if (Array.isArray(res)) {
          pets = res;
        } else if (res.data && Array.isArray(res.data)) {
          pets = res.data;
        }
        
        this.setData({
          pets,
          selectedPetId: pets.length > 0 ? pets[0].id : null
        });
        
        wx.hideLoading();
        wx.showToast({
          title: `已获取${pets.length}个宠物`,
          icon: 'success'
        });
      })
      .catch(err => {
        console.error('刷新宠物列表失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '刷新失败',
          icon: 'none'
        });
      });
  },

  // 处理月份变更
  handleMonthChange: function(e) {
    console.log('月份变更:', e.detail);
    const { year, month } = e.detail;
    
    // 更新处理可用日期，基于新的月份
    this.processAvailableDatesForMonth(year, month);
  },
  
  // 处理指定月份的可用日期
  processAvailableDatesForMonth: function(year, month) {
    if (!this.data.sitterInfo || 
        !this.data.sitterInfo.availableDates || 
        !Array.isArray(this.data.sitterInfo.availableDates)) {
      return;
    }
    
    // 将中文星期几转换为数字 (0-6，0表示周日)
    const weekdayMap = {
      '周日': 0,
      '周一': 1,
      '周二': 2,
      '周三': 3,
      '周四': 4,
      '周五': 5,
      '周六': 6
    };
    
    // 将可用日期转换为星期几的数字集合
    const availableWeekdays = new Set();
    
    // 保存原始的可用星期几文本
    const originalAvailableDates = [...this.data.sitterInfo.availableDates];
    
    originalAvailableDates.forEach(day => {
      if (weekdayMap[day] !== undefined) {
        availableWeekdays.add(weekdayMap[day]);
      }
    });
    
    // 生成日期颜色配置
    const daysColor = [];
    
    // 获取指定月的第一天和最后一天
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const lastDayOfMonth = new Date(year, month, 0);
    
    // 获取当前月的天数
    const daysInMonth = lastDayOfMonth.getDate();
    
    // 创建实际可用日期的数组
    const actualAvailableDates = [];
    
    // 只处理当前月份的日期
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateStr = util.formatDate(date);
      const weekday = date.getDay(); // 获取星期几 (0-6)
      
      // 检查日期是否在最小可选日期之后
      const isAfterMinDate = date >= new Date(this.data.minDate);
      const isBeforeMaxDate = date <= new Date(this.data.maxDate);
      
      // 检查是否是可用星期几
      if (isAfterMinDate && isBeforeMaxDate && availableWeekdays.has(weekday)) {
        // 可用日期标记为绿色
        daysColor.push({
          month: 'current',
          day: day,
          color: '#ffffff',
          background: '#4CAF50'
        });
        
        // 添加到实际可用日期
        actualAvailableDates.push(dateStr);
      } else {
        // 不可用日期标记为灰色
        daysColor.push({
          month: 'current',
          day: day,
          color: '#cccccc',
          background: '#f5f5f5'
        });
      }
    }
    
    console.log(`${year}年${month}月实际可用日期:`, actualAvailableDates);
    
    // 更新日期颜色配置和可用日期
    this.setData({ 
      daysColor: daysColor
    });
    
    // 更新帮溜员可用日期为实际的日期字符串
    if (this.data.sitterInfo) {
      // 保存原始的星期几和转换后的实际日期
      this.data.sitterInfo.originalAvailableDates = originalAvailableDates; // 保存原始的星期几
      this.data.sitterInfo.availableDates = actualAvailableDates; // 更新为实际日期
      
      this.setData({
        sitterInfo: this.data.sitterInfo
      });
      
      console.log('更新后的可用日期:', this.data.sitterInfo.availableDates);
    }
  }
}) 