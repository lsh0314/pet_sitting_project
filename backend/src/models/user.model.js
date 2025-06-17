const pool = require('../config/database');
const bcrypt = require('bcrypt');

/**
 * 用户模型
 * 处理用户相关数据库操作
 */
class UserModel {
  /**
   * 通过微信OpenID查找用户
   * @param {string} wechat_openid - 微信OpenID
   * @returns {Promise<Object|null>} 用户对象或null
   */
  async findByOpenid(wechat_openid) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE wechat_openid = ?',
        [wechat_openid]
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
        'SELECT id, nickname, avatar_url, role, gender, status, identity_status, created_at, updated_at FROM users WHERE id = ?',
        [id]
      );
      
      if (rows.length > 0) {
        // 检查用户是否有帮溜员资料
        if (rows[0].role === 'sitter') {
          const [profileRows] = await pool.execute(
            'SELECT * FROM sitter_profiles WHERE user_id = ?',
            [id]
          );
          rows[0].hasProfile = profileRows.length > 0;
        }
        return rows[0];
      }
      
      return null;
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
      const { wechat_openid, nickname, avatar_url, role = 'pet_owner' } = userData;
      
      const [result] = await pool.execute(
        'INSERT INTO users (wechat_openid, nickname, avatar_url, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, "active", NOW(), NOW())',
        [wechat_openid, nickname, avatar_url, role]
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
      const allowedFields = ['nickname', 'avatar_url', 'gender', 'role'];
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
      const passwordMatch = await bcrypt.compare(password, admin.password_hash);

      if (!passwordMatch) {
        return null;
      }

      // 确保管理员角色不为空
      const adminRole = admin.role || 'admin';
      
      return {
        id: admin.id,
        username: admin.username,
        role: adminRole
      };
    } catch (error) {
      console.error('验证管理员登录失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有用户列表(不分页)
   * @param {string} role - 角色筛选
   * @param {string} status - 状态筛选
   * @returns {Promise<Array>} 用户列表
   */
  async getAllUsers(role = '', status = '') {
    try {
      const params = [];
      let whereClause = '1 = 1';
      
      // 构建 WHERE 子句
      if (role) {
        whereClause += ' AND role = ?';
        params.push(role);
      }
      if (status) {
        whereClause += ' AND status = ?';
        params.push(status);
      }
      
      const [rows] = await pool.execute(
        `SELECT id, nickname, avatar_url, role, status, identity_status, created_at 
         FROM users 
         WHERE ${whereClause} 
         ORDER BY id DESC`,
        params
      );
      
      return rows;
    } catch (error) {
      console.error('获取用户列表失败:', error);
      throw error;
    }
  }

  /*
   * 原分页方法已注释
   * async getUsersList(page = 1, limit = 10, role = '', status = '') {
   *   // 原分页实现代码...
   * }
   */

  /**
   * 更新用户状态
   * @param {number} id - 用户ID
   * @param {string} status - 新状态(active/banned)
   * @returns {Promise<boolean>} 是否更新成功
   */
  async updateStatus(id, status) {
    try {
      const [result] = await pool.execute(
        'UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?',
        [status, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('更新用户状态失败:', error);
      throw error;
    }
  }
  /**
   * 搜索用户
   * @param {Object} params - 搜索参数
   * @param {string} params.keyword - 搜索关键词
   * @param {string} params.role - 用户角色
   * @param {string} params.status - 用户状态
   * @param {number} params.page - 页码
   * @param {number} params.limit - 每页数量
   * @returns {Promise<{rows: Array, total: number}>} 用户列表和总数
   */
  async searchUsers({ keyword = '', role = '', status = '', page = 1, limit = 10 }) {
    try {
      // 验证并转换参数
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.max(1, parseInt(limit));
      const offset = (pageNum - 1) * limitNum;

      // 构建查询条件
      const conditions = ['1=1']; // 始终为真的条件，方便拼接
      const params = [];

      // 处理关键词搜索
      if (keyword && keyword.trim()) {
        const trimmedKeyword = keyword.trim();
        const isNumeric = /^\d+$/.test(trimmedKeyword);
        if (isNumeric) {
          conditions.push('(nickname LIKE ? OR id = ?)');
          params.push(`%${trimmedKeyword}%`, parseInt(trimmedKeyword));
        } else {
          conditions.push('nickname LIKE ?');
          params.push(`%${trimmedKeyword}%`);
        }
      }

      // 处理角色筛选
      if (role && role.trim()) {
        conditions.push('role = ?');
        params.push(role.trim());
      }

      // 处理状态筛选
      if (status && status.trim()) {
        conditions.push('status = ?');
        params.push(status.trim());
      }

      // 构建WHERE子句
      const whereClause = conditions.join(' AND ');

      // 获取总数
      const countSql = `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`;
      const [countResult] = await pool.execute(countSql, params);
      const total = countResult[0].total;

      // 如果没有数据，直接返回空结果
      if (total === 0) {
        return { rows: [], total: 0 };
      }

      // 构建最终查询 - 分页参数直接拼接，避免参数绑定问题
      const dataSql = `
        SELECT id, nickname, avatar_url, role, status, created_at 
        FROM users 
        WHERE ${whereClause}
        ORDER BY id DESC 
        LIMIT ${limitNum} OFFSET ${offset}
      `;

      // 执行查询
      const [rows] = await pool.execute(dataSql, params);

      return { rows, total };
    } catch (error) {
      console.error('搜索用户失败:', error);
      throw error;
    }
  }
}

module.exports = new UserModel();
