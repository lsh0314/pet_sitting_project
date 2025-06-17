/**
 * 创建测试用户脚本
 * 用于在开发环境中创建测试用户
 */

const pool = require('../config/database');

// 测试用户数据
const testUsers = [
  // 伴宠专员用户
  { id: 1, name: '小明', openid: 'openid_1', role: 'sitter' },
  { id: 2, name: '小红', openid: 'openid_2', role: 'sitter' },
  { id: 3, name: '旺财', openid: 'openid_3', role: 'sitter' },
  { id: 4, name: '小花', openid: 'openid_4', role: 'sitter' },
  { id: 5, name: '大壮', openid: 'openid_5', role: 'sitter' },
  // 普通用户（宠物主）
  { id: 6, name: '张三', openid: 'openid_6', role: 'pet_owner' },
  { id: 7, name: '李四', openid: 'openid_7', role: 'pet_owner' },
  { id: 8, name: '王五', openid: 'openid_8', role: 'pet_owner' },
  { id: 9, name: '赵六', openid: 'openid_9', role: 'pet_owner' },
  { id: 10, name: '钱七', openid: 'openid_10', role: 'pet_owner' }
];

// 创建测试用户
async function createTestUsers() {
  try {
    console.log('开始创建测试用户...');
    
    // 检查users表是否存在
    const [tables] = await pool.execute("SHOW TABLES LIKE 'users'");
    if (tables.length === 0) {
      console.error('users表不存在，请先运行数据库迁移');
      process.exit(1);
    }
    
    // 为每个测试用户创建记录
    for (const user of testUsers) {
      // 检查用户是否已存在
      const [existingUsers] = await pool.execute(
        'SELECT * FROM users WHERE wechat_openid = ?',
        [user.openid]
      );
      
      if (existingUsers.length > 0) {
        console.log(`用户 ${user.name} (${user.openid}) 已存在，跳过创建`);
        continue;
      }
      
      // 创建新用户
      await pool.execute(
        'INSERT INTO users (wechat_openid, nickname, avatar_url, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, "active", NOW(), NOW())',
        [user.openid, user.name, '/static/images/default-avatar.png', user.role]
      );
      
      console.log(`已创建用户: ${user.name} (${user.role})`);
      
      // 如果是伴宠专员，创建基本资料
      if (user.role === 'sitter') {
        const [newUser] = await pool.execute(
          'SELECT id FROM users WHERE wechat_openid = ?',
          [user.openid]
        );
        
        if (newUser.length > 0) {
          const userId = newUser[0].id;
          
          // 检查是否已有伴宠专员资料
          const [existingProfile] = await pool.execute(
            'SELECT * FROM sitter_profiles WHERE user_id = ?',
            [userId]
          );
          
          if (existingProfile.length === 0) {
            // 创建伴宠专员基本资料
            await pool.execute(
              'INSERT INTO sitter_profiles (user_id, bio, service_area, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
              [userId, `我是${user.name}，很高兴为您的宠物提供服务！`, '朝阳区，海淀区']
            );
            
            console.log(`已为用户 ${user.name} 创建伴宠专员资料`);
          }
        }
      }
    }
    
    console.log('测试用户创建完成！');
  } catch (error) {
    console.error('创建测试用户失败:', error);
  } finally {
    // 关闭数据库连接
    await pool.end();
  }
}

// 执行创建测试用户
createTestUsers(); 