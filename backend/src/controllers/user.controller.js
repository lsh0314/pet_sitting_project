const userModel = require('../models/user.model');
const { success, error } = require('../utils/response.util');
const pool = require('../config/database');

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

  /**
   * 获取用户列表(管理员)
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */  
  async getUserList(req, res) {
    try {
      const { page = 1, limit = 10, role = '', status = '' } = req.query;
      const offset = (page - 1) * limit;

      let query = 'SELECT id, nickname, avatar_url, role, status, created_at FROM users WHERE 1=1';
      const params = [];

      if (role) {
        query += ' AND role = ?';
        params.push(role);
      }

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      // 获取总数
      const [countRows] = await pool.execute(
        query.replace('SELECT id, nickname, avatar_url, role, status, created_at', 'SELECT COUNT(*) as total'),
        params
      );

      // 获取分页数据 - 直接拼接数值避免参数化查询问题
      query += ` ORDER BY id DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
      const [rows] = await pool.execute(query, params);

      return success(res, {
        data: rows,
        total: countRows[0].total,
        page: parseInt(page),
        limit: parseInt(limit)
      }, '获取用户列表成功');
    } catch (err) {
      console.error('获取用户列表失败:', err);
      return error(res, '获取用户列表失败', 500);
    }
  }
  /**
   * 更新用户状态(管理员)
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async updateUserStatus(req, res) {
    try {
      const userId = req.params.id;
      const { status } = req.body;
      
      if (!['active', 'banned'].includes(status)) {
        return error(res, '无效的状态值', 400);
      }
      
      const result = await userModel.updateStatus(userId, status);
      
      if (result) {
        return success(res, null, '更新用户状态成功');
      } else {
        return error(res, '用户不存在', 404);
      }
    } catch (err) {
      console.error('更新用户状态失败:', err);
      return error(res, '更新用户状态失败', 500, err);
    }
  }
  /**
   * 搜索用户(管理员)
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async searchUsers(req, res) {
    try {
      const { page, limit, keyword, role, status } = req.query;
      console.log('接收到搜索请求:', { page, limit, keyword, role, status }); // 调试日志

      const result = await userModel.searchUsers({
        keyword: keyword || '',
        role: role || '',
        status: status || '',
        page: page || 1,
        limit: limit || 10
      });

      console.log('搜索结果:', {
        total: result.total,
        listSize: result.rows.length,
        page,
        limit
      }); // 调试日志

      return success(res, {
        data: result.rows,
        total: result.total,
        page: Math.max(1, parseInt(page) || 1),
        limit: Math.max(1, parseInt(limit) || 10)
      });
    } catch (err) {
      console.error('搜索用户失败:', err);
      return error(res, '搜索用户失败', 500);
    }
  }
  /**
   * 获取用户详情
   */
  async getUserDetail(req, res) {
    try {
      const userId = req.params.id;      const [rows] = await pool.execute(`
        SELECT 
          u.*,
          sp.bio,
          sp.service_area,
          sp.available_dates,
          IFNULL(
            (SELECT COUNT(*) FROM orders WHERE sitter_user_id = u.id AND status = 'confirmed'),
            0
          ) as service_count,
          sp.total_services_completed,
          sp.rating,
          sp.updated_at as profile_updated_at
        FROM users u 
        LEFT JOIN sitter_profiles sp ON u.id = sp.user_id 
        WHERE u.id = ?
      `, [userId]);

      if (rows.length === 0) {
        return error(res, '用户不存在', 404);
      }

      const user = rows[0];
      
      // 移除敏感信息
      delete user.password;
      delete user.openid;
      
      // 确保性别信息正确
      user.gender = user.gender || 'unknown';
        // 确保用户状态正确
      user.identity_status = user.identity_status || 'unsubmitted';
      user.total_services_completed = user.total_services_completed || 0;
      user.rating = user.rating || 5.00;

      console.log('用户详情:', user); // 调试日志

      return success(res, user);
    } catch (err) {
      console.error('获取用户详情失败:', err);
      return error(res, '获取用户详情失败', 500);
    }
  }

  /**
   * 更新用户角色(管理员)
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async updateUserRole(req, res) {
    try {
      const userId = req.params.id;
      const { role } = req.body;
      
      if (!['pet_owner', 'sitter'].includes(role)) {
        return error(res, '无效的角色值', 400);
      }
      
      const [result] = await pool.execute(
        'UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?',
        [role, userId]
      );
      
      if (result.affectedRows === 0) {
        return error(res, '用户不存在', 404);
      }
      
      return success(res, null, '更新用户角色成功');
    } catch (err) {
      console.error('更新用户角色失败:', err);
      return error(res, '更新用户角色失败', 500);
    }
  }

  /**
   * 更新用户信息(管理员)
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async updateUserInfo(req, res) {
    try {
      const userId = req.params.id;
      const userData = req.body;
      
      // 允许更新的字段
      const allowedFields = ['nickname', 'avatar_url', 'gender'];
      const updates = {};
      
      // 过滤只允许更新的字段
      Object.keys(userData).forEach(key => {
        if (allowedFields.includes(key)) {
          updates[key] = userData[key];
        }
      });
      
      if (Object.keys(updates).length === 0) {
        return error(res, '没有可更新的字段', 400);
      }
      
      const [result] = await pool.execute(
        `UPDATE users SET ${Object.keys(updates).map(f => `${f} = ?`).join(', ')}, updated_at = NOW() WHERE id = ?`,
        [...Object.values(updates), userId]
      );
      
      if (result.affectedRows === 0) {
        return error(res, '用户不存在', 404);
      }
      
      // 获取更新后的用户信息
      const [rows] = await pool.execute(
        'SELECT id, nickname, avatar_url, role, gender FROM users WHERE id = ?',
        [userId]
      );
      
      return success(res, rows[0], '更新用户信息成功');
    } catch (err) {
      console.error('更新用户信息失败:', err);
      return error(res, '更新用户信息失败', 500);
    }
  }

  /**
   * 导出用户数据(管理员)
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async exportUsers(req, res) {
    try {
      const { role = '', status = '' } = req.query;
      
      let query = 'SELECT id, nickname, avatar_url, role, status, gender, created_at FROM users WHERE 1=1';
      const params = [];
      
      if (role) {
        query += ' AND role = ?';
        params.push(role);
      }
      
      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }
      
      query += ' ORDER BY id DESC';
      
      const [rows] = await pool.execute(query, params);
      
      // 构建CSV内容
      const csvHeader = '用户ID,昵称,头像URL,角色,状态,性别,注册时间\n';
      const csvRows = rows.map(user => 
        `"${user.id}","${user.nickname || ''}","${user.avatar_url || ''}","${user.role}","${user.status}","${user.gender || ''}","${user.created_at}"`
      ).join('\n');
      
      const csvContent = csvHeader + csvRows;
      
      // 设置响应头
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=users_export.csv');
      
      // 发送CSV内容
      res.send(csvContent);
    } catch (err) {
      console.error('导出用户数据失败:', err);
      return error(res, '导出用户数据失败', 500);
    }
  }
}

module.exports = new UserController();
