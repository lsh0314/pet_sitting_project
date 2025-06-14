const axios = require('axios');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 基础URL
const API_URL = process.env.API_URL || 'http://localhost:3000';

// 测试用户的JWT令牌（需要先通过登录获取）
let token = '';

// 创建的宠物ID
let petId = null;

// 测试数据
const testPet = {
  name: '小白',
  photo: 'https://example.com/pet.jpg',
  breed: '金毛',
  age: '2岁',
  gender: 'male',
  weight: 15.5,
  isSterilized: true,
  healthDesc: '健康状况良好',
  characterTags: ['活泼', '友善'],
  specialNotes: '喜欢玩球',
  allergyInfo: '对牛肉过敏',
  vaccineProof: ['https://example.com/vaccine1.jpg']
};

// 创建axios实例
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 设置请求拦截器，添加认证头
api.interceptors.request.use(config => {
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * 登录获取令牌
 */
async function login() {
  try {
    // 这里使用测试账号登录
    const response = await api.post('/api/auth/wechat-login', {
      code: 'test_code',
      nickName: '测试用户',
      avatarUrl: 'https://example.com/avatar.jpg'
    });
    
    token = response.data.data.token;
    console.log('登录成功，获取到令牌:', response.data);
  } catch (error) {
    console.error('登录失败:', error.response && error.response.data ? error.response.data : error.message);
    process.exit(1);
  }
}

/**
 * 创建宠物
 */
async function createPet() {
  try {
    console.log('正在创建宠物...');
    const response = await api.post('/api/pet', testPet);
    
    petId = response.data.petId;
    console.log('宠物创建成功:', response.data);
  } catch (error) {
    console.error('创建宠物失败:', error.response && error.response.data ? error.response.data : error.message);
  }
}

/**
 * 获取宠物列表
 */
async function getPets() {
  try {
    console.log('正在获取宠物列表...');
    const response = await api.get('/api/pet');
    
    console.log('宠物列表:', response.data);
  } catch (error) {
    console.error('获取宠物列表失败:', error.response && error.response.data ? error.response.data : error.message);
  }
}

/**
 * 获取单个宠物详情
 */
async function getPetById() {
  if (!petId) {
    console.log('没有可用的宠物ID，跳过获取宠物详情');
    return;
  }
  
  try {
    console.log(`正在获取宠物详情 (ID: ${petId})...`);
    const response = await api.get(`/api/pet/${petId}`);
    
    console.log('宠物详情:', response.data);
  } catch (error) {
    console.error('获取宠物详情失败:', error.response && error.response.data ? error.response.data : error.message);
  }
}

/**
 * 更新宠物信息
 */
async function updatePet() {
  if (!petId) {
    console.log('没有可用的宠物ID，跳过更新宠物');
    return;
  }
  
  try {
    console.log(`正在更新宠物 (ID: ${petId})...`);
    const response = await api.put(`/api/pet/${petId}`, {
      name: '小白白',
      age: '3岁',
      weight: 16.5
    });
    
    console.log('宠物更新结果:', response.data);
  } catch (error) {
    console.error('更新宠物失败:', error.response && error.response.data ? error.response.data : error.message);
  }
}

/**
 * 删除宠物
 */
async function deletePet() {
  if (!petId) {
    console.log('没有可用的宠物ID，跳过删除宠物');
    return;
  }
  
  try {
    console.log(`正在删除宠物 (ID: ${petId})...`);
    const response = await api.delete(`/api/pet/${petId}`);
    
    console.log('宠物删除结果:', response.data);
  } catch (error) {
    console.error('删除宠物失败:', error.response && error.response.data ? error.response.data : error.message);
  }
}

/**
 * 运行所有测试
 */
async function runTests() {
  try {
    // 1. 登录获取令牌
    await login();
    
    // 2. 创建宠物
    await createPet();
    
    // 3. 获取宠物列表
    await getPets();
    
    // 4. 获取单个宠物详情
    await getPetById();
    
    // 5. 更新宠物信息
    await updatePet();
    
    // 6. 再次获取宠物详情，验证更新结果
    await getPetById();
    
    // 7. 删除宠物
    await deletePet();
    
    // 8. 再次获取宠物列表，验证删除结果
    await getPets();
    
    console.log('测试完成');
  } catch (error) {
    console.error('测试过程中发生错误:', error.message);
  }
}

// 运行测试
runTests(); 