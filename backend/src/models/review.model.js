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
   * 搜索评价
   */
  static async search({ keyword, min_rating, max_rating, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT r.id, r.rating, r.comment, r.created_at,
        ru.nickname AS reviewer_nickname, ru.avatar_url AS reviewer_avatar,
        reu.nickname AS reviewee_nickname, reu.avatar_url AS reviewee_avatar,
        o.id AS order_no
      FROM reviews r
      LEFT JOIN users ru ON r.reviewer_user_id = ru.id
      LEFT JOIN users reu ON r.reviewee_user_id = reu.id
      LEFT JOIN orders o ON r.order_id = o.id
    `;
    
    const where = [];
    const params = [];
    
    if (keyword) {
      where.push('(r.comment LIKE ? OR ru.nickname LIKE ? OR reu.nickname LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (min_rating) {
      where.push('r.rating >= ?');
      params.push(min_rating);
    }
    if (max_rating) {
      where.push('r.rating <= ?');
      params.push(max_rating);
    }
    
    if (where.length) {
      query += ' WHERE ' + where.join(' AND ');
    }
    
    query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [rows] = await pool.query(query, params);
    const [count] = await pool.query(
      'SELECT COUNT(*) AS total FROM reviews r' + 
      (where.length ? ' WHERE ' + where.join(' AND ') : ''),
      params.slice(0, -2)
    );
    
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
