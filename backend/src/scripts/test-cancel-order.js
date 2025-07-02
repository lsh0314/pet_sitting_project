/**
 * 测试帮溜员取消订单功能
 * 用于测试cancel_count字段是否正确更新
 */
const db = require('../config/database');

async function testCancelOrder() {
  try {
    // 1. 获取一个测试帮溜员用户ID
    const [sitters] = await db.query(
      `SELECT u.id 
       FROM users u 
       JOIN sitter_profiles sp ON u.id = sp.user_id 
       WHERE u.role = 'sitter' AND u.status = 'active' 
       LIMIT 1`
    );
    
    if (sitters.length === 0) {
      console.log('没有找到测试帮溜员用户');
      return;
    }
    
    const sitterId = sitters[0].id;
    console.log(`测试帮溜员ID: ${sitterId}`);
    
    // 2. 获取当前取消次数
    const [beforeCancel] = await db.query(
      'SELECT cancel_count FROM sitter_profiles WHERE user_id = ?',
      [sitterId]
    );
    
    const beforeCount = beforeCancel[0]?.cancel_count || 0;
    console.log(`取消前的取消次数: ${beforeCount}`);
    
    // 3. 模拟取消订单操作
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 先将取消次数设置为2
      await connection.execute(
        'UPDATE sitter_profiles SET cancel_count = 2 WHERE user_id = ?',
        [sitterId]
      );
      
      console.log('已将取消次数设置为2');
      
      // 再增加1次，模拟第三次取消
      await connection.execute(
        'UPDATE sitter_profiles SET cancel_count = cancel_count + 1 WHERE user_id = ?',
        [sitterId]
      );
      
      // 获取更新后的取消次数
      const [afterUpdate] = await connection.execute(
        'SELECT cancel_count FROM sitter_profiles WHERE user_id = ?',
        [sitterId]
      );
      
      const afterCount = afterUpdate[0]?.cancel_count || 0;
      console.log(`取消后的取消次数: ${afterCount}`);
      
      // 如果达到3次，将用户状态设为banned
      if (afterCount >= 3) {
        await connection.execute(
          'UPDATE users SET status = ? WHERE id = ?',
          ['banned', sitterId]
        );
        
        console.log(`帮溜员取消次数达到${afterCount}次，已被封禁`);
      }
      
      // 提交事务
      await connection.commit();
      
      // 4. 验证结果
      const [afterCancel] = await db.query(
        'SELECT sp.cancel_count, u.status FROM sitter_profiles sp JOIN users u ON sp.user_id = u.id WHERE sp.user_id = ?',
        [sitterId]
      );
      
      console.log('最终结果:', afterCancel[0]);
      
      // 5. 恢复测试数据（将用户状态恢复为active，取消次数恢复为原值）
      await db.query(
        'UPDATE users SET status = ? WHERE id = ?',
        ['active', sitterId]
      );
      
      await db.query(
        'UPDATE sitter_profiles SET cancel_count = ? WHERE user_id = ?',
        [beforeCount, sitterId]
      );
      
      console.log('已恢复测试数据');
      
    } catch (error) {
      await connection.rollback();
      console.error('测试失败:', error);
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('测试脚本执行失败:', error);
  } finally {
    // 关闭数据库连接池
    await db.end();
  }
}

// 执行测试
testCancelOrder().then(() => {
  console.log('测试完成');
}); 