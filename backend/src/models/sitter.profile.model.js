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
        `SELECT sp.*, u.nickname, u.avatar_url, 
                v.type as verification_type, v.submitted_data as verification_data
         FROM sitter_profiles sp
         JOIN users u ON sp.user_id = u.id
         LEFT JOIN verifications v ON u.id = v.user_id AND v.status = 'approved'
         WHERE sp.user_id = ?`,
        [userId]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      const profile = rows[0];
      
      // 确保 cancel_count 是数字类型
      if (profile.cancel_count === null || profile.cancel_count === undefined) {
        profile.cancel_count = 0;
      } else {
        profile.cancel_count = parseInt(profile.cancel_count);
        if (isNaN(profile.cancel_count)) profile.cancel_count = 0;
      }
      
      console.log('帮溜员资料中的取消次数:', profile.cancel_count, '类型:', typeof profile.cancel_count);
      
      // 处理证书信息
      if (profile.verification_type === 'certificate' && profile.verification_data) {
        try {
          // 检查verification_data是否已经是对象
          const verificationData = typeof profile.verification_data === 'object' ? 
            profile.verification_data : JSON.parse(profile.verification_data);
          
          profile.certificate_type = verificationData.certificate_type || null;
          profile.has_certificate = true;
          
          // 如果有证书名称，也添加到返回数据中
          if (verificationData.certificate_name) {
            profile.certificate_name = verificationData.certificate_name;
          }
        } catch (e) {
          console.error('解析证书数据失败:', e);
          profile.has_certificate = false;
        }
      } else {
        profile.has_certificate = false;
      }
      
      // 删除原始验证数据，减少传输量
      delete profile.verification_data;
      delete profile.verification_type;
      
      return profile;
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
   * 更新帮溜员的评分和完成服务数量
   * @param {number} sitterId - 帮溜员用户ID
   * @param {number} rating - 新的评分
   * @returns {Promise<boolean>} 是否更新成功
   */
  static async updateRatingAndServices(sitterId, rating) {
    try {
      // 获取帮溜员当前的评分和服务数量
      const [currentData] = await pool.query(
        `SELECT rating, total_services_completed 
         FROM sitter_profiles 
         WHERE user_id = ?`,
        [sitterId]
      );
      
      if (currentData.length === 0) {
        return false; // 帮溜员资料不存在
      }
      
      const current = currentData[0];
      const currentRating = current.rating || 5.0; // 默认5.0
      const currentServices = current.total_services_completed || 0;
      
      // 计算新的平均评分
      // 新平均分 = (旧平均分 * 旧服务数 + 新评分) / (旧服务数 + 1)
      const newServices = currentServices + 1;
      const newRating = ((currentRating * currentServices) + rating) / newServices;
      
      // 更新帮溜员资料
      const [result] = await pool.query(
        `UPDATE sitter_profiles
         SET rating = ?, total_services_completed = ?, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [newRating, newServices, sitterId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('更新帮溜员评分和服务数量失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有帮溜员列表
   * @param {Object} options - 查询选项
   * @param {number} options.offset - 偏移量
   * @param {number} options.limit - 限制数量
   * @param {string} options.service_type - 服务类型
   * @param {string} options.district - 区域名称
   * @param {string} options.sort - 排序方式
   * @returns {Promise<Object>} 帮溜员列表和总数
   */
  static async findAll(options = {}) {
    try {
      const { offset = 0, limit = 10, service_type, district, sort } = options;
      
      // 构建基础查询
      let query = `
        SELECT 
          sp.user_id, 
          sp.bio, 
          sp.service_area, 
          sp.rating, 
          sp.total_services_completed,
          u.nickname, 
          u.avatar_url,
          v.type as verification_type,
          v.submitted_data as verification_data
        FROM sitter_profiles sp
        JOIN users u ON sp.user_id = u.id
        LEFT JOIN verifications v ON u.id = v.user_id AND v.status = 'approved'
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
      
      // 如果指定了区域，添加区域筛选（模糊匹配）
      if (district) {
        query += `
          AND sp.service_area LIKE ?
        `;
        countQuery += `
          AND sp.service_area LIKE ?
        `;
        queryParams.push(`%${district}%`);
        countParams.push(`%${district}%`);
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
      
      // 处理认证数据
      const sitters = rows.map(row => {
        const sitter = { ...row };
        
        // 解析证书信息
        if (sitter.verification_type === 'certificate' && sitter.verification_data) {
          try {
            // 检查verification_data是否已经是对象
            const verificationData = typeof sitter.verification_data === 'object' ? 
              sitter.verification_data : JSON.parse(sitter.verification_data);
            
            sitter.certificate_type = verificationData.certificate_type || null;
            sitter.has_certificate = true;
            
            // 如果有证书名称，也添加到返回数据中
            if (verificationData.certificate_name) {
              sitter.certificate_name = verificationData.certificate_name;
            }
          } catch (e) {
            console.error('解析证书数据失败:', e);
            sitter.has_certificate = false;
          }
        } else {
          sitter.has_certificate = false;
        }
        
        // 删除原始验证数据，减少传输量
        delete sitter.verification_data;
        delete sitter.verification_type;
        
        return sitter;
      });
      
      return {
        sitters: sitters,
        total: countResult[0].total
      };
    } catch (error) {
      console.error('查询帮溜员列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取帮溜员的评价列表
   * @param {number} sitterId - 帮溜员用户ID
   * @param {number} offset - 分页偏移量
   * @param {number} limit - 每页数量
   * @returns {Promise<{reviews: Array, total: number}>} 评价列表和总数
   */
  static async getReviews(sitterId, offset = 0, limit = 10) {
    try {
      // 获取总评价数
      const [totalRows] = await pool.query(
        `SELECT COUNT(*) as total
         FROM reviews r
         JOIN orders o ON r.order_id = o.id
         WHERE o.sitter_user_id = ? AND r.reviewer_user_id = o.owner_user_id`,
        [sitterId]
      );
      
      const total = totalRows[0].total || 0;
      
      // 如果没有评价，直接返回空数组
      if (total === 0) {
        return { reviews: [], total: 0 };
      }
      
      // 获取评价列表
      const [reviewRows] = await pool.query(
        `SELECT 
           r.id, r.order_id as orderId, r.rating, r.comment, r.tags,
           r.is_anonymous as isAnonymous, r.created_at as createdAt,
           CASE 
             WHEN r.is_anonymous = 1 THEN '匿名用户'
             ELSE u.nickname
           END as reviewerName,
           CASE
             WHEN r.is_anonymous = 1 THEN NULL
             ELSE u.avatar_url
           END as reviewerAvatar,
           o.service_type as serviceType
         FROM reviews r
         JOIN orders o ON r.order_id = o.id
         JOIN users u ON r.reviewer_user_id = u.id
         WHERE o.sitter_user_id = ? AND r.reviewer_user_id = o.owner_user_id
         ORDER BY r.created_at DESC
         LIMIT ? OFFSET ?`,
        [sitterId, limit, offset]
      );
      
      // 处理评价数据
      const reviews = reviewRows.map(review => {
        // 处理标签数据
        let tags = [];
        if (review.tags) {
          try {
            // 检查是否已经是数组
            if (Array.isArray(review.tags)) {
              tags = review.tags;
            } else {
              // 尝试解析JSON字符串
              tags = JSON.parse(review.tags);
            }
          } catch (e) {
            console.error('解析评价标签失败:', e);
          }
        }
        
        // 格式化时间
        let createdAt = review.createdAt;
        if (createdAt instanceof Date) {
          createdAt = createdAt.toISOString();
        }
        
        return {
          ...review,
          tags,
          createdAt
        };
      });
      
      return { reviews, total };
    } catch (error) {
      console.error('获取帮溜员评价列表失败:', error);
      throw error;
    }
  }
}

module.exports = SitterProfile; 