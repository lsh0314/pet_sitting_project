const authService = require('../services/auth.service');
const { success, error } = require('../utils/response.util');

/**
 * 认证控制器
 * 处理登录、注册相关请求
 */
class AuthController {
  /**
   * 微信小程序登录
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async wechatLogin(req, res) {
    try {
      const { code } = req.body;
      
      if (!code) {
        return error(res, '缺少微信code', 400, { errorCode: 'INVALID_PARAM' });
      }
      
      const result = await authService.wechatLogin(code, req.body);
      return success(res, result);
    } catch (err) {
      console.error('微信登录失败:', err);
      return error(res, '登录失败', 500, { errorCode: 'SERVER_ERROR' });
    }
  }
  
  /**
   * 管理员登录
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async adminLogin(req, res) {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return error(res, '用户名和密码不能为空', 400, { errorCode: 'INVALID_PARAM' });
      }
      
      const result = await authService.adminLogin(username, password);
      return success(res, result);
    } catch (err) {
      console.error('管理员登录失败:', err);
      return error(res, err.message || '登录失败', 401, { errorCode: 'UNAUTHORIZED' });
    }
  }
}

module.exports = new AuthController(); 