const jwt = require('jsonwebtoken');
const { error } = require('../utils/response.util');

/**
 * JWT认证中间件
 * 验证请求头中的Authorization字段包含的JWT令牌
 * 如果有效，将解码后的用户信息附加到req对象
 */
const authenticateJWT = (req, res, next) => {
  // 从请求头获取Authorization字段
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return error(res, '未提供授权令牌', 401);
  }

  // 验证Bearer格式
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return error(res, '授权格式无效', 401);
  }

  const token = parts[1];

  try {
    // 验证令牌
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    
    // 将解码后的用户信息附加到请求对象
    req.user = decoded;
    
    // 继续处理请求
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, '令牌已过期', 401);
    }
    
    return error(res, '无效的令牌', 401);
  }
};

/**
 * 管理员权限验证中间件
 * 必须在authenticateJWT中间件之后使用
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return error(res, '未授权', 401);
  }

  if (req.user.role !== 'admin') {
    return error(res, '需要管理员权限', 403);
  }

  next();
};

module.exports = {
  authenticateJWT,
  isAdmin
}; 