const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

/**
 * 用户模型
 * 处理用户相关数据库操作
 */
class UserModel {
  /**
   * 通过微信OpenID查找用户
   * @param {string} openid - 微信OpenID
   * @returns {Promise<Object|null>} 用户对象或null
   */
  async findByOpenid(openid) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE openid = ?',
        [openid]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('查找用户失败:', error);
      throw error;
    }
  }

  /**
   * 通过用户ID查找用户
   * @param {number} id - 用户ID
   * @returns {Promise<Object|null>} 用户对象或null
   */
  async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT id, username, nickname, avatar, role, phone, email, created_at, updated_at FROM users WHERE id = ?',
        [id]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('查找用户失败:', error);
      throw error;
    }
  }

  /**
   * 创建新用户
   * @param {Object} userData - 用户数据
   * @returns {Promise<Object>} 创建的用户对象
   */
  async create(userData) {
    try {
      const { openid, nickname, avatar, role = 'pet_owner' } = userData;
      
      const [result] = await pool.execute(
        'INSERT INTO users (openid, nickname, avatar, role, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
        [openid, nickname, avatar, role]
      );
      
      const userId = result.insertId;
      return this.findById(userId);
    } catch (error) {
      console.error('创建用户失败:', error);
      throw error;
    }
  }

  /**
   * 更新用户信息
   * @param {number} id - 用户ID
   * @param {Object} userData - 要更新的用户数据
   * @returns {Promise<Object>} 更新后的用户对象
   */
  async update(id, userData) {
    try {
      const allowedFields = ['nickname', 'avatar', 'phone', 'email'];
      const updates = [];
      const values = [];

      // 构建更新语句
      for (const [key, value] of Object.entries(userData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      }

      if (updates.length === 0) {
        return this.findById(id);
      }

      updates.push('updated_at = NOW()');
      values.push(id);

      const [result] = await pool.execute(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      return this.findById(id);
    } catch (error) {
      console.error('更新用户失败:', error);
      throw error;
    }
  }

  /**
   * 验证管理员登录
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @returns {Promise<Object|null>} 管理员用户对象或null
   */
  async verifyAdminLogin(username, password) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM admins WHERE username = ?',
        [username]
      );

      if (rows.length === 0) {
        return null;
      }

      const admin = rows[0];
      const passwordMatch = await bcrypt.compare(password, admin.password);

      if (!passwordMatch) {
        return null;
      }

      return {
        id: admin.id,
        username: admin.username,
        role: 'admin'
      };
    } catch (error) {
      console.error('验证管理员登录失败:', error);
      throw error;
    }
  }
}

module.exports = new UserModel(); 