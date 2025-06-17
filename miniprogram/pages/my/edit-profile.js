const app = getApp();
const api = require('../../utils/api.js');

Page({
  data: {
    userInfo: null,
    nickname: '',
    gender: '',
    genderOptions: [
      { name: '男', value: 'male' },
      { name: '女', value: 'female' },
      { name: '其他', value: 'other' }
    ],
    isSubmitting: false
  },

  onLoad: function() {
    // 获取用户信息
    this.fetchUserProfile();
  },

  // 获取用户资料
  fetchUserProfile: function() {
    wx.showLoading({
      title: '加载中...',
    });

    api.get('/api/user/profile')
      .then(res => {
        const userInfo = res.data || {};
        this.setData({
          userInfo,
          nickname: userInfo.nickname || '',
          gender: userInfo.gender || ''
        });
      })
      .catch(err => {
        console.error('获取用户资料失败:', err);
        wx.showToast({
          title: '获取资料失败',
          icon: 'none'
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  // 输入框内容变化处理
  onInputChange: function(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [field]: e.detail.value
    });
  },

  // 性别选择变化处理
  onGenderChange: function(e) {
    this.setData({
      gender: e.detail.value
    });
  },

  // 选择头像
  chooseAvatar: function() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        
        // 上传头像到服务器（实际项目中应该有上传接口）
        // 这里简化处理，假设直接使用本地路径
        wx.showLoading({
          title: '上传中...',
        });
        
        // 模拟上传
        setTimeout(() => {
          this.setData({
            'userInfo.avatar_url': tempFilePath
          });
          wx.hideLoading();
          wx.showToast({
            title: '头像已更新',
            icon: 'success'
          });
        }, 1000);
        
        // 实际项目中应该调用上传API
        /*
        wx.uploadFile({
          url: api.getBaseUrl() + '/api/upload',
          filePath: tempFilePath,
          name: 'file',
          header: {
            'Authorization': 'Bearer ' + wx.getStorageSync('token')
          },
          success: (uploadRes) => {
            const data = JSON.parse(uploadRes.data);
            if (data.url) {
              this.setData({
                'userInfo.avatar_url': data.url
              });
            }
          },
          complete: () => {
            wx.hideLoading();
          }
        });
        */
      }
    });
  },

  // 提交表单
  submitForm: function() {
    // 表单验证
    if (!this.data.nickname.trim()) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      });
      return;
    }

    // 防止重复提交
    if (this.data.isSubmitting) {
      return;
    }

    this.setData({ isSubmitting: true });
    wx.showLoading({
      title: '保存中...',
    });

    // 构建更新数据
    const updateData = {
      nickname: this.data.nickname,
      gender: this.data.gender,
      avatar_url: this.data.userInfo.avatar_url
    };

    // 调用更新接口
    api.put('/api/user/profile', updateData)
      .then(res => {
        // 更新全局用户信息
        if (app.globalData.userInfo) {
          app.globalData.userInfo = {
            ...app.globalData.userInfo,
            ...updateData
          };
        }

        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });

        // 返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      })
      .catch(err => {
        console.error('更新资料失败:', err);
        wx.showToast({
          title: '保存失败，请重试',
          icon: 'none'
        });
      })
      .finally(() => {
        this.setData({ isSubmitting: false });
        wx.hideLoading();
      });
  }
}) 