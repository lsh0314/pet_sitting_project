const userModel = require('../models/user.model');
const { success, error } = require('../utils/response.util');

/**
 * 用户控制器
 * 处理用户相关请求
 */
class UserController {
  /**
   * 获取当前用户个人资料
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const user = await userModel.findById(userId);
      
      if (!user) {
        return error(res, '用户不存在', 404);
      }
      
      // 移除敏感信息
      delete user.password;
      delete user.openid;
      
      return success(res, user, '获取用户资料成功');
    } catch (err) {
      console.error('获取用户资料失败:', err);
      return error(res, '获取用户资料失败', 500, err);
    }
  }
  
  /**
   * 更新当前用户个人资料
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const userData = req.body;
      
      // 更新用户信息
      const updatedUser = await userModel.update(userId, userData);
      
      // 移除敏感信息
      delete updatedUser.password;
      delete updatedUser.openid;
      
      return success(res, updatedUser, '更新用户资料成功');
    } catch (err) {
      console.error('更新用户资料失败:', err);
      return error(res, '更新用户资料失败', 500, err);
    }
  }
}

module.exports = new UserController(); 