const db = require('../config/database');

class WithdrawalModel {
  static async create(withdrawalData) {
    const [result] = await db.execute(
      'INSERT INTO withdrawals (sitter_user_id, amount, method, status, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [withdrawalData.sitter_user_id, withdrawalData.amount, withdrawalData.method, withdrawalData.status || 'processing']
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await db.execute(
      'SELECT * FROM withdrawals WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async findBySitterId(sitterId) {
    const [rows] = await db.execute(
      'SELECT * FROM withdrawals WHERE sitter_user_id = ? ORDER BY created_at DESC',
      [sitterId]
    );
    return rows;
  }

  static async findAllWithUser({ page = 1, limit = 10, status, keyword }) {
    try {
      // 验证并转换参数
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.max(1, parseInt(limit));
      const offset = (pageNum - 1) * limitNum;
      
      let query = `
        SELECT w.*, u.nickname, u.avatar_url 
        FROM withdrawals w
        JOIN users u ON w.sitter_user_id = u.id
      `;
      const params = [];
      const where = [];
      
      if (status) {
        where.push('w.status = ?');
        params.push(status);
      }
      
      if (keyword) {
        const trimmedKeyword = keyword.trim();
        const isNumeric = /^\d+$/.test(trimmedKeyword);
        if (isNumeric) {
          where.push('(u.nickname LIKE ? OR u.id = ?)');

          params.push(`%${trimmedKeyword}%`, parseInt(trimmedKeyword));
        } else {
          where.push('u.nickname LIKE ?');
          params.push(`%${trimmedKeyword}%`);
        }
      }
      
      if (where.length) {
        query += ' WHERE ' + where.join(' AND ');
      }
      
      // 分页参数直接拼接到SQL中，避免参数绑定问题
      query += ` ORDER BY w.created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;
      
      const [rows] = await db.execute(query, params);
      return rows;
    } catch (error) {
      console.error('查询提现列表失败:', error);
      throw error;
    }
  }

  static async countAll({ status, keyword }) {
    let query = `
      SELECT COUNT(*) as total 
      FROM withdrawals w
      JOIN users u ON w.sitter_user_id = u.id
    `;
    const params = [];
    const where = [];
    
    if (status) {
      where.push('w.status = ?');
      params.push(status);
    }
    
    if (keyword) {
      where.push('(u.nickname LIKE ? OR u.id = ?)');
      params.push(`%${keyword}%`, keyword);
    }
    
    if (where.length) {
      query += ' WHERE ' + where.join(' AND ');
    }
    
    const [[result]] = await db.execute(query, params);
    return result.total;
  }

  static async updateStatus(id, status, adminId, comment = null) {
    const [result] = await db.execute(
      'UPDATE withdrawals SET status = ?, reviewed_by_admin_id = ?, admin_comment = ?, updated_at = NOW() WHERE id = ?',
      [status, adminId, comment, id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = WithdrawalModel;
