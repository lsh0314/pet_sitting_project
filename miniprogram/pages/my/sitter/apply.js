const api = require('../../../utils/api');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 表单数据
    formData: {
      name: '',
      idCardNumber: '',
      certificateType: '', // 证书类型，如宠物训练师证书、宠物医疗证书等
      certificateNumber: '',
    },
    // 上传的图片
    idCardFrontUrl: '',
    idCardBackUrl: '',
    certificateUrl: '',
    // 上传状态
    uploading: false,
    // 提交状态
    submitting: false,
    // 证书类型选项
    certificateTypes: [
      { name: '宠物训练师证书', value: 'pet_trainer_cert' },
      { name: '宠物医疗证书', value: 'pet_care_cert' },
      { name: '急救证书', value: 'first_aid_cert' },
      { name: '其他证书', value: 'other_cert' }
    ],
    // 证书类型索引
    certificateTypeIndex: 0,
    // 上次申请状态
    lastApplication: null,
    // 是否显示上次申请结果
    showLastResult: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 获取用户最新的认证申请记录
    this.fetchLastVerification();
  },

  /**
   * 获取用户最新的认证申请记录
   */
  fetchLastVerification: function() {
    api.get('/api/verification/status')
      .then(res => {
        console.log('获取认证状态成功:', res);
        if (res.data && res.data.id) {
          // 格式化日期
          if (res.data.updated_at) {
            res.data.updated_at = this.formatDate(new Date(res.data.updated_at));
          }
          
          // 设置上次申请状态
          this.setData({
            lastApplication: res.data,
            showLastResult: true
          });
        }
      })
      .catch(err => {
        console.error('获取认证状态失败:', err);
      });
  },

  /**
   * 格式化日期为 YYYY-MM-DD HH:MM 格式
   */
  formatDate: function(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  },

  /**
   * 处理输入框变化
   */
  onInputChange: function (e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`formData.${field}`]: value
    });
  },

  /**
   * 处理证书类型选择
   */
  onCertificateTypeChange: function (e) {
    const index = e.detail.value;
    const value = this.data.certificateTypes[index].value;
    
    this.setData({
      certificateTypeIndex: index,
      'formData.certificateType': value
    });
  },

  /**
   * 上传身份证正面照片
   */
  uploadIdCardFront: function () {
    this.uploadImage((url) => {
      this.setData({
        idCardFrontUrl: url
      });
    });
  },

  /**
   * 上传身份证背面照片
   */
  uploadIdCardBack: function () {
    this.uploadImage((url) => {
      this.setData({
        idCardBackUrl: url
      });
    });
  },

  /**
   * 上传证书照片
   */
  uploadCertificate: function () {
    this.uploadImage((url) => {
      this.setData({
        certificateUrl: url
      });
    });
  },

  /**
   * 通用图片上传方法
   */
  uploadImage: function (callback) {
    const that = this;
    
    // 设置上传状态
    that.setData({ uploading: true });
    
    // 选择图片
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      camera: 'back',
      success: function (res) {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        
        // 显示上传中
        wx.showLoading({
          title: '上传中...',
          mask: true
        });
        
        // 上传图片
        wx.uploadFile({
          url: api.getBaseUrl() + '/api/upload/image',
          filePath: tempFilePath,
          name: 'photo',
          header: {
            'Authorization': 'Bearer ' + wx.getStorageSync('token')
          },
          success: function (uploadRes) {
            // 解析返回的JSON
            const data = JSON.parse(uploadRes.data);
            if (data.success && data.url) {
              // 上传成功，回调传入URL
              callback(data.url);
            } else {
              wx.showToast({
                title: '上传失败: ' + (data.message || '未知错误'),
                icon: 'none'
              });
            }
          },
          fail: function (error) {
            console.error('上传图片失败:', error);
            wx.showToast({
              title: '上传失败，请重试',
              icon: 'none'
            });
          },
          complete: function () {
            wx.hideLoading();
            that.setData({ uploading: false });
          }
        });
      },
      fail: function (error) {
        console.error('选择图片失败:', error);
        that.setData({ uploading: false });
      }
    });
  },

  /**
   * 预览图片
   */
  previewImage: function (e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      wx.previewImage({
        urls: [url],
        current: url
      });
    }
  },

  /**
   * 删除图片
   */
  deleteImage: function (e) {
    const type = e.currentTarget.dataset.type;
    
    switch (type) {
      case 'idCardFront':
        this.setData({ idCardFrontUrl: '' });
        break;
      case 'idCardBack':
        this.setData({ idCardBackUrl: '' });
        break;
      case 'certificate':
        this.setData({ certificateUrl: '' });
        break;
    }
  },

  /**
   * 提交表单
   */
  submitForm: function () {
    // 表单验证
    if (!this.validateForm()) {
      return;
    }
    
    // 设置提交状态
    this.setData({ submitting: true });
    
    // 准备认证数据
    let type = 'identity'; // 默认为身份证认证
    let submitted_data = {
      name: this.data.formData.name,
      id_card_number: this.data.formData.idCardNumber,
      id_card_front: this.data.idCardFrontUrl,
      id_card_back: this.data.idCardBackUrl
    };
    
    // 如果有证书信息，则认证类型为certificate
    if (this.data.formData.certificateType && this.data.certificateUrl) {
      type = 'certificate';
      submitted_data[this.data.formData.certificateType] = this.data.certificateUrl;
      submitted_data.certificate_type = this.data.formData.certificateType;
      submitted_data.certificate_name = this.data.certificateTypes[this.data.certificateTypeIndex].name;
    }
    
    // 提交认证申请
    api.post('/api/verification/apply', {
      type: type,
      submitted_data: JSON.stringify(submitted_data)
    })
    .then(() => {
      wx.showToast({
        title: '申请提交成功',
        icon: 'success'
      });
      
      // 延迟返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 2000);
    })
    .catch((error) => {
      wx.showToast({
        title: '申请提交失败: ' + error.message,
        icon: 'none'
      });
    })
    .finally(() => {
      this.setData({ submitting: false });
    });
  },

  /**
   * 表单验证
   */
  validateForm: function () {
    // 验证姓名
    if (!this.data.formData.name.trim()) {
      wx.showToast({
        title: '请输入真实姓名',
        icon: 'none'
      });
      return false;
    }
    
    // 验证身份证号
    if (!this.data.formData.idCardNumber.trim() || !/^\d{17}[\dXx]$/.test(this.data.formData.idCardNumber)) {
      wx.showToast({
        title: '请输入有效的身份证号码',
        icon: 'none'
      });
      return false;
    }
    
    // 验证身份证照片
    if (!this.data.idCardFrontUrl) {
      wx.showToast({
        title: '请上传身份证正面照片',
        icon: 'none'
      });
      return false;
    }
    
    if (!this.data.idCardBackUrl) {
      wx.showToast({
        title: '请上传身份证背面照片',
        icon: 'none'
      });
      return false;
    }
    
    // 证书部分不再强制验证，如果选择了证书类型但没有上传照片，才提示错误
    if (this.data.formData.certificateType && !this.data.certificateUrl) {
      wx.showToast({
        title: '您已选择证书类型，请上传证书照片',
        icon: 'none'
      });
      return false;
    }
    
    return true;
  }
}) 