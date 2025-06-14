const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    petData: {
      name: '',
      photo: '',
      breed: '',
      age: '',
      gender: '',
      weight: '',
      isSterilized: false,
      healthDesc: '',
      characterTags: [],
      specialNotes: '',
      allergyInfo: '',
      vaccineProof: []
    },
    genderOptions: [
      { value: 'male', name: '公' },
      { value: 'female', name: '母' }
    ],
    tagOptions: ['活泼', '安静', '亲人', '胆小', '爱叫', '护食', '怕生'],
    selectedTags: [],
    tempPhotoPath: '',
    tempVaccinePhotos: [],
    isSubmitting: false,
    error: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 检查登录状态
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.navigateTo({
        url: '/pages/auth/index'
      });
      return;
    }
  },

  /**
   * 输入框内容变化处理
   */
  onInputChange: function (e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`petData.${field}`]: value
    });
  },

  /**
   * 性别选择处理
   */
  onGenderChange: function (e) {
    this.setData({
      'petData.gender': e.detail.value
    });
  },

  /**
   * 绝育状态切换
   */
  onSterilizedChange: function (e) {
    this.setData({
      'petData.isSterilized': e.detail.value
    });
  },

  /**
   * 标签选择处理
   */
  onTagTap: function (e) {
    const tag = e.currentTarget.dataset.tag;
    const selectedTags = [...this.data.selectedTags];
    
    const index = selectedTags.indexOf(tag);
    if (index > -1) {
      selectedTags.splice(index, 1);
    } else {
      selectedTags.push(tag);
    }
    
    this.setData({
      selectedTags,
      'petData.characterTags': selectedTags
    });
  },

  /**
   * 选择宠物照片
   */
  choosePhoto: function () {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        // 获取选择的图片临时路径
        const tempFilePath = res.tempFilePaths[0];
        
        // 上传到服务器（实际项目中需要实现）
        this.uploadImage(tempFilePath, 'photo');
      }
    });
  },

  /**
   * 选择疫苗证明照片
   */
  chooseVaccineProof: function () {
    wx.chooseImage({
      count: 9,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        // 获取选择的图片临时路径
        const tempFilePaths = res.tempFilePaths;
        
        // 上传到服务器（实际项目中需要实现）
        tempFilePaths.forEach(path => {
          this.uploadImage(path, 'vaccine');
        });
      }
    });
  },

  /**
   * 上传图片到服务器
   * 注意：MVP阶段可以简化，直接使用本地路径或模拟URL
   */
  uploadImage: function (filePath, type) {
    // 显示上传中
    wx.showLoading({
      title: '上传中...',
      mask: true
    });
    
    // MVP阶段模拟上传，直接使用临时路径
    setTimeout(() => {
      wx.hideLoading();
      
      if (type === 'photo') {
        this.setData({
          tempPhotoPath: filePath,
          'petData.photo': filePath // 实际项目中应该是服务器返回的URL
        });
      } else if (type === 'vaccine') {
        const tempVaccinePhotos = [...this.data.tempVaccinePhotos, filePath];
        const vaccineProof = [...this.data.petData.vaccineProof, filePath]; // 实际项目中应该是服务器返回的URL
        
        this.setData({
          tempVaccinePhotos,
          'petData.vaccineProof': vaccineProof
        });
      }
    }, 500);
    
    // 实际项目中的上传代码（仅供参考）
    /*
    wx.uploadFile({
      url: `${app.globalData.apiBaseUrl}/api/upload`,
      filePath: filePath,
      name: 'file',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token')}`
      },
      success: (res) => {
        wx.hideLoading();
        const data = JSON.parse(res.data);
        if (data.success) {
          if (type === 'photo') {
            this.setData({
              tempPhotoPath: filePath,
              'petData.photo': data.url
            });
          } else if (type === 'vaccine') {
            const tempVaccinePhotos = [...this.data.tempVaccinePhotos, filePath];
            const vaccineProof = [...this.data.petData.vaccineProof, data.url];
            
            this.setData({
              tempVaccinePhotos,
              'petData.vaccineProof': vaccineProof
            });
          }
        } else {
          wx.showToast({
            title: '上传失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({
          title: '上传失败',
          icon: 'none'
        });
      }
    });
    */
  },

  /**
   * 删除疫苗证明照片
   */
  deleteVaccinePhoto: function (e) {
    const index = e.currentTarget.dataset.index;
    
    const tempVaccinePhotos = [...this.data.tempVaccinePhotos];
    const vaccineProof = [...this.data.petData.vaccineProof];
    
    tempVaccinePhotos.splice(index, 1);
    vaccineProof.splice(index, 1);
    
    this.setData({
      tempVaccinePhotos,
      'petData.vaccineProof': vaccineProof
    });
  },

  /**
   * 提交表单
   */
  submitForm: function () {
    // 表单验证
    if (!this.data.petData.name) {
      wx.showToast({
        title: '请填写宠物名称',
        icon: 'none'
      });
      return;
    }
    
    if (!this.data.petData.photo) {
      wx.showToast({
        title: '请上传宠物照片',
        icon: 'none'
      });
      return;
    }
    
    // 设置提交状态
    this.setData({
      isSubmitting: true,
      error: null
    });
    
    // 调用API创建宠物
    wx.request({
      url: `${app.globalData.apiBaseUrl}/api/pet`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${wx.getStorageSync('token')}`
      },
      data: this.data.petData,
      success: (res) => {
        if (res.statusCode === 201) {
          // 创建成功
          wx.showToast({
            title: '添加成功',
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
          // 创建失败
          this.setData({
            error: res.data.message || '添加失败，请重试',
            isSubmitting: false
          });
        }
      },
      fail: (err) => {
        this.setData({
          error: '网络请求失败，请检查网络连接',
          isSubmitting: false
        });
        console.error('添加宠物失败:', err);
      }
    });
  }
}); 