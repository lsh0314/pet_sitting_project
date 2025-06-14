const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../../backend/.env') });

/**
 * 数据库配置
 */
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'pet_sitting_db',
};

/**
 * 执行orders表的迁移
 */
async function up() {
  try {
    console.log('正在创建orders表...');
    
    // 创建数据库连接
    const connection = await mysql.createConnection(dbConfig);
    
    // 创建orders表
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS \`orders\` (
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '订单唯一ID',
        \`owner_user_id\` BIGINT UNSIGNED NOT NULL COMMENT '宠物主用户ID',
        \`sitter_user_id\` BIGINT UNSIGNED DEFAULT NULL COMMENT '帮溜员用户ID (接单后才有)',
        \`pet_id\` BIGINT UNSIGNED NOT NULL COMMENT '服务的宠物ID',
        \`status\` ENUM('pending', 'accepted', 'paid', 'ongoing', 'completed', 'cancelled', 'confirmed') NOT NULL DEFAULT 'pending' COMMENT '订单状态',
        \`service_type\` ENUM('walk', 'feed', 'boarding') NOT NULL COMMENT '服务类型',
        \`service_date\` DATE NOT NULL COMMENT '服务日期',
        \`start_time\` TIME NOT NULL COMMENT '服务开始时间',
        \`end_time\` TIME NOT NULL COMMENT '服务结束时间',
        \`address\` VARCHAR(512) NOT NULL COMMENT '服务地点',
        \`remarks\` TEXT DEFAULT NULL COMMENT '宠物主备注',
        \`price\` DECIMAL(10, 2) NOT NULL COMMENT '订单总价',
        \`commission_rate\` DECIMAL(5, 4) NOT NULL DEFAULT 0.1000 COMMENT '平台佣金比例（下单时确定）',
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_owner_id\` (\`owner_user_id\`),
        KEY \`idx_sitter_id\` (\`sitter_user_id\`),
        KEY \`idx_pet_id\` (\`pet_id\`),
        KEY \`idx_status\` (\`status\`),
        FOREIGN KEY (\`owner_user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`sitter_user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL,
        FOREIGN KEY (\`pet_id\`) REFERENCES \`pets\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务订单表';
    `;
    
    await connection.query(createTableSQL);
    
    console.log('orders表创建成功');
    
    // 关闭连接
    await connection.end();
    
    return true;
  } catch (error) {
    console.error('orders表创建失败:', error);
    return false;
  }
}

/**
 * 回滚orders表的迁移
 */
async function down() {
  try {
    console.log('正在删除orders表...');
    
    // 创建数据库连接
    const connection = await mysql.createConnection(dbConfig);
    
    // 删除orders表
    await connection.query('DROP TABLE IF EXISTS `orders`;');
    
    console.log('orders表删除成功');
    
    // 关闭连接
    await connection.end();
    
    return true;
  } catch (error) {
    console.error('orders表删除失败:', error);
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  const action = process.argv[2] || 'up';
  
  try {
    if (action === 'up') {
      const success = await up();
      if (success) {
        console.log('迁移成功: 创建orders表');
      } else {
        console.log('迁移失败: 创建orders表');
        process.exit(1);
      }
    } else if (action === 'down') {
      const success = await down();
      if (success) {
        console.log('回滚成功: 删除orders表');
      } else {
        console.log('回滚失败: 删除orders表');
        process.exit(1);
      }
    } else {
      console.error('无效的操作。请使用 "up" 或 "down"');
      process.exit(1);
    }
  } catch (error) {
    console.error('迁移过程出错:', error);
    process.exit(1);
  }
}

// 执行主函数
if (require.main === module) {
  main();
}

module.exports = { up, down }; 