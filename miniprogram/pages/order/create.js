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
    submitting: false
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
        this.setData({
          sitterInfo: res.data,
          loading: false
        });
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

  // 获取宠物列表
  fetchPets: function () {
    api.get('/api/pet', {}, true)
      .then(res => {
        const pets = res.data || [];
        this.setData({
          pets,
          selectedPetId: pets.length > 0 ? pets[0].id : null
        });
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
    this.setData({
      serviceDate: e.detail.value
    });
  },

  // 选择开始时间
  bindStartTimeChange: function (e) {
    this.setData({
      startTime: e.detail.value
    });
  },

  // 选择结束时间
  bindEndTimeChange: function (e) {
    this.setData({
      endTime: e.detail.value
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
    if (!this.data.selectedPetId) {
      wx.showToast({
        title: '请选择宠物',
        icon: 'none'
      });
      return;
    }
    
    if (!this.data.address) {
      wx.showToast({
        title: '请输入服务地址',
        icon: 'none'
      });
      return;
    }
    
    // 防止重复提交
    if (this.data.submitting) return;
    
    this.setData({ submitting: true });
    
    // 构建订单数据
    const orderData = {
      sitterId: this.data.sitterId,
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
            url: `/pages/order/detail?id=${res.data.id}`
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
  }
}) 