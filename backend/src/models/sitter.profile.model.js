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
   * @returns {Promise<Array>} 帮溜员列表
   */
  static async findAll() {
    try {
      const [rows] = await pool.query(
        `SELECT sp.*, u.nickname, u.avatar_url
         FROM sitter_profiles sp
         JOIN users u ON sp.user_id = u.id
         ORDER BY sp.rating DESC, sp.total_services_completed DESC`
      );
      
      return rows;
    } catch (error) {
      console.error('查询帮溜员列表失败:', error);
      throw error;
    }
  }
}

module.exports = SitterProfile; 