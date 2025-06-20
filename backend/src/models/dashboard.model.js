const db = require('../config/database');
const Order = require('./order.model');
const User = require('./user.model');
const Payment = require('./payment.model');

/**
 * 仪表盘数据模型
 * 处理仪表盘相关数据统计和查询
 */
class DashboardModel {
  /**
   * 获取用户总数
   * @returns {Promise<number>} 用户总数
   */
  static async getTotalUsers() {
    try {
      const [rows] = await db.execute('SELECT COUNT(*) as count FROM users');
      return rows[0].count;
    } catch (error) {
      console.error('获取用户总数失败:', error);
      throw error;
    }
  }

  /**
   * 获取帮溜员总数
   * @returns {Promise<number>} 帮溜员总数
   */
  static async getTotalSitters() {
    try {
      const [rows] = await db.execute('SELECT COUNT(*) as count FROM users WHERE role = "sitter"');
      return rows[0].count;
    } catch (error) {
      console.error('获取帮溜员总数失败:', error);
      throw error;
    }
  }

  /**
   * 获取订单总数
   * @returns {Promise<number>} 订单总数
   */
  static async getTotalOrders() {
    try {
      const [rows] = await db.execute('SELECT COUNT(*) as count FROM orders');
      return rows[0].count;
    } catch (error) {
      console.error('获取订单总数失败:', error);
      throw error;
    }
  }

  /**
   * 获取总收入
   * @returns {Promise<number>} 总收入
   */
  static async getTotalRevenue() {
    try {
      const [rows] = await db.execute('SELECT SUM(amount) as total FROM payments WHERE status = "completed"');
      return rows[0].total || 0;
    } catch (error) {
      console.error('获取总收入失败:', error);
      throw error;
    }
  }

  /**
   * 获取最近订单
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 订单列表
   */
  static async getRecentOrders(limit = 10) {
    try {
      const numericLimit = Number(limit);
      const [rows] = await db.execute(
        `SELECT 
          o.id, o.status, o.service_type as serviceType,
          o.service_date as serviceDate, o.start_time as startTime,
          o.end_time as endTime, o.address, o.price,
          o.created_at as createdAt, o.updated_at as updatedAt,
          u.nickname as userNickname, u.avatar_url as userAvatar
        FROM orders o
        JOIN users u ON o.owner_user_id = u.id
        ORDER BY o.created_at DESC
        LIMIT ${numericLimit}`
      );
      return rows;
    } catch (error) {
      console.error('获取最近订单失败:', error);
      throw error;
    }
  }

  /**
   * 获取订单趋势数据
   * @param {number} days - 天数
   * @returns {Promise<Object>} 包含日期和数量的对象
   */
  static async getOrderTrend(days) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const [result] = await db.execute(
        `SELECT 
          DATE(created_at) as date, 
          COUNT(id) as count
        FROM orders
        WHERE created_at BETWEEN ? AND ?
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) ASC`,
        [startDate, endDate]
      );

      const dates = [];
      const counts = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const found = result.find(item => item.date === dateStr);
        
        dates.push(dateStr);
        counts.push(found ? parseInt(found.count) : 0);
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return { dates, counts };
    } catch (error) {
      console.error('获取订单趋势失败:', error);
      throw error;
    }
  }

  /**
   * 获取服务类型分布
   * @returns {Promise<Array>} 服务类型分布数据
   */
  static async getServiceDistribution() {
    try {
      const [result] = await db.execute(
        `SELECT 
          service_type as serviceType,
          COUNT(id) as count
        FROM orders
        GROUP BY service_type`
      );

      const serviceTypes = {
        walk: '遛狗',
        feed: '喂食',
        care: '寄养'
      };

      return result.map(item => ({
        name: serviceTypes[item.serviceType] || item.serviceType,
        value: parseInt(item.count)
      }));
    } catch (error) {
      console.error('获取服务分布失败:', error);
      throw error;
    }
  }
}

module.exports = DashboardModel;
