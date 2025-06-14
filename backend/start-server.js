// 启动后端服务器
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 检查端口占用情况
async function checkPort(port) {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    
    let command;
    if (process.platform === 'win32') {
      command = `netstat -ano | findstr :${port}`;
    } else {
      command = `lsof -i :${port}`;
    }
    
    exec(command, (error, stdout, stderr) => {
      if (error || !stdout) {
        resolve(false); // 端口未被占用
        return;
      }
      
      resolve(true); // 端口已被占用
    });
  });
}

// 启动服务器
async function startServer() {
  // 检查app.js是否存在
  const appPath = path.join(__dirname, 'app.js');
  if (!fs.existsSync(appPath)) {
    console.error(`错误: 找不到应用程序入口文件: ${appPath}`);
    return false;
  }
  
  // 检查端口是否被占用
  const port = process.env.PORT || 3000;
  const isPortBusy = await checkPort(port);
  
  if (isPortBusy) {
    console.error(`错误: 端口 ${port} 已被占用，请关闭占用该端口的程序或使用其他端口`);
    return false;
  }
  
  // 启动服务器
  console.log(`启动服务器: node ${appPath}`);
  
  const server = spawn('node', [appPath], {
    stdio: 'inherit',
    env: process.env
  });
  
  server.on('error', (err) => {
    console.error('启动服务器时出错:', err);
  });
  
  server.on('close', (code) => {
    if (code !== 0) {
      console.log(`服务器进程退出，退出码: ${code}`);
    }
  });
  
  console.log(`服务器已启动，监听端口: ${port}`);
  console.log('按 Ctrl+C 停止服务器');
  
  return true;
}

// 主函数
async function main() {
  console.log('准备启动后端服务器...');
  
  try {
    await startServer();
  } catch (error) {
    console.error('启动服务器失败:', error);
  }
}

// 如果直接运行此脚本，则执行启动
if (require.main === module) {
  main();
}

module.exports = {
  checkPort,
  startServer,
  main
}; 