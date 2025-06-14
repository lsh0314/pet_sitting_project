const pool = require('../config/database');

/**
 * 帮溜员服务模型 - 处理与sitter_services表的交互
 */
class SitterService {
  /**
   * 根据用户ID查找帮溜员服务
   * @param {number} userId - 用户ID
   * @returns {Promise<Array>} 帮溜员服务数组
   */
  static async findByUserId(userId) {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM sitter_services WHERE sitter_user_id = ?`,
        [userId]
      );
      
      return rows;
    } catch (error) {
      console.error('查询帮溜员服务失败:', error);
      throw error;
    }
  }

  /**
   * 创建帮溜员服务
   * @param {number} userId - 用户ID
   * @param {Object} serviceData - 服务数据
   * @returns {Promise<boolean>} 是否创建成功
   */
  static async create(userId, serviceData) {
    try {
      const { service_type, price } = serviceData;
      
      const [result] = await pool.query(
        `INSERT INTO sitter_services (sitter_user_id, service_type, price)
         VALUES (?, ?, ?)`,
        [userId, service_type, price]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('创建帮溜员服务失败:', error);
      throw error;
    }
  }

  /**
   * 更新帮溜员服务
   * @param {number} id - 服务ID
   * @param {Object} serviceData - 服务数据
   * @returns {Promise<boolean>} 是否更新成功
   */
  static async update(id, serviceData) {
    try {
      const { price } = serviceData;
      
      const [result] = await pool.query(
        `UPDATE sitter_services SET price = ? WHERE id = ?`,
        [price, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('更新帮溜员服务失败:', error);
      throw error;
    }
  }

  /**
   * 删除帮溜员的所有服务
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  static async deleteByUserId(userId) {
    try {
      const [result] = await pool.query(
        `DELETE FROM sitter_services WHERE sitter_user_id = ?`,
        [userId]
      );
      
      return true;
    } catch (error) {
      console.error('删除帮溜员服务失败:', error);
      throw error;
    }
  }
}

module.exports = SitterService; 