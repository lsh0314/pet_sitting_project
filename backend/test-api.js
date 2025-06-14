// 测试后端API是否正常工作
const axios = require('axios');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 基础URL
const baseURL = process.env.BASE_URL || 'http://localhost:3000';

// 测试根路径
async function testRoot() {
  try {
    console.log('\n测试根路径...');
    const response = await axios.get(baseURL);
    console.log('状态码:', response.status);
    console.log('响应数据:', response.data);
    return true;
  } catch (error) {
    console.error('测试根路径失败:', error.message);
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    return false;
  }
}

// 测试宠物API路径
async function testPetApi() {
  try {
    console.log('\n测试宠物API路径（无认证）...');
    const response = await axios.get(`${baseURL}/api/pet`);
    console.log('状态码:', response.status);
    console.log('响应数据:', response.data);
    return true;
  } catch (error) {
    console.error('测试宠物API路径失败:', error.message);
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
      
      // 如果是401错误，说明API路径存在但需要认证
      if (error.response.status === 401) {
        console.log('API路径存在，但需要认证');
        return true;
      }
    }
    return false;
  }
}

// 测试API服务器是否运行
async function testApiServer() {
  try {
    console.log(`\n测试API服务器是否运行在 ${baseURL}...`);
    
    // 尝试连接服务器
    const response = await axios.get(baseURL, { timeout: 5000 });
    console.log('API服务器正在运行');
    console.log('状态码:', response.status);
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error(`API服务器未运行或无法连接到 ${baseURL}`);
    } else {
      console.error('测试API服务器失败:', error.message);
      if (error.response) {
        console.error('状态码:', error.response.status);
      }
    }
    return false;
  }
}

// 检查端口占用情况
async function checkPort() {
  const port = new URL(baseURL).port || '80';
  console.log(`\n检查端口 ${port} 占用情况...`);
  
  // 使用系统命令检查端口占用情况
  const { exec } = require('child_process');
  
  return new Promise((resolve) => {
    let command;
    if (process.platform === 'win32') {
      command = `netstat -ano | findstr :${port}`;
    } else {
      command = `lsof -i :${port}`;
    }
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log(`端口 ${port} 未被占用`);
        resolve(false);
        return;
      }
      
      if (stdout) {
        console.log(`端口 ${port} 已被占用:`);
        console.log(stdout);
        resolve(true);
      } else {
        console.log(`端口 ${port} 未被占用`);
        resolve(false);
      }
    });
  });
}

// 主函数
async function main() {
  console.log('开始测试后端API...');
  console.log('基础URL:', baseURL);
  
  // 检查端口占用情况
  await checkPort();
  
  // 测试API服务器是否运行
  const serverRunning = await testApiServer();
  
  if (serverRunning) {
    // 测试根路径
    await testRoot();
    
    // 测试宠物API路径
    await testPetApi();
  } else {
    console.log('\n请确保后端服务器已启动，并且可以访问');
    console.log('可以通过以下命令启动后端服务器:');
    console.log('cd backend && npm start');
  }
  
  console.log('\n测试完成');
}

// 如果直接运行此脚本，则执行测试
if (require.main === module) {
  main();
}

module.exports = {
  testRoot,
  testPetApi,
  testApiServer,
  checkPort,
  main
}; 