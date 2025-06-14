// 测试获取宠物列表API
const axios = require('axios');

// 基础URL
const baseURL = 'http://localhost:3000';

// 测试获取宠物列表
async function testGetPets(token) {
  console.log('测试获取宠物列表接口...');
  console.log('基础URL:', baseURL);
  console.log('使用Token:', token ? `${token.substring(0, 10)}...` : '未提供');
  
  try {
    const response = await axios.get(`${baseURL}/api/pet`, {
      headers: token ? {
        'Authorization': `Bearer ${token}`
      } : {}
    });
    
    console.log('\n请求成功!');
    console.log('状态码:', response.status);
    console.log('响应头:', JSON.stringify(response.headers, null, 2));
    console.log('宠物数量:', Array.isArray(response.data) ? response.data.length : '未知（响应不是数组）');
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    return true;
  } catch (error) {
    console.error('\n请求失败!');
    console.error('错误信息:', error.message);
    
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应头:', JSON.stringify(error.response.headers, null, 2));
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    
    return false;
  }
}

// 主函数
async function main() {
  // 获取命令行参数中的token
  const args = process.argv.slice(2);
  const token = args[0];
  
  await testGetPets(token);
}

// 如果直接运行此脚本，则执行测试
if (require.main === module) {
  main();
}

module.exports = {
  testGetPets
}; 