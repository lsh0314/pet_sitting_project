const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 从环境变量获取JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

/**
 * JWT认证中间件
 * 用于解析请求头中的token，验证其有效性，并将用户信息附加到req对象上
 */
const authMiddleware = (req, res, next) => {
  // 获取请求头中的Authorization字段
  const authHeader = req.headers.authorization;
  
  // 检查Authorization头是否存在
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      errorCode: 'AUTH_HEADER_MISSING',
      message: '未提供认证令牌'
    });
  }

  // 检查Authorization格式是否正确（Bearer token）
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      errorCode: 'INVALID_AUTH_FORMAT',
      message: '认证令牌格式不正确'
    });
  }

  const token = parts[1];

  try {
    // 验证JWT令牌
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 将解码后的用户信息附加到req对象，供后续路由使用
    req.user = decoded;
    
    // 继续下一个中间件或路由处理器
    next();
  } catch (error) {
    // 处理不同类型的JWT错误
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        errorCode: 'TOKEN_EXPIRED',
        message: '认证令牌已过期'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        errorCode: 'INVALID_TOKEN',
        message: '无效的认证令牌'
      });
    }
    
    // 其他未知错误
    return res.status(500).json({
      success: false,
      errorCode: 'AUTH_ERROR',
      message: '认证过程中发生错误'
    });
  }
};

/**
 * 管理员权限验证中间件
 * 必须在authMiddleware中间件之后使用
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      errorCode: 'UNAUTHORIZED',
      message: '未授权'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      errorCode: 'FORBIDDEN',
      message: '需要管理员权限'
    });
  }

  next();
};

// 导出中间件
module.exports = authMiddleware;