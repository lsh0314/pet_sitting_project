/**
 * 检查帮溜员取消次数
 */
const db = require('../config/database');

async function checkCancelCount(userId) {
  try {
    // 查询帮溜员取消次数
    const [rows] = await db.query(
      'SELECT sp.cancel_count, u.status FROM sitter_profiles sp JOIN users u ON sp.user_id = u.id WHERE sp.user_id = ?',
      [userId]
    );
    
    if (rows.length === 0) {
      console.log(`用户ID ${userId} 不是帮溜员或不存在`);
      return;
    }
    
    console.log(`用户ID ${userId} 的取消次数: ${rows[0].cancel_count}, 状态: ${rows[0].status}`);
    
    // 查询所有帮溜员的取消次数
    const [allRows] = await db.query(
      'SELECT sp.user_id, sp.cancel_count, u.status FROM sitter_profiles sp JOIN users u ON sp.user_id = u.id WHERE sp.cancel_count > 0'
    );
    
    console.log('\n所有有取消记录的帮溜员:');
    allRows.forEach(row => {
      console.log(`用户ID ${row.user_id}, 取消次数: ${row.cancel_count}, 状态: ${row.status}`);
    });
    
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    // 关闭数据库连接池
    await db.end();
  }
}

// 获取命令行参数
const userId = process.argv[2] || 6; // 默认使用ID为6的用户

// 执行查询
checkCancelCount(userId).then(() => {
  console.log('查询完成');
}); 