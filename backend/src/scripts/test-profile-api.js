/**
 * 测试用户资料API
 * 1. 先调用登录接口获取token
 * 2. 然后使用token调用用户资料接口
 */
const axios = require('axios');

// API基础URL
const BASE_URL = 'http://localhost:3000/api';

// 测试微信登录
async function testWechatLogin() {
  try {
    console.log('测试微信登录...');
    
    const response = await axios.post(`${BASE_URL}/auth/wechat-login`, {
      code: 'test_code',
      userInfo: {
        nickName: '测试用户',
        avatarUrl: 'https://example.com/avatar.png'
      }
    });
    
    console.log('登录成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('登录失败:', error.response ? error.response.data : error.message);
    throw error;
  }
}

// 测试获取用户资料
async function testGetProfile(token) {
  try {
    console.log('测试获取用户资料...');
    
    const response = await axios.get(`${BASE_URL}/user/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('获取用户资料成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('获取用户资料失败:', error.response ? error.response.data : error.message);
    throw error;
  }
}

// 主函数
async function main() {
  try {
    // 1. 登录获取token
    const loginResult = await testWechatLogin();
    const token = loginResult.data.token;
    
    // 2. 使用token获取用户资料
    await testGetProfile(token);
    
    console.log('测试完成!');
  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

// 执行测试
main(); 