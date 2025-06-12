const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');

/**
 * 认证服务
 * 处理用户登录、注册和令牌生成
 */
class AuthService {
  /**
   * 微信小程序登录
   * @param {string} code - 微信登录code
   * @param {Object} userInfo - 用户信息（昵称、头像）
   * @returns {Promise<Object>} 包含token和用户信息的对象
   */
  async wechatLogin(code, userInfo = {}) {
    try {
      // MVP阶段使用模拟的openid
      // 实际项目中应使用code换取openid
      // 通过微信API: https://api.weixin.qq.com/sns/jscode2session
      const openid = `simulated_openid_${code}`;
      
      // 查找用户是否已存在
      let user = await userModel.findByOpenid(openid);
      
      // 不存在则创建新用户
      if (!user) {
        const { nickName, avatarUrl } = userInfo;
        user = await userModel.create({
          openid,
          nickname: nickName || '宠友',
          avatar: avatarUrl || '',
          role: 'pet_owner' // 默认角色为宠物主
        });
      }
      
      // 生成JWT令牌
      const token = this.generateToken(user);
      
      return {
        token,
        user: {
          id: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
          role: user.role
        }
      };
    } catch (error) {
      console.error('微信登录失败:', error);
      throw error;
    }
  }
  
  /**
   * 管理员登录
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @returns {Promise<Object>} 包含token和用户信息的对象
   */
  async adminLogin(username, password) {
    try {
      const admin = await userModel.verifyAdminLogin(username, password);
      
      if (!admin) {
        throw new Error('用户名或密码不正确');
      }
      
      // 生成JWT令牌
      const token = this.generateToken(admin);
      
      return {
        token,
        user: {
          id: admin.id,
          username: admin.username,
          role: admin.role
        }
      };
    } catch (error) {
      console.error('管理员登录失败:', error);
      throw error;
    }
  }
  
  /**
   * 生成JWT令牌
   * @param {Object} user - 用户对象
   * @returns {string} JWT令牌
   */
  generateToken(user) {
    const payload = {
      id: user.id,
      role: user.role
    };
    
    return jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
  }
}

module.exports = new AuthService(); 