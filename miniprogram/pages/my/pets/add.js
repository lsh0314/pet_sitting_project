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
    tagActiveStates: {}, // 新增：简单的状态管理对象
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
    const { selectedTags, tagActiveStates } = this.data;
    
    console.log('点击标签:', tag);
    console.log('当前选择:', selectedTags);
    
    if (selectedTags.indexOf(tag) > -1) {
      // 取消选择
      const newTags = selectedTags.filter(t => t !== tag);
      const newActiveStates = { ...tagActiveStates };
      newActiveStates[tag] = false;
      
      console.log('取消后:', newTags);
      
      this.setData({
        selectedTags: newTags,
        tagActiveStates: newActiveStates,
        'petData.characterTags': newTags
      });
    } else {
      // 选择
      const newTags = [...selectedTags, tag];
      const newActiveStates = { ...tagActiveStates };
      newActiveStates[tag] = true;
      
      console.log('选择后:', newTags);
      
      this.setData({
        selectedTags: newTags,
        tagActiveStates: newActiveStates,
        'petData.characterTags': newTags
      });
    }
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
   */
  uploadImage: function (filePath, type) {
    // 显示上传中
    wx.showLoading({
      title: '上传中...',
      mask: true
    });
    
    // 真实上传到后端
    wx.uploadFile({
      url: `${app.globalData.apiBaseUrl}/api/upload/image`,
      filePath: filePath,
      name: 'photo',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token')}`
      },
      success: (res) => {
        wx.hideLoading();
        console.log('上传响应:', res);
        
        try {
          const data = JSON.parse(res.data);
          console.log('解析后的数据:', data);
          
          if (data.success) {
            if (type === 'photo') {
              this.setData({
                tempPhotoPath: filePath,
                'petData.photo': data.url
              });
              console.log('宠物照片上传成功，URL:', data.url);
            } else if (type === 'vaccine') {
              const tempVaccinePhotos = [...this.data.tempVaccinePhotos, filePath];
              const vaccineProof = [...this.data.petData.vaccineProof, data.url];
              
              this.setData({
                tempVaccinePhotos,
                'petData.vaccineProof': vaccineProof
              });
              console.log('疫苗证明上传成功，URL:', data.url);
            }
          } else {
            wx.showToast({
              title: data.message || '上传失败',
              icon: 'none'
            });
          }
        } catch (e) {
          console.error('解析上传响应失败:', e);
          wx.showToast({
            title: '上传失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('上传失败:', err);
        wx.showToast({
          title: '上传失败，请重试',
          icon: 'none'
        });
      }
    });

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