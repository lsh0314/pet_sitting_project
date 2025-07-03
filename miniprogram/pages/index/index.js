// 引入API请求库
const api = require('../../utils/api');
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    sitters: [], // 帮溜员列表
    loading: false, // 加载状态
    error: false, // 错误状态
    currentPage: 1, // 当前页码
    hasMore: true, // 是否还有更多数据
    lastRefreshTime: 0, // 上次刷新时间戳
    region: ['北京市', '北京市', '海淀区'], // 默认区域
    locationCoords: null, // 位置坐标
    showLocationConfirmModal: false, // 是否显示位置确认模态框
    selectedLocation: null, // 选择的位置信息
    petCount: 0, // 宠物总数
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 尝试获取用户位置
    this.getCurrentLocation();
    // 获取帮溜员列表
    this.fetchSitters();
    // 获取宠物总数
    this.fetchPetCount();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0 // 选中首页
      });
    }
    
    // 检查是否需要刷新数据
    // 如果距离上次刷新超过30秒，或者从评价页面返回，则刷新数据
    const currentTime = new Date().getTime();
    const needRefresh = currentTime - this.data.lastRefreshTime > 30000 || 
                        (app.globalData && (app.globalData.orderListNeedRefresh || app.globalData.sitterListNeedRefresh));
    
    if (needRefresh) {
      // 重置数据并重新获取
      this.setData({
        sitters: [],
        currentPage: 1,
        hasMore: true,
        lastRefreshTime: currentTime
      });
      
      // 重新加载数据
      this.fetchSitters();
      
      // 重置全局刷新标志
      if (app.globalData) {
        app.globalData.orderListNeedRefresh = false;
        app.globalData.sitterListNeedRefresh = false;
      }
    }
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
    
    // 获取当前区域
    const district = this.data.region[2];
    
    // 调用接口获取帮溜员列表
    api.get('/api/sitter', { 
      page: this.data.currentPage, 
      size: 10,
      district: district // 添加区域筛选参数
    }, false)
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
        
        // 如果有区域筛选，在前端进行进一步筛选
        if (district && district !== '全部') {
          newSitters = newSitters.filter(sitter => {
            return sitter.service_area && sitter.service_area.includes(district);
          });
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
    const app = getApp();
    
    // 从首页推荐进入帮溜员详情页时，清空全局服务类型选择
    // 这样用户可以选择该帮溜员提供的任何服务，而不受之前选择的服务类型限制
    app.globalData.selectedServiceType = null;
    
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
   * 导航到服务页面
   */
  navigateToService: function (e) {
    const type = e.currentTarget.dataset.type;
    const app = getApp();
    
    if (app.globalData.isLoggedIn) {
      // 保存选择的服务类型到全局变量
      app.globalData.selectedServiceType = type === 'cat' ? 'feed' : type === 'dog' ? 'walk' : 'boarding';
      console.log('选择服务类型:', app.globalData.selectedServiceType);
      
      // 已登录，跳转到相应服务页面
      if (type === 'cat') {
        wx.navigateTo({
          url: '/pages/sitter-list/index?type=feed'
        });
      } else if (type === 'dog') {
        wx.navigateTo({
          url: '/pages/sitter-list/index?type=walk'
        });
      } else if (type === 'boarding') {
        wx.navigateTo({
          url: '/pages/sitter-list/index?type=boarding'
        });
      }
    } else {
      // 未登录，跳转到登录页
      wx.navigateTo({
        url: '/pages/auth/index'
      });
    }
  },



  /**
   * 打开位置选择器
   */
  openLocationPicker: function() {
    // 先尝试获取当前位置
    this.getCurrentLocation();
  },

  /**
   * 获取当前位置
   */
  getCurrentLocation: function() {
    wx.showLoading({
      title: '获取位置中...',
    });

    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        console.log('获取位置成功:', res);
        const { latitude, longitude } = res;
        
        // 保存坐标信息
        this.setData({
          locationCoords: { latitude, longitude }
        });
        
        // 显示加载中
        wx.showLoading({
          title: '打开位置选择...',
        });
        
        // 使用微信官方的地址选择器
        wx.chooseLocation({
          latitude: latitude,
          longitude: longitude,
          success: (result) => {
            console.log('选择位置成功:', result);
            
            // 保存选择的位置信息
            const selectedLocation = {
              latitude: result.latitude,
              longitude: result.longitude,
              name: result.name || '',
              address: result.address || ''
            };
            
            this.setData({
              selectedLocation: selectedLocation
            });
            
            // 调用逆地址解析API
            this.reverseGeocoding(selectedLocation.latitude, selectedLocation.longitude);
            
            wx.hideLoading();
          },
          fail: (err) => {
            console.error('选择位置失败:', err);
            wx.hideLoading();
            
            if (err.errMsg !== 'chooseLocation:fail cancel') {
              wx.showToast({
                title: '位置选择失败',
                icon: 'none'
              });
            }
          }
        });
      },
      fail: (err) => {
        console.error('获取位置失败:', err);
        wx.hideLoading();
        
        // 判断错误类型
        if (err.errMsg.includes('auth deny')) {
          // 用户拒绝授权
          wx.showModal({
            title: '位置权限未开启',
            content: '需要获取您的地理位置才能使用此功能，请在设置中开启位置权限',
            confirmText: '去设置',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting();
              }
            }
          });
        } else {
          // 其他错误
          wx.showToast({
            title: '获取位置失败',
            icon: 'none'
          });
        }
      }
    });
  },

  /**
   * 使用腾讯地图逆地址解析API获取结构化地址信息
   */
  reverseGeocoding: function(latitude, longitude) {
    // 从配置文件中获取腾讯地图开发者密钥
    const config = require('../../utils/config');
    const key = config.apiKeys.qqMapKey;
    
    // 显示加载中
    wx.showLoading({
      title: '解析地址信息...',
    });
    
    // 调用微信请求API访问腾讯地图逆地址解析服务
    wx.request({
      url: 'https://apis.map.qq.com/ws/geocoder/v1/',
      data: {
        location: `${latitude},${longitude}`,
        key: key,
        get_poi: 0
      },
      success: (res) => {
        console.log('逆地址解析成功:', res);
        
        if (res.data && res.data.status === 0 && res.data.result) {
          const addressComponent = res.data.result.address_component;
          
          // 提取省市区信息
          const province = addressComponent.province || '北京市';
          const city = addressComponent.city || '北京市';
          const district = addressComponent.district || '海淀区';
          
          // 更新region数据
          this.setData({
            region: [province, city, district]
          });
          
          // 保存到全局数据，方便其他页面使用
          if (app.globalData) {
            app.globalData.currentRegion = [province, city, district];
            app.globalData.locationCoords = {
              latitude: latitude,
              longitude: longitude
            };
          }
          
          // 重新获取帮溜员列表
          this.setData({
            sitters: [],
            currentPage: 1,
            hasMore: true
          });
          this.fetchSitters();
        }
        
        wx.hideLoading();
      },
      fail: (err) => {
        console.error('逆地址解析失败:', err);
        wx.hideLoading();
        
        wx.showToast({
          title: '地址解析失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 获取宠物总数
   */
  fetchPetCount: function() {
    api.get('/api/dashboard/public/pet-count', {}, false)
      .then(res => {
        console.log('获取宠物总数成功:', res);
        if (res.success && res.data && res.data.petCount) {
          this.setData({
            petCount: res.data.petCount
          });
        }
      })
      .catch(err => {
        console.error('获取宠物总数失败:', err);
      });
  }
}) 