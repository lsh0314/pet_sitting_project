// pages/order/create.js
const api = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    sitterId: null,
    sitterInfo: null,
    pets: [],
    selectedPetId: null,
    serviceType: null, // 初始不选择任何服务类型
    preferredServiceType: null, // 从首页传入的预选服务类型
    serviceDate: util.getCurrentDate(),
    startTime: '08:00',
    endTime: '09:00',
    address: '',
    remarks: '',
    loading: false,
    submitting: false,
    hasAnyServiceFlag: false, // 是否有任何服务的标志
    walkServiceAvailable: false, // 遛狗服务是否可用
    feedServiceAvailable: false, // 喂食服务是否可用
    boardingServiceAvailable: false, // 寄养服务是否可用
    
    // 价格相关
    servicePrice: 0,      // 单价
    serviceDuration: 1,   // 服务时长（小时）
    totalPrice: 0,        // 总价
    
    // 日历组件相关
    minDate: util.getCurrentDate(), // 最小可选日期为今天
    maxDate: util.getDateAfterDays(60), // 最大可选日期为60天后
    daysColor: [] // 日期颜色配置
  },

  onLoad: function (options) {
    // 获取帮溜员ID和预选服务类型
    if (options.sitterId) {
      this.setData({
        sitterId: options.sitterId,
        // 保存预选的服务类型（如果有）
        preferredServiceType: options.serviceType || null
      });
      
      console.log('页面加载参数:', options);
      console.log('预选服务类型:', options.serviceType);
      
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
  
  onReady: function() {
    // 页面渲染完成后，检查服务列表状态
    setTimeout(() => {
      console.log('页面渲染完成，检查服务列表状态:');
      console.log('sitterInfo:', this.data.sitterInfo);
      if (this.data.sitterInfo && this.data.sitterInfo.services) {
        console.log('服务列表长度:', this.data.sitterInfo.services.length);
        console.log('服务列表内容:', JSON.stringify(this.data.sitterInfo.services));
        
        // 检查各服务类型
        const walkService = this.data.sitterInfo.services.find(s => s.type === 'walk' || s.service_type === 'walk');
        console.log('遛狗服务:', walkService);
        
        const feedService = this.data.sitterInfo.services.find(s => s.type === 'feed' || s.service_type === 'feed');
        console.log('喂食服务:', feedService);
        
        const boardingService = this.data.sitterInfo.services.find(s => s.type === 'boarding' || s.service_type === 'boarding');
        console.log('寄养服务:', boardingService);
      } else {
        console.log('服务列表不存在或为空');
      }
    }, 1000);
  },

  // 获取帮溜员详情
  fetchSitterInfo: function () {
    this.setData({ loading: true });
    
    api.get(`/api/sitter/${this.data.sitterId}`, {}, true)
      .then(res => {
        console.log('获取帮溜员详情成功，原始数据:', res);
        
        // 处理不同的响应格式
        let sitterInfo;
        if (res.data) {
          // { data: {...} } 格式
          sitterInfo = res.data;
        } else if (res.success && res.data) {
          // { success: true, data: {...} } 格式
          sitterInfo = res.data;
        } else {
          // 直接返回对象格式
          sitterInfo = res;
        }
        
        // 直接检查原始响应中的服务列表
        console.log('检查原始响应中的服务列表:');
        if (res.services && Array.isArray(res.services)) {
          console.log('原始响应中的服务列表:', res.services);
        }
        
        // 确保services字段是数组
        if (!sitterInfo.services) {
          // 如果没有services字段，检查是否有旧格式的数据
          if (res.services && Array.isArray(res.services)) {
            sitterInfo.services = res.services.map(service => ({
              type: service.service_type || service.type,
              price: service.price
            }));
          } else {
            sitterInfo.services = [];
          }
        }
        
        // 确保服务类型使用统一的字段名
        if (sitterInfo.services && Array.isArray(sitterInfo.services)) {
          sitterInfo.services = sitterInfo.services.map(service => {
            // 确保每个服务对象都有type字段
            return {
              type: service.service_type || service.type,
              price: service.price
            };
          });
        }
        
        console.log('处理后的帮溜员详情:', sitterInfo);
        console.log('帮溜员服务列表:', sitterInfo.services);
        
        // 设置帮溜员信息
        this.setData({
          sitterInfo,
          loading: false,
          hasAnyServiceFlag: Array.isArray(sitterInfo.services) && sitterInfo.services.length > 0
        });
        
        console.log('[fetchSitterInfo] 设置sitterInfo后检查服务状态');
        
        // 更新各服务类型的可用状态
        setTimeout(() => {
          // 检查各服务类型是否可用
          const walkAvailable = this.checkServiceAvailable('walk');
          const feedAvailable = this.checkServiceAvailable('feed');
          const boardingAvailable = this.checkServiceAvailable('boarding');
          
          console.log('[fetchSitterInfo] 服务可用状态:', {
            walkAvailable,
            feedAvailable,
            boardingAvailable
          });
          
          this.setData({
            walkServiceAvailable: walkAvailable,
            feedServiceAvailable: feedAvailable,
            boardingServiceAvailable: boardingAvailable
          });
        }, 100);
        
        // 处理可用日期
        if (sitterInfo.availableDates) {
          this.processAvailableDates(sitterInfo.availableDates);
        }
        
        // 自动选择第一个可用服务类型
        this.selectDefaultServiceType();
        
        // 初始计算价格
        this.calculatePrice();
        
        // 强制更新页面
        this.forceUpdate();
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
  
  // 强制更新页面
  forceUpdate: function() {
    console.log('[forceUpdate] 开始强制更新页面');
    
    // 检查各服务类型是否可用
    const walkAvailable = this.checkServiceAvailable('walk');
    const feedAvailable = this.checkServiceAvailable('feed');
    const boardingAvailable = this.checkServiceAvailable('boarding');
    const hasAnyService = this.hasAnyService();
    
    console.log('[forceUpdate] 服务可用状态:', {
      walkAvailable,
      feedAvailable,
      boardingAvailable,
      hasAnyService
    });
    
    // 使用一个临时变量触发页面更新
    const tempData = { ...this.data.sitterInfo };
    this.setData({
      sitterInfo: tempData,
      // 添加服务标志变量供WXML使用
      hasAnyServiceFlag: hasAnyService,
      walkServiceAvailable: walkAvailable,
      feedServiceAvailable: feedAvailable,
      boardingServiceAvailable: boardingAvailable
    });
    
    console.log('[forceUpdate] 页面数据已更新');
    
    // 延迟检查服务类型是否正确显示
    setTimeout(() => {
      console.log('[forceUpdate-延迟] 检查服务类型状态:');
      console.log('[forceUpdate-延迟] 遛狗服务是否可用:', this.data.walkServiceAvailable);
      console.log('[forceUpdate-延迟] 喂食服务是否可用:', this.data.feedServiceAvailable);
      console.log('[forceUpdate-延迟] 寄养服务是否可用:', this.data.boardingServiceAvailable);
      console.log('[forceUpdate-延迟] 是否有任何服务:', this.data.hasAnyServiceFlag);
      console.log('[forceUpdate-延迟] sitterInfo:', this.data.sitterInfo);
    }, 500);
  },

  // 检查服务是否可用
  checkServiceAvailable: function(type) {
    console.log(`[checkServiceAvailable] 检查服务类型 ${type}`);
    console.log('[checkServiceAvailable] sitterInfo:', this.data.sitterInfo);
    
    if (!this.data.sitterInfo || !this.data.sitterInfo.services || !Array.isArray(this.data.sitterInfo.services)) {
      console.log(`[checkServiceAvailable] 无效数据结构，返回false`);
      return false;
    }
    
    const result = this.data.sitterInfo.services.some(service => {
      const serviceType = service.type || service.service_type;
      console.log(`[checkServiceAvailable] 比较: ${serviceType} vs ${type}`);
      return serviceType === type;
    });
    
    console.log(`[checkServiceAvailable] ${type} 结果:`, result);
    return result;
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

  // 判断帮溜员是否提供特定类型的服务
  hasServiceType: function(type) {
    console.log(`检查服务类型 ${type}:`, this.data.sitterInfo);
    
    // 如果没有帮溜员信息或服务列表，返回false
    if (!this.data.sitterInfo || !this.data.sitterInfo.services || !Array.isArray(this.data.sitterInfo.services)) {
      console.log(`无法判断服务类型 ${type}: 帮溜员信息不完整`);
      return false;
    }
    
    // 检查是否有匹配的服务类型
    const hasService = this.data.sitterInfo.services.some(service => {
      // 兼容不同的字段名
      const serviceType = service.type || service.service_type;
      console.log(`比较服务类型: ${serviceType} vs ${type}`);
      return serviceType === type;
    });
    
    console.log(`服务类型 ${type} 检查结果:`, hasService);
    return hasService;
  },
  
  // 判断帮溜员是否提供任何服务
  hasAnyService: function() {
    // 如果没有帮溜员信息或服务列表，返回false
    if (!this.data.sitterInfo || !this.data.sitterInfo.services || !Array.isArray(this.data.sitterInfo.services)) {
      console.log('无法判断是否有服务: 帮溜员信息不完整');
      return false;
    }
    
    // 检查是否有任何服务
    const hasServices = this.data.sitterInfo.services.length > 0;
    console.log('是否有任何服务:', hasServices, this.data.sitterInfo.services);
    return hasServices;
  },
  
  // 自动选择默认服务类型（优先选择预选的服务类型，否则选择第一个可用服务）
  selectDefaultServiceType: function() {
    console.log('尝试自动选择默认服务类型');
    
    // 如果没有帮溜员信息或服务列表，无法选择
    if (!this.data.sitterInfo || !this.data.sitterInfo.services || !Array.isArray(this.data.sitterInfo.services)) {
      console.log('无法选择默认服务类型: 帮溜员信息不完整');
      return;
    }
    
    // 如果服务列表为空，无法选择
    if (this.data.sitterInfo.services.length === 0) {
      console.log('无法选择默认服务类型: 服务列表为空');
      return;
    }

    // 检查是否有预选的服务类型
    if (this.data.preferredServiceType) {
      console.log('检查预选服务类型是否可用:', this.data.preferredServiceType);
      
      // 检查预选服务类型是否在帮溜员的服务列表中
      const preferredServiceAvailable = this.data.sitterInfo.services.some(service => {
        const serviceType = service.type || service.service_type;
        return serviceType === this.data.preferredServiceType;
      });
      
      if (preferredServiceAvailable) {
        console.log('预选服务类型可用，选择:', this.data.preferredServiceType);
        this.setData({
          serviceType: this.data.preferredServiceType
        });
        return;
      } else {
        console.log('预选服务类型不可用，将选择第一个可用服务');
      }
    }
    
    // 如果没有预选服务类型或预选服务类型不可用，则选择第一个可用服务
    const firstService = this.data.sitterInfo.services[0];
    if (firstService) {
      // 兼容不同的字段名
      const serviceType = firstService.type || firstService.service_type;
      
      if (serviceType) {
        console.log('自动选择第一个服务类型:', serviceType);
        this.setData({
          serviceType: serviceType
        });
      } else {
        console.warn('服务对象缺少type字段:', firstService);
      }
    }
  },

  // 选择服务类型
  onSelectServiceType: function (e) {
    const serviceType = e.currentTarget.dataset.type;
    
    // 检查是否是有效的服务类型
    if (!this.hasServiceType(serviceType)) {
      wx.showToast({
        title: '该帮溜员不提供此服务',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      serviceType: serviceType
    });
    
    // 重新计算价格
    this.calculatePrice();
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
    
    // 重新计算价格
    this.calculatePrice();
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
    
    // 重新计算价格
    this.calculatePrice();
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
    
    if (!this.data.serviceType) {
      wx.showToast({
        title: '请选择服务类型',
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
  
  // 计算价格
  calculatePrice: function() {
    // 记录调试信息
    console.log('开始计算价格，当前帮溜员信息:', this.data.sitterInfo);
    
    // 如果没有选择服务类型，无法计算价格
    if (!this.data.serviceType) {
      console.log('无法计算价格：未选择服务类型');
      this.setData({
        servicePrice: '0.00',
        serviceDuration: '1.0',
        totalPrice: '0.00'
      });
      return;
    }
    
    // 如果没有帮溜员信息或服务列表，则无法计算价格
    if (!this.data.sitterInfo || !this.data.sitterInfo.services || !Array.isArray(this.data.sitterInfo.services)) {
      console.log('无法计算价格：帮溜员信息不完整', this.data.sitterInfo);
      // 设置默认价格
      this.setData({
        servicePrice: '0.00',
        serviceDuration: '1.0',
        totalPrice: '0.00'
      });
      return;
    }
    
    console.log('当前选择的服务类型:', this.data.serviceType);
    console.log('可用服务列表:', this.data.sitterInfo.services);
    
    // 查找当前选择的服务类型的价格
    const selectedService = this.data.sitterInfo.services.find(service => {
      // 兼容不同的字段名
      const serviceType = service.type || service.service_type;
      return serviceType === this.data.serviceType;
    });
    
    if (!selectedService) {
      console.warn('未找到对应的服务价格信息，尝试使用第一个可用服务');
      
      // 如果没有找到匹配的服务类型，使用第一个可用服务
      if (this.data.sitterInfo.services.length > 0) {
        const firstService = this.data.sitterInfo.services[0];
        const serviceType = firstService.type || firstService.service_type;
        
        if (serviceType) {
          this.setData({ serviceType: serviceType });
          console.log('自动选择服务类型:', serviceType);
          
          // 重新计算价格
          setTimeout(() => {
            this.calculatePrice();
          }, 0);
          return;
        }
      }
      
      // 如果没有任何服务，设置默认价格
      this.setData({
        servicePrice: '0.00',
        serviceDuration: '1.0',
        totalPrice: '0.00'
      });
      return;
    }
    
    console.log('选中的服务:', selectedService);
    
    try {
      // 获取服务单价，确保是数字类型
      let servicePrice = 0;
      // 兼容不同的字段名
      const priceValue = selectedService.price || selectedService.service_price || 0;
      
      if (typeof priceValue === 'number') {
        servicePrice = priceValue;
      } else {
        // 尝试将字符串转换为数字
        servicePrice = parseFloat(priceValue);
        if (isNaN(servicePrice)) {
          console.warn('服务价格不是有效的数字:', priceValue);
          servicePrice = 0;
        }
      }
      
      // 计算服务时长（小时）
      const startTime = this.data.startTime.split(':');
      const endTime = this.data.endTime.split(':');
      
      const startMinutes = parseInt(startTime[0]) * 60 + parseInt(startTime[1]);
      const endMinutes = parseInt(endTime[0]) * 60 + parseInt(endTime[1]);
      
      // 计算时长（小时，保留一位小数）
      const durationHours = ((endMinutes - startMinutes) / 60).toFixed(1);
      
      // 计算总价（单价 * 时长）
      const totalPrice = (servicePrice * parseFloat(durationHours)).toFixed(2);
      
      console.log('价格计算:', {
        servicePrice,
        durationHours,
        totalPrice
      });
      
      // 更新数据
      this.setData({
        servicePrice: servicePrice.toFixed(2),
        serviceDuration: durationHours,
        totalPrice: totalPrice
      });
    } catch (error) {
      console.error('计算价格时发生错误:', error);
      // 出错时设置默认价格
      this.setData({
        servicePrice: '0.00',
        serviceDuration: '1.0',
        totalPrice: '0.00'
      });
    }
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
      remarks: this.data.remarks,
      price: parseFloat(this.data.totalPrice) // 添加价格参数
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