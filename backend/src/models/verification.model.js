const pool = require('../config/database');

class Verification {
  /**
   * 获取所有认证申请
   * @param {Object} options - 查询选项
   * @param {number} options.page - 页码
   * @param {number} options.limit - 每页条数
   * @param {string} [options.type] - 认证类型
   * @param {string} [options.status] - 认证状态
   * @param {string} [options.keyword] - 搜索关键词(用户昵称)
   * @returns {Promise<{rows: Array, total: number}>}
   */
  async findAll({ page = 1, limit = 10, type, status, keyword }) {
    try {
      let whereClause = 'WHERE 1=1';
      const params = [];

      if (keyword) {
        whereClause += ' AND u.nickname LIKE ?';
        params.push(`%${keyword}%`);
      }

      if (type) {
        whereClause += ' AND v.type = ?';
        params.push(type);
      }

      if (status) {
        whereClause += ' AND v.status = ?';
        params.push(status);
      }      // 获取总数
      const [countResult] = await pool.execute(
        `SELECT COUNT(*) as total 
         FROM verifications v
         LEFT JOIN users u ON v.user_id = u.id 
         ${whereClause}`,
        params
      );
      const total = countResult[0].total;

      // 如果没有数据，直接返回空结果
      if (total === 0) {
        return { rows: [], total: 0 };
      }

      // 计算分页参数
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
      const offsetNum = (pageNum - 1) * limitNum;

      // 获取认证列表
      const [rows] = await pool.execute(
        `SELECT 
          v.*,
          u.nickname,
          u.avatar_url,
          u.wechat_openid,
          u.role,
          u.gender
         FROM verifications v
         LEFT JOIN users u ON v.user_id = u.id
         ${whereClause}
         ORDER BY v.created_at DESC
         LIMIT ${limitNum} OFFSET ${offsetNum}`,
        params
      );

      return { rows, total };
    } catch (error) {
      console.error('获取认证列表失败:', error);
      throw error;
    }
  }

  /**
   * 更新认证状态
   * @param {number} id - 认证ID
   * @param {object} data - 更新数据
   * @param {string} data.status - 认证状态
   * @param {string} data.admin_comment - 审核备注
   * @param {number} data.reviewed_by_admin_id - 审核人ID
   * @param {Date} data.updated_at - 更新时间
   */
  async updateStatus(id, { status, admin_comment, reviewed_by_admin_id, updated_at }) {
    try {
      // 确保参数不为undefined
      if (!status) {
        throw new Error('状态参数不能为空');
      }
      
      // 如果审核意见为undefined，设为空字符串
      const comment = admin_comment === undefined ? '' : admin_comment;
      // 如果更新时间为undefined，使用当前时间
      const updateTime = updated_at || new Date();
      
      const [result] = await pool.execute(
        `UPDATE verifications 
         SET status = ?, 
             admin_comment = ?,
             reviewed_by_admin_id = ?,
             updated_at = ?
         WHERE id = ?`,
        [status, comment, reviewed_by_admin_id, updateTime, id]
      );

      if (result.affectedRows === 0) {
        throw new Error('认证记录不存在');
      }

      return { success: true };
    } catch (error) {
      console.error('更新认证状态失败:', error);
      throw error;
    }
  }

  /**
   * 更新用户实名认证状态
   * @param {number} userId - 用户ID
   * @param {string} status - 认证状态 (pending, approved, rejected, unsubmitted)
   */
  async updateUserIdentityStatus(userId, status) {
    try {
      await pool.execute(
        `UPDATE users 
         SET identity_status = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [status, userId]
      );
      return { success: true };
    } catch (error) {
      console.error('更新用户实名认证状态失败:', error);
      throw error;
    }
  }

  /**
   * 通过ID查找认证记录
   * @param {number} id - 认证ID
   */
  async findById(id) {
    try {
      const [rows] = await pool.execute(
        `SELECT v.*, 
                u.nickname, 
                u.avatar_url,
                u.wechat_openid,
                u.role,
                u.gender
         FROM verifications v
         LEFT JOIN users u ON v.user_id = u.id
         WHERE v.id = ?`,
        [id]
      );

      return rows[0] || null;
    } catch (error) {
      console.error('查询认证记录失败:', error);
      throw error;
    }
  }

  /**
   * 创建认证申请
   * @param {Object} data - 认证数据
   * @param {number} data.user_id - 用户ID
   * @param {string} data.type - 认证类型
   * @param {string} data.submitted_data - 提交的认证材料JSON字符串
   * @param {string} data.status - 认证状态
   * @returns {Promise<Object>} 创建结果
   */
  async create(data) {
    try {
      const { user_id, type, submitted_data, status } = data;
      
      const [result] = await pool.execute(
        `INSERT INTO verifications (user_id, type, submitted_data, status, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [user_id, type, submitted_data, status || 'pending']
      );
      
      return result;
    } catch (error) {
      console.error('创建认证申请失败:', error);
      throw error;
    }
  }

  /**
   * 根据用户ID和认证类型查找待审核或已通过的认证
   * @param {number} userId - 用户ID
   * @param {string} type - 认证类型
   * @returns {Promise<Object|null>} 认证记录或null
   */
  async findPendingOrApprovedByUserIdAndType(userId, type) {
    try {
      const [rows] = await pool.execute(
        `SELECT * FROM verifications 
         WHERE user_id = ? AND type = ? AND status IN ('pending', 'approved')
         ORDER BY created_at DESC LIMIT 1`,
        [userId, type]
      );
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('查询认证记录失败:', error);
      throw error;
    }
  }

  /**
   * 根据用户ID查找任何类型的待审核或已通过的认证
   * @param {number} userId - 用户ID
   * @returns {Promise<Object|null>} 认证记录或null
   */
  async findPendingOrApprovedByUserId(userId) {
    try {
      const [rows] = await pool.execute(
        `SELECT * FROM verifications 
         WHERE user_id = ? AND status IN ('pending', 'approved')
         ORDER BY created_at DESC LIMIT 1`,
        [userId]
      );
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('查询认证记录失败:', error);
      throw error;
    }
  }

  /**
   * 检查用户是否有已通过的证书认证
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>} 是否有已通过的证书认证
   */
  async hasApprovedCertificate(userId) {
    try {
      const [rows] = await pool.execute(
        `SELECT COUNT(*) as count FROM verifications 
         WHERE user_id = ? AND type = 'certificate' AND status = 'approved'`,
        [userId]
      );
      
      return rows[0].count > 0;
    } catch (error) {
      console.error('查询用户证书认证状态失败:', error);
      throw error;
    }
  }

  /**
   * 更新用户角色
   * @param {number} userId - 用户ID
   * @param {string} role - 新角色
   * @returns {Promise<Object>} 更新结果
   */
  async updateUserRole(userId, role) {
    try {
      const [result] = await pool.execute(
        `UPDATE users 
         SET role = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [role, userId]
      );
      
      return { success: result.affectedRows > 0 };
    } catch (error) {
      console.error('更新用户角色失败:', error);
      throw error;
    }
  }
}

module.exports = new Verification();
