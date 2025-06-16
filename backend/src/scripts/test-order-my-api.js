/**
 * 测试 GET /api/order/my 接口
 * 
 * 使用方法：
 * 1. 确保后端服务已启动
 * 2. 运行 node src/scripts/test-order-my-api.js
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 从环境变量获取JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// 生成测试用的JWT令牌
function generateTestToken() {
  const payload = {
    id: 1,  // 假设用户ID为1
    role: 'user',
    nickname: '测试用户'
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

// 配置
const API_URL = 'http://localhost:3000/api';
const TOKEN = generateTestToken();

// 测试函数
async function testGetMyOrders() {
  try {
    console.log('测试 GET /api/order/my 接口...\n');
    console.log(`使用的测试令牌: ${TOKEN}\n`);
    
    // 测试作为宠物主获取订单
    console.log('1. 作为宠物主获取订单:');
    const petOwnerResponse = await axios.get(`${API_URL}/order/my`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      },
      params: {
        role: 'pet_owner'
      }
    });
    
    console.log(`状态码: ${petOwnerResponse.status}`);
    console.log('响应数据:', JSON.stringify(petOwnerResponse.data, null, 2));
    console.log('\n-----------------------------------\n');
    
    // 测试作为帮溜员获取订单
    console.log('2. 作为帮溜员获取订单:');
    const sitterResponse = await axios.get(`${API_URL}/order/my`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      },
      params: {
        role: 'sitter'
      }
    });
    
    console.log(`状态码: ${sitterResponse.status}`);
    console.log('响应数据:', JSON.stringify(sitterResponse.data, null, 2));
    console.log('\n-----------------------------------\n');
    
    // 测试无效角色参数
    console.log('3. 测试无效角色参数:');
    try {
      await axios.get(`${API_URL}/order/my`, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`
        },
        params: {
          role: 'invalid_role'
        }
      });
    } catch (error) {
      console.log(`状态码: ${error.response.status}`);
      console.log('错误响应:', JSON.stringify(error.response.data, null, 2));
    }
    
  } catch (error) {
    console.error('测试失败:', error.message);
    if (error.response) {
      console.error('错误响应:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// 执行测试
testGetMyOrders(); 