const pool = require('../config/database');

class Review {
  /**
   * 获取评价列表
   */
  static async find({ page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(`
      SELECT r.id, r.rating, r.comment, r.created_at,
        ru.nickname AS reviewer_nickname, ru.avatar_url AS reviewer_avatar,
        reu.nickname AS reviewee_nickname, reu.avatar_url AS reviewee_avatar,
        o.id AS order_no
      FROM reviews r
      LEFT JOIN users ru ON r.reviewer_user_id = ru.id
      LEFT JOIN users reu ON r.reviewee_user_id = reu.id
      LEFT JOIN orders o ON r.order_id = o.id
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);
    
    const [count] = await pool.query('SELECT COUNT(*) AS total FROM reviews');
    
    const formattedRows = rows.map(row => ({
      ...row,
      user: {
        nickname: row.reviewer_nickname,
        avatar_url: row.reviewer_avatar
      },
      sitter: {
        nickname: row.reviewee_nickname,
        avatar_url: row.reviewee_avatar
      },
      order: {
        order_no: row.order_no
      }
    }));
    
    return { data: formattedRows, total: count[0].total };
  }

   /**
   * 根据条件搜索评价
   * @param {object} options - 搜索选项
   * @param {string} [options.keyword] - 关键词 (搜索评价内容、用户昵称)
   * @param {number|string} [options.min_rating] - 最低评分
   * @param {number|string} [options.max_rating] - 最高评分
   * @param {number} [options.page=1] - 当前页码
   * @param {number} [options.limit=10] - 每页数量
   */
  static async search({ keyword, min_rating, max_rating, page = 1, limit = 10 }) {
    // 基础查询语句，连接了 reviews, users (评价者), sitters (帮溜员)
    const baseQuery = `
      SELECT
        r.id, r.comment, r.rating, r.created_at,
        ru.id AS user_id, ru.nickname AS user_nickname, ru.avatar_url AS user_avatar,
        reu.id AS sitter_id, reu.nickname AS sitter_nickname, reu.avatar_url AS sitter_avatar,
        o.id AS order_no
      FROM reviews r
      LEFT JOIN users ru ON r.reviewer_user_id = ru.id
      LEFT JOIN users reu ON r.reviewee_user_id = reu.id
      LEFT JOIN orders o ON r.order_id = o.id
    `;

    // 动态构建 WHERE 子句和参数
    const whereConditions = [];
    const queryParams = [];

    // 1. 用户名/评价内容筛选 (keyword)
    if (keyword && keyword.trim() !== '') {
      const searchTerm = `%${keyword.trim()}%`;
      // 同时搜索评价内容和用户昵称
      whereConditions.push('(r.comment LIKE ? OR ru.nickname LIKE ?)');
      queryParams.push(searchTerm, searchTerm);
    }

    // 2. 最小评分筛选
    if (min_rating !== undefined && min_rating !== '' && !isNaN(min_rating)) {
      whereConditions.push('r.rating >= ?');
      queryParams.push(Number(min_rating));
      console.log('应用最小评分条件:', Number(min_rating)); // 你想看的日志
    }

    // 3. 最大评分筛选
    if (max_rating !== undefined && max_rating !== '' && !isNaN(max_rating)) {
      whereConditions.push('r.rating <= ?');
      queryParams.push(Number(max_rating));
      console.log('应用最大评分条件:', Number(max_rating));
    }
    
    let whereClause = '';
    if (whereConditions.length > 0) {
      whereClause = 'WHERE ' + whereConditions.join(' AND ');
    }

    // 构建计算总数的查询
    const countQuery = `SELECT COUNT(r.id) as total FROM reviews r LEFT JOIN users ru ON r.reviewer_user_id = ru.id LEFT JOIN users reu ON r.reviewee_user_id = reu.id ${whereClause}`;
    const [totalResult] = await  pool.query(countQuery, queryParams);
    const total = totalResult[0].total;

    // 构建获取数据的查询，并添加排序和分页
    const offset = (Number(page) - 1) * Number(limit);
    const dataQuery = `${baseQuery} ${whereClause} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
    const finalQueryParams = [...queryParams, Number(limit), offset];

    const [data] = await  pool.query(dataQuery, finalQueryParams);
    
    // 格式化数据，例如将 user_id, user_nickname 组合成 user 对象
    const formattedData = data.map(row => ({
      id: row.id,
      comment: row.comment,
      rating: row.rating,
      created_at: row.created_at,
      user: {
        id: row.user_id,
        nickname: row.user_nickname,
        avatar_url: row.user_avatar,
      },
      sitter: {
        id: row.sitter_id,
        nickname: row.sitter_nickname,
        avatar_url: row.sitter_avatar,
      },
      order: {
        order_no: row.order_no,
      }
    }));


    return { data: formattedData, total };
  }

  /**
   * 根据ID获取评价详情
   */
  static async findById(id) {
    const [rows] = await pool.query(`
      SELECT r.id, r.rating, r.comment, r.created_at,
        ru.nickname AS reviewer_nickname, ru.avatar_url AS reviewer_avatar,
        reu.nickname AS reviewee_nickname, reu.avatar_url AS reviewee_avatar,
        o.id AS order_no, o.service_date
      FROM reviews r
      LEFT JOIN users ru ON r.reviewer_user_id = ru.id
      LEFT JOIN users reu ON r.reviewee_user_id = reu.id
      LEFT JOIN orders o ON r.order_id = o.id
      WHERE r.id = ?
    `, [id]);
    
    if (!rows[0]) return null;
    
    const row = rows[0];
    return {
      ...row,
      user: {
        nickname: row.reviewer_nickname,
        avatar_url: row.reviewer_avatar,
        id: row.reviewer_user_id
      },
      sitter: {
        nickname: row.reviewee_nickname,
        avatar_url: row.reviewee_avatar,
        id: row.reviewee_user_id
      },
      order: {
        order_no: row.order_no,
        service_date: row.service_date
      }
    };
  }

  /**
   * 删除评价
   */
  static async findByIdAndDelete(id) {
    const [result] = await pool.query('DELETE FROM reviews WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  /**
   * 更新评价回复
   */
  static async findByIdAndUpdate(id, update) {
    const [result] = await pool.query(
      'UPDATE reviews SET comment = ? WHERE id = ?',
      [update.comment, id]
    );
    if (result.affectedRows > 0) {
      return this.findById(id);
    }
    return null;
  }
}

module.exports = Review;
