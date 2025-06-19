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
          service_date, start_time, end_time, address, remarks, price, commission_rate, location_coords
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          orderData.commissionRate || 0.1,
          orderData.locationCoords || null
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
          o.updated_at as updatedAt, o.location_coords as locationCoords,
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
      // 确保userId是数字
      userId = Number(userId);
      
      // 解构并处理分页参数，确保是数字类型
      const page = Number(options.page || 1);
      const limit = Number(options.limit || 10);
      const offset = (page - 1) * limit;
      
      // 处理状态参数
      let { status } = options;
      
      // 如果状态参数是'ongoing'，则在SQL查询中使用'ongoing'
      // 注意：这里确保前端和后端使用相同的状态名称
      
      // 构建查询SQL
      let sql = '';
      let countSql = '';
      
      // 对于待支付状态(accepted)的订单，无论角色如何，都应该查询用户作为宠物主的订单
      // 因为支付是宠物主的责任
      if (status === 'accepted') {
        sql = `SELECT 
            o.id, o.status, o.service_type as serviceType,
            o.service_date as serviceDate, o.start_time as startTime,
            o.end_time as endTime, o.address, o.price,
            o.created_at as createdAt, o.updated_at as updatedAt,
            u1.nickname as ownerNickname, u1.avatar_url as ownerAvatar,
            u2.nickname as sitterNickname, u2.avatar_url as sitterAvatar,
            p.name as petName, p.photo_url as petPhoto
          FROM orders o
          JOIN users u1 ON o.owner_user_id = u1.id
          LEFT JOIN users u2 ON o.sitter_user_id = u2.id
          JOIN pets p ON o.pet_id = p.id
          WHERE o.owner_user_id = ${userId} AND o.status = '${status}'
          ORDER BY o.created_at DESC
          LIMIT ${limit} OFFSET ${offset}`;
          
        countSql = `SELECT COUNT(*) as total 
          FROM orders o 
          WHERE o.owner_user_id = ${userId} AND o.status = '${status}'`;
      }
      // 对于其他状态的订单，根据用户角色查询
      else {
        const whereClause = role === 'pet_owner' 
          ? `o.owner_user_id = ${userId}` 
          : `o.sitter_user_id = ${userId}`;
          
        sql = `SELECT 
            o.id, o.status, o.service_type as serviceType,
            o.service_date as serviceDate, o.start_time as startTime,
            o.end_time as endTime, o.address, o.price,
            o.created_at as createdAt, o.updated_at as updatedAt,
            u1.nickname as ownerNickname, u1.avatar_url as ownerAvatar,
            u2.nickname as sitterNickname, u2.avatar_url as sitterAvatar,
            p.name as petName, p.photo_url as petPhoto
          FROM orders o
          JOIN users u1 ON o.owner_user_id = u1.id
          LEFT JOIN users u2 ON o.sitter_user_id = u2.id
          JOIN pets p ON o.pet_id = p.id
          WHERE ${whereClause} ${status ? `AND o.status = '${status}'` : ''}
          ORDER BY o.created_at DESC
          LIMIT ${limit} OFFSET ${offset}`;
          
        countSql = `SELECT COUNT(*) as total 
          FROM orders o 
          WHERE ${whereClause} ${status ? `AND o.status = '${status}'` : ''}`;
      }
      
      // 执行查询
      const [rows] = await db.query(sql);
      const [countResult] = await db.query(countSql);
      
      return {
        orders: rows,
        total: countResult[0].total,
        page: page,
        limit: limit,
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
   * 开始服务
   * @param {number} orderId - 订单ID
   * @param {Object} reportData - 服务报告数据
   * @param {Object} locationData - 位置数据（可选）
   * @returns {Promise<boolean>} - 是否成功
   */
  static async startService(orderId, reportData, locationData = null) {
    const connection = await db.getConnection();
    
    try {
      // 开始事务
      await connection.beginTransaction();
      
      // 更新订单状态为服务中
      const [updateResult] = await connection.execute(
        'UPDATE orders SET status = ? WHERE id = ? AND status = ?',
        ['ongoing', orderId, 'paid']
      );
      
      if (updateResult.affectedRows === 0) {
        await connection.rollback();
        return false;
      }
      
      // 创建服务开始报告
      const [reportResult] = await connection.execute(
        `INSERT INTO order_reports (
          order_id, text, image_urls, video_url
        ) VALUES (?, ?, ?, ?)`,
        [
          orderId,
          reportData.text,
          reportData.imageUrls,
          reportData.videoUrl
        ]
      );
      
      // 如果有位置数据，保存位置信息
      if (locationData) {
        await connection.execute(
          `INSERT INTO order_tracks (
            order_id, latitude, longitude, address, distance, type
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            locationData.latitude,
            locationData.longitude,
            locationData.address || null,
            locationData.distance || null,
            locationData.type || 'start'
          ]
        );
      }
      
      // 提交事务
      await connection.commit();
      
      return true;
    } catch (error) {
      // 回滚事务
      await connection.rollback();
      console.error('开始服务失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 完成服务
   * @param {number} orderId - 订单ID
   * @param {Object} reportData - 服务报告数据
   * @param {Object} locationData - 位置数据（可选）
   * @returns {Promise<boolean>} - 是否成功
   */
  static async completeService(orderId, reportData, locationData = null) {
    const connection = await db.getConnection();
    
    try {
      // 开始事务
      await connection.beginTransaction();
      
      // 更新订单状态为已完成
      const [updateResult] = await connection.execute(
        'UPDATE orders SET status = ? WHERE id = ? AND status = ?',
        ['completed', orderId, 'ongoing']
      );
      
      if (updateResult.affectedRows === 0) {
        await connection.rollback();
        return false;
      }
      
      // 创建服务完成报告
      const [reportResult] = await connection.execute(
        `INSERT INTO order_reports (
          order_id, text, image_urls, video_url
        ) VALUES (?, ?, ?, ?)`,
        [
          orderId,
          reportData.text,
          reportData.imageUrls,
          reportData.videoUrl
        ]
      );
      
      // 如果有位置数据，保存位置信息
      if (locationData) {
        await connection.execute(
          `INSERT INTO order_tracks (
            order_id, latitude, longitude, address, distance, type
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            locationData.latitude,
            locationData.longitude,
            locationData.address || null,
            locationData.distance || null,
            locationData.type || 'end'
          ]
        );
      }
      
      // 更新帮溜员完成服务次数
      const [orderInfo] = await connection.execute(
        'SELECT sitter_user_id FROM orders WHERE id = ?',
        [orderId]
      );
      
      if (orderInfo.length > 0) {
        const sitterId = orderInfo[0].sitter_user_id;
        await connection.execute(
          `UPDATE sitter_profiles 
           SET total_services_completed = total_services_completed + 1 
           WHERE user_id = ?`,
          [sitterId]
        );
      }
      
      // 提交事务
      await connection.commit();
      
      return true;
    } catch (error) {
      // 回滚事务
      await connection.rollback();
      console.error('完成服务失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 添加服务报告
   * @param {Object} reportData - 服务报告数据
   * @returns {Promise<number|boolean>} - 返回报告ID或false
   */
  static async addReport(reportData) {
    try {
      const [result] = await db.execute(
        `INSERT INTO order_reports (
          order_id, text, image_urls, video_url
        ) VALUES (?, ?, ?, ?)`,
        [
          reportData.orderId,
          reportData.text || '',
          reportData.imageUrls,
          reportData.videoUrl
        ]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('添加服务报告失败:', error);
      throw error;
    }
  }

  /**
   * 添加轨迹点
   * @param {Object} trackData - 轨迹点数据
   * @returns {Promise<number|boolean>} - 返回轨迹点ID或false
   */
  static async addTrackPoint(trackData) {
    try {
      const [result] = await db.execute(
        `INSERT INTO order_tracks (
          order_id, latitude, longitude, address, distance, type
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          trackData.orderId,
          trackData.latitude,
          trackData.longitude,
          trackData.address || null,
          trackData.distance || null,
          trackData.type || 'track'
        ]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('添加轨迹点失败:', error);
      throw error;
    }
  }

  /**
   * 获取订单轨迹点列表
   * @param {number} orderId - 订单ID
   * @returns {Promise<Array>} - 返回轨迹点列表
   */
  static async getTrackPoints(orderId) {
    try {
      const [rows] = await db.execute(
        `SELECT 
          id, latitude, longitude, address, distance, type,
          created_at as timestamp
        FROM order_tracks
        WHERE order_id = ?
        ORDER BY created_at ASC`,
        [orderId]
      );
      
      return rows;
    } catch (error) {
      console.error('获取轨迹点列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取订单服务报告列表
   * @param {number} orderId - 订单ID
   * @returns {Promise<Array>} - 返回服务报告列表
   */
  static async getReports(orderId) {
    try {
      console.log(`获取订单 ${orderId} 的服务报告`);
      
      const [rows] = await db.execute(
        `SELECT 
          id, text, image_urls as imageUrls, video_url as videoUrl,
          created_at as timestamp
        FROM order_reports
        WHERE order_id = ?
        ORDER BY created_at ASC`,
        [orderId]
      );
      
      console.log('数据库查询结果:', JSON.stringify(rows));
      
      // 解析图片URL数组
      const reports = rows.map(report => {
        console.log(`处理报告 ID ${report.id}, imageUrls 原始值:`, report.imageUrls);
        
        if (report.imageUrls) {
          try {
            // 检查是否已经是数组
            if (Array.isArray(report.imageUrls)) {
              console.log('imageUrls 已经是数组:', report.imageUrls);
            } else {
              // 尝试解析 JSON 字符串
              report.imageUrls = JSON.parse(report.imageUrls);
              console.log('解析后的 imageUrls:', report.imageUrls);
            }
          } catch (e) {
            console.error('解析 imageUrls 失败:', e);
            report.imageUrls = [];
          }
        } else {
          console.log('imageUrls 为空，设置为空数组');
          report.imageUrls = [];
        }
        
        return report;
      });
      
      console.log('处理后的服务报告:', JSON.stringify(reports));
      return reports;
    } catch (error) {
      console.error('获取服务报告列表失败:', error);
      throw error;
    }
  }

  /**
   * 确认服务完成
   * @param {number} orderId - 订单ID
   * @returns {Promise<boolean>} - 是否成功
   */
  static async confirmService(orderId) {
    const connection = await db.getConnection();
    
    try {
      // 开始事务
      await connection.beginTransaction();
      
      // 更新订单状态为已确认
      const [updateResult] = await connection.execute(
        'UPDATE orders SET status = ? WHERE id = ? AND status = ?',
        ['confirmed', orderId, 'completed']
      );
      
      if (updateResult.affectedRows === 0) {
        await connection.rollback();
        return false;
      }
      
      // 获取订单信息
      const [orderInfo] = await connection.execute(
        'SELECT price, commission_rate, sitter_user_id FROM orders WHERE id = ?',
        [orderId]
      );
      
      if (orderInfo.length === 0) {
        await connection.rollback();
        return false;
      }
      
      const order = orderInfo[0];
      
      // 计算帮溜员实际收入（订单金额 - 平台佣金）
      const commissionAmount = order.price * order.commission_rate;
      const sitterIncome = order.price - commissionAmount;
      
      // TODO: 在未来的迭代中，这里可以添加将钱转入帮溜员钱包的逻辑
      
      // 提交事务
      await connection.commit();
      return true;
    } catch (error) {
      // 回滚事务
      await connection.rollback();
      console.error('确认服务完成失败:', error);
      throw error;
    } finally {
      // 释放连接
      connection.release();
    }
  }

  /**
   * 添加订单评价
   * @param {Object} reviewData - 评价数据
   * @returns {Promise<number|boolean>} - 返回评价ID或false
   */
  static async addReview(reviewData) {
    try {
      // 检查是否已经评价过
      const [existingReview] = await db.execute(
        `SELECT id FROM reviews 
         WHERE order_id = ? AND reviewer_user_id = ?`,
        [reviewData.orderId, reviewData.reviewerUserId]
      );
      
      if (existingReview.length > 0) {
        return false; // 已经评价过
      }
      
      // 插入评价
      const [result] = await db.execute(
        `INSERT INTO reviews (
          order_id, reviewer_user_id, reviewee_user_id, 
          rating, comment, tags, is_anonymous
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          reviewData.orderId,
          reviewData.reviewerUserId,
          reviewData.revieweeUserId,
          reviewData.rating,
          reviewData.comment || null,
          reviewData.tags ? JSON.stringify(reviewData.tags) : null,
          reviewData.isAnonymous || false
        ]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('添加评价失败:', error);
      throw error;
    }
  }
  
    /**
     * 导出订单数据（管理员用）
     * @param {Object} options - 查询选项
     * @returns {Promise<Array>} - 返回所有符合条件的订单
     */
    static async exportData(options) {
      try {
        const {
          orderId,
          username,
          serviceType,
          status,
          startDate,
          endDate
        } = options;
  
        let whereClause = 'WHERE 1=1';
        const params = [];
  
        // 构建WHERE子句
        if (orderId) {
          whereClause += ' AND o.id = ?';
          params.push(orderId);
        }
        
        if (username) {
          whereClause += ' AND (owner.nickname LIKE ? OR sitter.nickname LIKE ?)';
  
          params.push(`%${username}%`, `%${username}%`);
        }
        
        if (serviceType) {
          whereClause += ' AND o.service_type = ?';
          params.push(serviceType);
        }
        
        if (status) {
          whereClause += ' AND o.status = ?';
          params.push(status);
        }
        
        if (startDate) {
          whereClause += ' AND DATE(o.created_at) >= ?';
          params.push(startDate);
        }
        
        if (endDate) {
          whereClause += ' AND DATE(o.created_at) <= ?';
          params.push(endDate);
        }
  
        // 查询订单数据
        const [rows] = await db.execute(
          `SELECT 
            o.id,
            owner.nickname as username,
            p.name as pet_name,
            o.service_type,
            o.service_date,
            o.start_time,
            o.end_time,
            o.address,
            o.price,
            o.status,
            o.created_at
           FROM orders o
           LEFT JOIN users owner ON o.owner_user_id = owner.id
           LEFT JOIN pets p ON o.pet_id = p.id
           ${whereClause}
           ORDER BY o.created_at DESC`,
          params
        );
  
        return rows.map(row => ({
          ...row,
          price: parseFloat(row.price)
        }));
      } catch (error) {
        console.error('导出订单数据失败:', error);
        throw error;
      }
    }
  
  /**
   * 更新订单状态（管理员用）
   * @param {number} orderId - 订单ID
   * @param {string} status - 新状态
   * @param {number} adminId - 管理员ID
   * @returns {Promise<boolean>} - 是否更新成功
   */
  static async updateStatusAdmin(orderId, status, adminId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 更新订单状态
      const [result] = await connection.execute(
        'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, orderId]
      );

      // 记录状态变更
      await connection.execute(
        `INSERT INTO order_activities (
          order_id, user_id, action, description
        ) VALUES (?, ?, ?, ?)`,
        [
          orderId,
          adminId,
          'status_change',
          `管理员将订单状态更改为: ${status}`
        ]
      );

      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      console.error('更新订单状态失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 获取所有订单列表（管理员用）
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} - 返回订单列表和分页信息
   */
  static async findAll(options) {
    try {
      const {
        page = 1,
        limit = 10,
        orderId,
        username,
        serviceType,
        status,
        startDate,
        endDate
      } = options;

      let whereClause = 'WHERE 1=1';
      const params = [];

      // 构建WHERE子句
      if (orderId) {
        whereClause += ' AND o.id = ?';
        params.push(orderId);
      }
      
      if (username) {
        whereClause += ' AND (owner.nickname LIKE ? OR sitter.nickname LIKE ?)';

        params.push(`%${username}%`, `%${username}%`);
      }
      
      if (serviceType) {
        whereClause += ' AND o.service_type = ?';
        params.push(serviceType);
      }
      
      if (status) {
        whereClause += ' AND o.status = ?';
        params.push(status);
      }
      
      if (startDate) {
        whereClause += ' AND DATE(o.created_at) >= ?';
        params.push(startDate);
      }
      
      if (endDate) {
        whereClause += ' AND DATE(o.created_at) <= ?';
        params.push(endDate);
      }

      // 统计总数
      const [countRows] = await db.execute(
        `SELECT COUNT(*) as total
         FROM orders o
         LEFT JOIN users owner ON o.owner_user_id = owner.id
         LEFT JOIN users sitter ON o.sitter_user_id = sitter.id
         ${whereClause}`,
        params
      );

      const total = countRows[0].total;

      // 如果没有数据，直接返回空结果
      if (total === 0) {
        return { rows: [], total: 0 };
      }      // 计算分页参数
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
      const offsetNum = (pageNum - 1) * limitNum;

      // 查询订单列表 - 分页参数直接拼接，避免参数绑定问题
      const [rows] = await db.execute(
        `SELECT 
          o.*,
          owner.nickname as owner_nickname,
          owner.avatar_url as owner_avatar,
          sitter.nickname as sitter_nickname,
          sitter.avatar_url as sitter_avatar,
          p.name as pet_name,
          p.photo_url as pet_photo
         FROM orders o
         LEFT JOIN users owner ON o.owner_user_id = owner.id
         LEFT JOIN users sitter ON o.sitter_user_id = sitter.id
         LEFT JOIN pets p ON o.pet_id = p.id
         ${whereClause}
         ORDER BY o.created_at DESC
         LIMIT ${limitNum} OFFSET ${offsetNum}`,
        params
      );

      return { rows, total };
    } catch (error) {
      console.error('获取订单列表失败:', error);
      throw error;
    }
  }
}
module.exports = Order; 