/**
 * 配置文件示例
 * 
 * 使用说明:
 * 1. 复制此文件并重命名为 config.js
 * 2. 在 config.js 中填入您的实际配置信息
 * 3. 确保 config.js 已添加到 .gitignore 中，避免提交敏感信息
 */

// API密钥配置
const apiKeys = {
  // 腾讯地图开发者密钥
  qqMapKey: 'YOUR_QQ_MAP_KEY_HERE', // 请替换为您的实际密钥
};

// 环境配置
const env = {
  development: {
    baseAPI: 'http://127.0.0.1:3000',
  },
  production: {
    baseAPI: 'https://api.petsitting.com',
  }
};

// 导出配置
module.exports = {
  apiKeys,
  env,
  // 当前环境，可以根据需要修改
  currentEnv: 'development'
}; 