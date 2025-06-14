const db = require('../config/database');

/**
 * 订单模型 - 负责与orders表交互
 */
class Order {
  /**
   * 创建新订单
   * @param {Object} orderData - 订单信息
   * @returns {Promise<number>} - 返回新创建的订单ID
   */
  static async create(orderData) {
    try {
      const [result] = await db.execute(
        `INSERT INTO orders (
          owner_user_id, sitter_user_id, pet_id, status, service_type,
          service_date, start_time, end_time, address, remarks, price, commission_rate
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderData.ownerUserId,
          orderData.sitterUserId,
          orderData.petId,
          orderData.status || 'pending',
          orderData.serviceType,
          orderData.serviceDate,
          orderData.startTime,
          orderData.endTime,
          orderData.address,
          orderData.remarks || null,
          orderData.price,
          orderData.commissionRate || 0.1
        ]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('创建订单失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取订单详情
   * @param {number} orderId - 订单ID
   * @returns {Promise<Object|null>} - 返回订单详情或null
   */
  static async findById(orderId) {
    try {
      const [rows] = await db.execute(
        `SELECT 
          o.id, o.owner_user_id as ownerUserId, o.sitter_user_id as sitterUserId,
          o.pet_id as petId, o.status, o.service_type as serviceType,
          o.service_date as serviceDate, o.start_time as startTime, 
          o.end_time as endTime, o.address, o.remarks, o.price,
          o.commission_rate as commissionRate, o.created_at as createdAt,
          o.updated_at as updatedAt,
          u1.nickname as ownerNickname, u1.avatar_url as ownerAvatar,
          u2.nickname as sitterNickname, u2.avatar_url as sitterAvatar,
          p.name as petName, p.photo_url as petPhoto
        FROM orders o
        JOIN users u1 ON o.owner_user_id = u1.id
        LEFT JOIN users u2 ON o.sitter_user_id = u2.id
        JOIN pets p ON o.pet_id = p.id
        WHERE o.id = ?`,
        [orderId]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      return rows[0];
    } catch (error) {
      console.error('获取订单详情失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户的订单列表（根据角色）
   * @param {number} userId - 用户ID
   * @param {string} role - 用户角色 ('pet_owner' 或 'sitter')
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} - 返回订单列表
   */
  static async findByUser(userId, role, options = {}) {
    try {
      const { status, page = 1, limit = 10 } = options;
      const offset = (page - 1) * limit;
      
      let whereClause = role === 'pet_owner' 
        ? 'o.owner_user_id = ?' 
        : 'o.sitter_user_id = ?';
        
      if (status) {
        whereClause += ' AND o.status = ?';
      }
      
      const queryParams = [userId];
      if (status) queryParams.push(status);
      
      // 添加分页参数
      queryParams.push(limit, offset);
      
      const [rows] = await db.execute(
        `SELECT 
          o.id, o.status, o.service_type as serviceType,
          o.service_date as serviceDate, o.price,
          o.created_at as createdAt, o.updated_at as updatedAt,
          u1.nickname as ownerNickname, u1.avatar_url as ownerAvatar,
          u2.nickname as sitterNickname, u2.avatar_url as sitterAvatar,
          p.name as petName, p.photo_url as petPhoto
        FROM orders o
        JOIN users u1 ON o.owner_user_id = u1.id
        LEFT JOIN users u2 ON o.sitter_user_id = u2.id
        JOIN pets p ON o.pet_id = p.id
        WHERE ${whereClause}
        ORDER BY o.created_at DESC
        LIMIT ? OFFSET ?`,
        queryParams
      );
      
      // 获取总数
      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM orders o WHERE ${whereClause}`,
        status ? [userId, status] : [userId]
      );
      
      return {
        orders: rows,
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult[0].total / limit)
      };
    } catch (error) {
      console.error('获取用户订单列表失败:', error);
      throw error;
    }
  }

  /**
   * 更新订单状态
   * @param {number} orderId - 订单ID
   * @param {string} status - 新状态
   * @returns {Promise<boolean>} - 更新是否成功
   */
  static async updateStatus(orderId, status) {
    try {
      const [result] = await db.execute(
        'UPDATE orders SET status = ? WHERE id = ?',
        [status, orderId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('更新订单状态失败:', error);
      throw error;
    }
  }

  /**
   * 检查订单是否属于指定用户
   * @param {number} orderId - 订单ID
   * @param {number} userId - 用户ID
   * @param {string} role - 用户角色 ('pet_owner' 或 'sitter')
   * @returns {Promise<boolean>} - 是否属于该用户
   */
  static async belongsToUser(orderId, userId, role) {
    try {
      const field = role === 'pet_owner' ? 'owner_user_id' : 'sitter_user_id';
      
      const [rows] = await db.execute(
        `SELECT 1 FROM orders WHERE id = ? AND ${field} = ?`,
        [orderId, userId]
      );
      
      return rows.length > 0;
    } catch (error) {
      console.error('检查订单所有权失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有订单（管理员用）
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} - 返回订单列表和分页信息
   */
  static async findAll(options = {}) {
    try {
      const { status, page = 1, limit = 10 } = options;
      const offset = (page - 1) * limit;
      
      let whereClause = '';
      const queryParams = [];
      
      if (status) {
        whereClause = 'WHERE o.status = ?';
        queryParams.push(status);
      }
      
      // 添加分页参数
      queryParams.push(limit, offset);
      
      const [rows] = await db.execute(
        `SELECT 
          o.id, o.owner_user_id as ownerUserId, o.sitter_user_id as sitterUserId,
          o.pet_id as petId, o.status, o.service_type as serviceType,
          o.service_date as serviceDate, o.price,
          o.created_at as createdAt, o.updated_at as updatedAt,
          u1.nickname as ownerNickname, u1.avatar_url as ownerAvatar,
          u2.nickname as sitterNickname, u2.avatar_url as sitterAvatar,
          p.name as petName
        FROM orders o
        JOIN users u1 ON o.owner_user_id = u1.id
        LEFT JOIN users u2 ON o.sitter_user_id = u2.id
        JOIN pets p ON o.pet_id = p.id
        ${whereClause}
        ORDER BY o.created_at DESC
        LIMIT ? OFFSET ?`,
        queryParams
      );
      
      // 获取总数
      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM orders o ${whereClause}`,
        status ? [status] : []
      );
      
      return {
        orders: rows,
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult[0].total / limit)
      };
    } catch (error) {
      console.error('获取所有订单失败:', error);
      throw error;
    }
  }
}

module.exports = Order; 