const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量
dotenv.config();

// 创建Express应用
const app = express();

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 基本路由
app.get('/', (req, res) => {
  res.json({ message: '欢迎使用宠物帮溜平台API' });
});

// 注册API路由
app.use('/api/auth', require('./src/api/auth.routes'));
app.use('/api/user', require('./src/api/user.routes'));
app.use('/api/pet', require('./src/api/pet.routes'));
app.use('/api/sitter', require('./src/api/sitter.routes'));
app.use('/api/order', require('./src/api/order.routes'));
app.use('/api/payment', require('./src/api/payment.routes'));
app.use('/api/upload', require('./src/api/upload.routes'));
app.use('/api/verifications', require('./src/api/verification.routes'));
app.use('/api/withdrawals', require('./src/api/withdrawal.routes'));

// 全局错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 设置服务器端口
const PORT = process.env.PORT || 3000;

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

module.exports = app;
