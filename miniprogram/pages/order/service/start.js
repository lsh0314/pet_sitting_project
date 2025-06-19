const api = require('../../../utils/api');

Page({
  data: {
    orderId: null,
    orderInfo: null,
    loading: true,
    error: false,
    photoTaken: false,
    photoPath: '',
    uploading: false,
    
    // 位置相关
    locationVerified: false,  // 位置是否已验证
    locationChecking: false,  // 是否正在验证位置
    locationMessage: '',      // 位置验证消息
    currentLocation: null,    // 当前位置信息
    distance: null,           // 与服务地址的距离（米）
    distanceDisplay: '',      // 格式化后的距离显示（公里）
    maxDistance: 1000,        // 最大允许距离（米）
    orderCoords: null         // 订单地址的坐标
  },

  onLoad: function (options) {
    if (!options.id) {
      wx.showToast({
        title: '订单ID不能为空',
        icon: 'none'
      });
      wx.navigateBack();
      return;
    }

    this.setData({
      orderId: options.id,
      loading: true
    });

    this.getOrderDetail();
  },

  // 获取订单详情
  getOrderDetail: function () {
    api.get(`/api/order/${this.data.orderId}`)
      .then(res => {
        console.log('获取订单详情成功:', res);
        this.setData({
          orderInfo: res.data,
          loading: false
        });
        
        // 如果订单有坐标信息，保存下来
        if (res.data && res.data.locationCoords) {
          this.setData({
            orderCoords: res.data.locationCoords
          });
        } else {
          // 如果订单没有坐标信息，暂时无法解析坐标
          console.log('订单没有位置坐标信息');
        }
      })
      .catch(err => {
        console.error('获取订单详情失败:', err);
        this.setData({
          error: true,
          loading: false
        });

        wx.showToast({
          title: '获取订单信息失败',
          icon: 'none'
        });
      });
  },

  // 验证位置
  verifyLocation: function() {
    this.setData({
      locationChecking: true,
      locationMessage: '正在获取位置...'
    });
    
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        console.log('获取位置成功:', res);
        const { latitude, longitude } = res;
        
        // 保存当前位置信息
        this.setData({
          currentLocation: {
            latitude,
            longitude,
            address: '当前位置' // 简化处理，不再调用逆地址解析
          }
        });
        
        // 计算与服务地址的距离
        this.calculateDistance(latitude, longitude);
      },
      fail: (err) => {
        console.error('获取位置失败:', err);
        this.setLocationError('获取位置失败，请检查定位权限');
        
        // 显示授权提示
        wx.showModal({
          title: '需要位置权限',
          content: '请允许小程序获取您的位置信息，以便验证服务位置',
          confirmText: '去设置',
          cancelText: '取消',
          success: (result) => {
            if (result.confirm) {
              wx.openSetting({
                success: (settingRes) => {
                  if (settingRes.authSetting['scope.userLocation']) {
                    // 用户已授权，重新获取位置
                    setTimeout(() => {
                      this.verifyLocation();
                    }, 500);
                  }
                }
              });
            }
          }
        });
      },
      complete: () => {
        this.setData({
          locationChecking: false
        });
      }
    });
  },

  // 计算与服务地址的距离
  calculateDistance: function(latitude, longitude) {
    // 如果没有订单坐标，无法计算距离
    if (!this.data.orderCoords) {
      this.setData({
        locationMessage: '无法获取服务地址坐标，请手动确认位置',
        locationVerified: true // 由于无法验证，默认通过
      });
      return;
    }
    
    const orderLat = this.data.orderCoords.latitude;
    const orderLng = this.data.orderCoords.longitude;
    
    // 使用简单的距离计算公式（Haversine公式）
    const distance = this.getDistanceFromLatLonInM(latitude, longitude, orderLat, orderLng);
    
    console.log('计算的距离:', distance);
    
    // 计算距离显示值
    const distanceInKm = distance / 1000;
    const distanceDisplay = distanceInKm.toFixed(1);
    
    this.setData({
      distance: Math.round(distance),
      distanceDisplay: distanceDisplay
    });
    
    // 判断距离是否在允许范围内
    if (distance <= this.data.maxDistance) {
      this.setData({
        locationVerified: true,
        locationMessage: '位置验证成功'
      });
    } else {
      this.setData({
        locationVerified: false,
        locationMessage: `距离服务地址太远（${distance > 1000 ? distanceDisplay + '公里' : Math.round(distance) + '米'}），请确认您已到达服务地点`
      });
      
      // 如果距离太远，提示用户
      wx.showModal({
        title: '位置验证提示',
        content: `您当前位置距离服务地址约${distance > 1000 ? distanceDisplay + '公里' : Math.round(distance) + '米'}，超出了推荐距离。如果您确认已到达服务地点，可以继续进行服务。`,
        confirmText: '确认位置',
        cancelText: '重新验证',
        success: (result) => {
          if (result.confirm) {
            // 用户确认位置，强制验证通过
            this.setData({
              locationVerified: true,
              locationMessage: '位置已手动确认'
            });
          }
        }
      });
    }
  },
  
  // 使用Haversine公式计算两点之间的距离（米）
  getDistanceFromLatLonInM: function(lat1, lon1, lat2, lon2) {
    const R = 6371000; // 地球半径，单位米
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c;
    return d;
  },
  
  // 角度转弧度
  deg2rad: function(deg) {
    return deg * (Math.PI/180);
  },

  // 设置位置错误
  setLocationError: function(message) {
    this.setData({
      locationChecking: false,
      locationVerified: false,
      locationMessage: message
    });
  },

  // 拍照
  takePhoto: function () {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      camera: 'back',
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({
          photoTaken: true,
          photoPath: tempFilePath
        });
      },
      fail: (err) => {
        console.error('拍照失败:', err);
        wx.showToast({
          title: '拍照失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 重新拍照
  retakePhoto: function () {
    this.setData({
      photoTaken: false,
      photoPath: ''
    });
  },

  // 开始服务
  startService: function () {
    if (!this.data.photoTaken) {
      wx.showToast({
        title: '请先拍照打卡',
        icon: 'none'
      });
      return;
    }
    
    if (!this.data.locationVerified) {
      wx.showToast({
        title: '请先验证位置',
        icon: 'none'
      });
      return;
    }

    this.setData({ uploading: true });

    // 先上传照片
    this.uploadPhoto()
      .then(photoUrl => {
        // 构建请求数据
        const requestData = {
          photoUrl: photoUrl
        };
        
        // 如果有位置信息，一并提交
        if (this.data.currentLocation) {
          requestData.location = {
            latitude: this.data.currentLocation.latitude,
            longitude: this.data.currentLocation.longitude,
            address: this.data.currentLocation.address
          };
          
          if (this.data.distance !== null) {
            requestData.distance = this.data.distance;
          }
        }
        
        // 调用开始服务API
        return api.post(`/api/order/${this.data.orderId}/start`, requestData);
      })
      .then(() => {
        this.setData({ uploading: false });
        wx.showToast({
          title: '服务已开始',
          icon: 'success'
        });
        
        // 延迟返回订单列表页
        setTimeout(() => {
          // 返回上一页并刷新
          const pages = getCurrentPages();
          const prevPage = pages[pages.length - 2];
          if (prevPage && prevPage.getOrderList) {
            prevPage.getOrderList();
          }
          wx.navigateBack();
        }, 1500);
      })
      .catch(err => {
        console.error('开始服务失败:', err);
        this.setData({ uploading: false });
        wx.showToast({
          title: '开始服务失败，请重试',
          icon: 'none'
        });
      });
  },

  // 上传照片
  uploadPhoto: function () {
    return new Promise((resolve, reject) => {
      wx.showLoading({
        title: '正在上传照片...',
      });

      console.log('开始上传照片...');
      console.log('照片临时路径:', this.data.photoPath);

      // 使用微信上传文件API
      wx.uploadFile({
        url: `${api.getBaseUrl()}/api/upload/image`,
        filePath: this.data.photoPath,
        name: 'photo',
        header: {
          'Authorization': `Bearer ${wx.getStorageSync('token')}`
        },
        success: (res) => {
          wx.hideLoading();
          console.log('上传响应:', res.data);
          
          try {
            const data = JSON.parse(res.data);
            console.log('解析后的响应:', data);
            
            if (data.success && data.url) {
              console.log('上传成功，URL:', data.url);
              resolve(data.url);
            } else {
              console.error('上传失败:', data);
              reject(new Error('上传失败'));
            }
          } catch (e) {
            console.error('解析响应失败:', e);
            reject(e);
          }
        },
        fail: (err) => {
          wx.hideLoading();
          console.error('上传请求失败:', err);
          reject(err);
        }
      });
    });
  },

  // 返回
  goBack: function () {
    wx.navigateBack();
  }
}); 