// pages/my/pets/index.js
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    pets: [],
    loading: true,
    error: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.fetchPets();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 每次页面显示时刷新宠物列表，以便在添加/编辑宠物后更新列表
    this.fetchPets();
  },

  /**
   * 获取宠物列表
   */
  fetchPets: function () {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.navigateTo({
        url: '/pages/auth/index'
      });
      return;
    }

    this.setData({ loading: true, error: null });

    wx.request({
      url: `${app.globalData.apiBaseUrl}/api/pet`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({
            pets: res.data,
            loading: false
          });
        } else {
          this.setData({
            error: res.data.message || '获取宠物列表失败',
            loading: false
          });
        }
      },
      fail: (err) => {
        this.setData({
          error: '网络请求失败，请检查网络连接',
          loading: false
        });
        console.error('获取宠物列表失败:', err);
      }
    });
  },

  /**
   * 跳转到添加宠物页面
   */
  goToAddPet: function () {
    wx.navigateTo({
      url: '/pages/my/pets/add'
    });
  },

  /**
   * 跳转到宠物详情页面
   */
  goToPetDetail: function (e) {
    const petId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/my/pets/detail?id=${petId}`
    });
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh: function () {
    this.fetchPets();
    wx.stopPullDownRefresh();
  }
});