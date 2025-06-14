// 引入app实例以获取全局配置
let app = null;
try {
  app = getApp();
} catch (e) {
  console.error('获取app实例失败:', e);
}

/**
 * 封装微信请求
 * @param {Object} options - 请求选项
 * @param {string} options.url - 请求地址
 * @param {string} options.method - 请求方法
 * @param {Object} options.data - 请求数据
 * @param {boolean} options.auth - 是否需要认证
 * @returns {Promise} Promise对象
 */
const request = (options) => {
  return new Promise((resolve, reject) => {
    // 获取baseAPI
    let baseAPI = 'http://127.0.0.1:3000';
    try {
      // 尝试获取app实例（如果之前没有获取到）
      if (!app) {
        app = getApp();
      }
      if (app && app.globalData && app.globalData.baseAPI) {
        baseAPI = app.globalData.baseAPI;
      }
    } catch (e) {
      console.error('获取baseAPI失败，使用默认值:', e);
    }
    
    // 构建完整URL
    const url = options.url.startsWith('http') ? options.url : baseAPI + options.url;
    
    // 构建请求头
    const header = options.header || {};
    
    // 如果需要认证，添加token
    if (options.auth !== false) {
      const token = wx.getStorageSync('token');
      if (token) {
        header['Authorization'] = 'Bearer ' + token;
      } else {
        // 没有token，可能需要跳转到登录页面
        navigateToLogin();
        reject(new Error('未登录或登录已过期'));
        return;
      }
    }
    
    // 发起请求
    wx.request({
      url,
      method: options.method || 'GET',
      data: options.data,
      header,
      success: (res) => {
        // 请求成功
        if (res.statusCode === 200) {
          // 直接返回数据，不再检查success字段
          resolve(res.data);
        } else if (res.statusCode === 401) {
          // 未授权，跳转到登录页
          navigateToLogin();
          reject(new Error('登录已过期，请重新登录'));
        } else {
          // 其他错误
          const errMsg = (res.data && res.data.message) || '服务器错误';
          showToast(errMsg);
          reject(new Error(errMsg));
        }
      },
      fail: (err) => {
        // 网络错误等
        showToast('网络请求失败');
        reject(err);
      }
    });
  });
};

/**
 * 跳转到登录页面
 */
const navigateToLogin = () => {
  wx.navigateTo({
    url: '/pages/auth/index'
  });
};

/**
 * 显示消息提示框
 * @param {string} message - 提示信息
 */
const showToast = (message) => {
  wx.showToast({
    title: message,
    icon: 'none',
    duration: 2000
  });
};

// 导出各种请求方法
module.exports = {
  /**
   * GET请求
   * @param {string} url - 请求地址
   * @param {Object} data - 请求参数
   * @param {boolean} auth - 是否需要认证
   */
  get: (url, data = {}, auth = true) => {
    return request({
      url,
      method: 'GET',
      data,
      auth
    });
  },
  
  /**
   * POST请求
   * @param {string} url - 请求地址
   * @param {Object} data - 请求数据
   * @param {boolean} auth - 是否需要认证
   */
  post: (url, data = {}, auth = true) => {
    return request({
      url,
      method: 'POST',
      data,
      auth
    });
  },
  
  /**
   * PUT请求
   * @param {string} url - 请求地址
   * @param {Object} data - 请求数据
   * @param {boolean} auth - 是否需要认证
   */
  put: (url, data = {}, auth = true) => {
    return request({
      url,
      method: 'PUT',
      data,
      auth
    });
  },
  
  /**
   * DELETE请求
   * @param {string} url - 请求地址
   * @param {Object} data - 请求数据
   * @param {boolean} auth - 是否需要认证
   */
  delete: (url, data = {}, auth = true) => {
    return request({
      url,
      method: 'DELETE',
      data,
      auth
    });
  }
}; 