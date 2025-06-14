// 调试工具
const getApp = () => {
  try {
    if (typeof wx !== 'undefined' && wx.getApp && typeof wx.getApp === 'function') {
      return wx.getApp();
    }
  } catch (e) {
    console.error('获取app实例失败:', e);
  }
  return null;
};

const app = getApp();
const DEFAULT_API_BASE_URL = 'http://localhost:3000';

// 获取API基础URL
const getApiBaseUrl = () => {
  return (app && app.globalData && app.globalData.apiBaseUrl) || DEFAULT_API_BASE_URL;
};

// 打印API请求信息
const logApiRequest = (url, method, data, header) => {
  console.log('===== API请求 =====');
  console.log('URL:', url);
  console.log('方法:', method);
  console.log('数据:', data);
  console.log('请求头:', header);
  console.log('==================');
};

// 打印API响应信息
const logApiResponse = (url, statusCode, data, error) => {
  console.log('===== API响应 =====');
  console.log('URL:', url);
  console.log('状态码:', statusCode);
  if (error) {
    console.log('错误:', error);
  } else {
    console.log('数据:', data);
  }
  console.log('==================');
};

// 测试API基础URL
const testApiBaseUrl = () => {
  const baseUrl = getApiBaseUrl();
  console.log('当前API基础URL:', baseUrl);
  
  // 测试连接
  wx.request({
    url: `${baseUrl}/`,
    method: 'GET',
    success: (res) => {
      console.log('API基础URL连接成功:', res);
    },
    fail: (err) => {
      console.error('API基础URL连接失败:', err);
    }
  });
};

// 测试宠物列表API
const testPetListApi = (token) => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/pet`;
  const header = token ? { 'Authorization': `Bearer ${token}` } : {};
  
  logApiRequest(url, 'GET', null, header);
  
  wx.request({
    url,
    method: 'GET',
    header,
    success: (res) => {
      logApiResponse(url, res.statusCode, res.data);
    },
    fail: (err) => {
      logApiResponse(url, null, null, err);
    }
  });
};

// 检查token
const checkToken = () => {
  const token = wx.getStorageSync('token');
  if (token) {
    console.log('Token存在:', token.substring(0, 10) + '...');
    return token;
  } else {
    console.log('Token不存在');
    return null;
  }
};

// 运行所有测试
const runAllTests = () => {
  console.log('开始运行API测试...');
  
  // 测试API基础URL
  testApiBaseUrl();
  
  // 检查token
  const token = checkToken();
  
  // 测试宠物列表API
  testPetListApi(token);
};

module.exports = {
  logApiRequest,
  logApiResponse,
  testApiBaseUrl,
  testPetListApi,
  checkToken,
  runAllTests
}; 