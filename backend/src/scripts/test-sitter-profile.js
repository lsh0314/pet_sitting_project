/**
 * 测试帮溜员资料API
 * 
 * 这个脚本用于测试以下API:
 * 1. GET /api/sitter/profile - 获取帮溜员资料
 * 2. PUT /api/sitter/profile - 更新帮溜员资料
 */

const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../../.env') });

// API基础URL
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// 测试用户的JWT token
const TOKEN = process.env.TEST_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNjI1MTIzNDU2fQ.7DNvg9-5NcMSjGFdYQ_H4hGfd5Sj4JjNcYF5IXgCgwI';

// API请求工具
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TOKEN}`
  }
});

/**
 * 测试获取帮溜员资料
 */
async function testGetProfile() {
  try {
    console.log('测试获取帮溜员资料...');
    const response = await api.get('/api/sitter/profile');
    console.log('响应状态码:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('获取帮溜员资料失败:', error.response ? error.response.data : error.message);
    return null;
  }
}

/**
 * 测试更新帮溜员资料
 */
async function testUpdateProfile() {
  try {
    console.log('测试更新帮溜员资料...');
    
    // 准备测试数据
    const profileData = {
      profile: {
        bio: '我是一名专业的宠物帮溜员，有5年经验，喜欢各种宠物。',
        service_area: '北京市海淀区',
        available_dates: ['2023-08-01', '2023-08-02', '2023-08-03']
      },
      services: [
        { service_type: 'walk', price: 50.00 },
        { service_type: 'feed', price: 30.00 },
        { service_type: 'boarding', price: 100.00 }
      ]
    };
    
    const response = await api.put('/api/sitter/profile', profileData);
    console.log('响应状态码:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('更新帮溜员资料失败:', error.response ? error.response.data : error.message);
    return null;
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('===== 开始测试帮溜员资料API =====');
    
    // 测试获取帮溜员资料
    console.log('\n1. 测试获取帮溜员资料');
    await testGetProfile();
    
    // 测试更新帮溜员资料
    console.log('\n2. 测试更新帮溜员资料');
    await testUpdateProfile();
    
    // 再次获取帮溜员资料，验证更新是否成功
    console.log('\n3. 再次获取帮溜员资料，验证更新是否成功');
    await testGetProfile();
    
    console.log('\n===== 测试完成 =====');
  } catch (error) {
    console.error('测试过程中出错:', error);
  }
}

// 执行主函数
main(); 