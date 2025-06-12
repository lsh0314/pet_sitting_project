/**
 * 成功响应
 * @param {Object} res - Express响应对象
 * @param {*} data - 响应数据
 * @param {string} message - 响应消息
 * @param {number} statusCode - HTTP状态码
 * @returns {Object} 格式化的响应
 */
const success = (res, data = null, message = '操作成功', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * 错误响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 * @param {number} statusCode - HTTP状态码
 * @param {*} error - 错误详情（仅在开发环境显示）
 * @returns {Object} 格式化的错误响应
 */
const error = (res, message = '操作失败', statusCode = 400, error = null) => {
  const response = {
    success: false,
    message
  };

  if (process.env.NODE_ENV === 'development' && error) {
    response.error = error.toString();
  }

  return res.status(statusCode).json(response);
};

module.exports = {
  success,
  error
}; 