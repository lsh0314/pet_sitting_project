// 测试宠物API
const axios = require('axios');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 基础URL
const baseURL = process.env.BASE_URL || 'http://localhost:3000';

// 测试用的token（需要替换为有效的token）
let token = '';

// 测试数据
const testPet = {
  name: '测试宠物',
  photo: 'https://example.com/test.jpg',
  breed: '测试品种',
  age: '2岁',
  gender: 'male',
  weight: '5',
  isSterilized: true,
  healthDesc: '健康状况良好',
  characterTags: ['活泼', '亲人'],
  specialNotes: '特别注意事项',
  allergyInfo: '无过敏源',
  vaccineProof: ['https://example.com/vaccine.jpg']
};

// 创建的宠物ID
let createdPetId = null;

// 登录获取token
async function login() {
  try {
    console.log('尝试登录获取token...');
    
    // 这里使用模拟登录，实际项目中应该使用真实的登录接口
    const response = await axios.post(`${baseURL}/api/auth/login`, {
      username: 'testuser',
      password: 'testpassword'
    });
    
    if (response.data && response.data.token) {
      token = response.data.token;
      console.log('登录成功，获取到token');
      return true;
    } else {
      console.error('登录失败，未获取到token');
      return false;
    }
  } catch (error) {
    console.error('登录请求失败:', error.message);
    if (error.response) {
      console.error('响应状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    return false;
  }
}

// 测试获取宠物列表
async function testGetPets() {
  try {
    console.log('\n测试获取宠物列表...');
    
    const response = await axios.get(`${baseURL}/api/pet`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('获取宠物列表成功');
    console.log('宠物数量:', response.data.length);
    console.log('宠物列表:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('获取宠物列表失败:', error.message);
    if (error.response) {
      console.error('响应状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    return false;
  }
}

// 测试创建宠物
async function testCreatePet() {
  try {
    console.log('\n测试创建宠物...');
    
    const response = await axios.post(`${baseURL}/api/pet`, testPet, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('创建宠物成功');
    console.log('创建的宠物:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.id) {
      createdPetId = response.data.id;
      return true;
    } else {
      console.error('未获取到创建的宠物ID');
      return false;
    }
  } catch (error) {
    console.error('创建宠物失败:', error.message);
    if (error.response) {
      console.error('响应状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    return false;
  }
}

// 测试获取单个宠物
async function testGetPet() {
  if (!createdPetId) {
    console.error('\n未能获取宠物ID，跳过获取单个宠物测试');
    return false;
  }
  
  try {
    console.log(`\n测试获取宠物ID=${createdPetId}...`);
    
    const response = await axios.get(`${baseURL}/api/pet/${createdPetId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('获取宠物成功');
    console.log('宠物信息:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('获取宠物失败:', error.message);
    if (error.response) {
      console.error('响应状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    return false;
  }
}

// 测试更新宠物
async function testUpdatePet() {
  if (!createdPetId) {
    console.error('\n未能获取宠物ID，跳过更新宠物测试');
    return false;
  }
  
  try {
    console.log(`\n测试更新宠物ID=${createdPetId}...`);
    
    const updatedPet = {
      ...testPet,
      name: '更新后的宠物名称',
      age: '3岁'
    };
    
    const response = await axios.put(`${baseURL}/api/pet/${createdPetId}`, updatedPet, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('更新宠物成功');
    console.log('更新后的宠物:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('更新宠物失败:', error.message);
    if (error.response) {
      console.error('响应状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    return false;
  }
}

// 测试删除宠物
async function testDeletePet() {
  if (!createdPetId) {
    console.error('\n未能获取宠物ID，跳过删除宠物测试');
    return false;
  }
  
  try {
    console.log(`\n测试删除宠物ID=${createdPetId}...`);
    
    const response = await axios.delete(`${baseURL}/api/pet/${createdPetId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('删除宠物成功');
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('删除宠物失败:', error.message);
    if (error.response) {
      console.error('响应状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    return false;
  }
}

// 直接使用token测试（如果已知token）
async function testWithToken(userToken) {
  token = userToken;
  
  // 测试获取宠物列表
  await testGetPets();
  
  // 测试创建宠物
  const createSuccess = await testCreatePet();
  
  if (createSuccess) {
    // 测试获取单个宠物
    await testGetPet();
    
    // 测试更新宠物
    await testUpdatePet();
    
    // 测试删除宠物
    await testDeletePet();
  }
}

// 主测试函数
async function runTests() {
  console.log('开始测试宠物API...');
  
  // 如果没有提供token，则尝试登录获取
  if (!token) {
    const loginSuccess = await login();
    if (!loginSuccess) {
      console.error('登录失败，无法继续测试');
      return;
    }
  }
  
  // 测试获取宠物列表
  await testGetPets();
  
  // 测试创建宠物
  const createSuccess = await testCreatePet();
  
  if (createSuccess) {
    // 测试获取单个宠物
    await testGetPet();
    
    // 测试更新宠物
    await testUpdatePet();
    
    // 测试删除宠物
    await testDeletePet();
  }
  
  console.log('\n宠物API测试完成');
}

// 如果直接运行此脚本，则执行测试
if (require.main === module) {
  // 检查命令行参数中是否提供了token
  const args = process.argv.slice(2);
  if (args.length > 0) {
    testWithToken(args[0]);
  } else {
    runTests();
  }
}

module.exports = {
  testWithToken,
  runTests
}; 