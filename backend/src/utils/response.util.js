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
 * @param {Object} options - 额外选项
 * @param {string} options.errorCode - 错误代码
 * @returns {Object} 格式化的错误响应
 */
const error = (res, message = '操作失败', statusCode = 400, options = {}) => {
  const response = {
    success: false,
    message
  };

  // 添加错误代码
  if (options.errorCode) {
    response.errorCode = options.errorCode;
  } else {
    // 根据状态码设置默认错误代码
    switch (statusCode) {
      case 401:
        response.errorCode = 'UNAUTHORIZED';
        break;
      case 403:
        response.errorCode = 'FORBIDDEN';
        break;
      case 404:
        response.errorCode = 'NOT_FOUND';
        break;
      case 400:
        response.errorCode = 'INVALID_PARAM';
        break;
      case 500:
        response.errorCode = 'SERVER_ERROR';
        break;
      default:
        response.errorCode = 'UNKNOWN_ERROR';
    }
  }

  // 在开发环境下添加详细错误信息
  if (process.env.NODE_ENV === 'development' && options.error) {
    response.error = options.error.toString();
  }

  return res.status(statusCode).json(response);
};

module.exports = {
  success,
  error
};