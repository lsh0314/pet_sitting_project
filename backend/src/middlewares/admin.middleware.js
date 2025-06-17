const adminMiddleware = (req, res, next) => {
  // 确保用户已通过authMiddleware验证
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '未授权'
    });
  }

  // 检查用户角色是否为admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '无权访问，需要管理员权限'
    });
  }

  next();
};

module.exports = adminMiddleware;
