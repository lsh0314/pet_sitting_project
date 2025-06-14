const pool = require('../config/database');

/**
 * 帮溜员资料模型 - 处理与sitter_profiles表的交互
 */
class SitterProfile {
  /**
   * 根据用户ID查找帮溜员资料
   * @param {number} userId - 用户ID
   * @returns {Promise<Object|null>} 帮溜员资料对象或null
   */
  static async findByUserId(userId) {
    try {
      const [rows] = await pool.query(
        `SELECT sp.*, u.nickname, u.avatar_url
         FROM sitter_profiles sp
         JOIN users u ON sp.user_id = u.id
         WHERE sp.user_id = ?`,
        [userId]
      );
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('查询帮溜员资料失败:', error);
      throw error;
    }
  }

  /**
   * 创建帮溜员资料
   * @param {number} userId - 用户ID
   * @param {Object} profileData - 帮溜员资料数据
   * @returns {Promise<boolean>} 是否创建成功
   */
  static async create(userId, profileData) {
    try {
      const { bio, service_area, available_dates } = profileData;
      
      const [result] = await pool.query(
        `INSERT INTO sitter_profiles (user_id, bio, service_area, available_dates)
         VALUES (?, ?, ?, ?)`,
        [userId, bio || null, service_area || null, available_dates ? JSON.stringify(available_dates) : null]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('创建帮溜员资料失败:', error);
      throw error;
    }
  }

  /**
   * 更新帮溜员资料
   * @param {number} userId - 用户ID
   * @param {Object} profileData - 帮溜员资料数据
   * @returns {Promise<boolean>} 是否更新成功
   */
  static async update(userId, profileData) {
    try {
      const { bio, service_area, available_dates } = profileData;
      
      const [result] = await pool.query(
        `UPDATE sitter_profiles
         SET bio = ?, service_area = ?, available_dates = ?, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [bio || null, service_area || null, available_dates ? JSON.stringify(available_dates) : null, userId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('更新帮溜员资料失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有帮溜员列表
   * @param {Object} options - 查询选项
   * @param {number} options.offset - 偏移量
   * @param {number} options.limit - 限制数量
   * @param {string} options.service_type - 服务类型
   * @param {string} options.sort - 排序方式
   * @returns {Promise<Object>} 帮溜员列表和总数
   */
  static async findAll(options = {}) {
    try {
      const { offset = 0, limit = 10, service_type, sort } = options;
      
      // 构建基础查询
      let query = `
        SELECT 
          sp.user_id, 
          sp.bio, 
          sp.service_area, 
          sp.rating, 
          sp.total_services_completed,
          u.nickname, 
          u.avatar_url
        FROM sitter_profiles sp
        JOIN users u ON sp.user_id = u.id
        WHERE u.role = 'sitter' AND u.status = 'active'
      `;
      
      // 构建计数查询
      let countQuery = `
        SELECT COUNT(*) as total
        FROM sitter_profiles sp
        JOIN users u ON sp.user_id = u.id
        WHERE u.role = 'sitter' AND u.status = 'active'
      `;
      
      // 参数数组
      const queryParams = [];
      const countParams = [];
      
      // 如果指定了服务类型，添加服务类型筛选
      if (service_type) {
        query += `
          AND sp.user_id IN (
            SELECT sitter_user_id FROM sitter_services
            WHERE service_type = ?
          )
        `;
        countQuery += `
          AND sp.user_id IN (
            SELECT sitter_user_id FROM sitter_services
            WHERE service_type = ?
          )
        `;
        queryParams.push(service_type);
        countParams.push(service_type);
      }
      
      // 添加排序
      if (sort === 'rating') {
        query += ` ORDER BY sp.rating DESC`;
      } else if (sort === 'orders') {
        query += ` ORDER BY sp.total_services_completed DESC`;
      } else {
        query += ` ORDER BY sp.rating DESC, sp.total_services_completed DESC`;
      }
      
      // 添加分页
      query += ` LIMIT ? OFFSET ?`;
      queryParams.push(limit, offset);
      
      // 执行查询
      const [rows] = await pool.query(query, queryParams);
      const [countResult] = await pool.query(countQuery, countParams);
      
      return {
        sitters: rows,
        total: countResult[0].total
      };
    } catch (error) {
      console.error('查询帮溜员列表失败:', error);
      throw error;
    }
  }
}

module.exports = SitterProfile; 