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
 * 执行pets表的迁移
 */
async function up() {
  try {
    console.log('正在创建pets表...');
    
    // 创建数据库连接
    const connection = await mysql.createConnection(dbConfig);
    
    // 创建pets表
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS \`pets\` (
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '宠物唯一ID',
        \`owner_user_id\` BIGINT UNSIGNED NOT NULL COMMENT '宠物主人用户ID',
        \`name\` VARCHAR(100) NOT NULL COMMENT '宠物名',
        \`photo_url\` VARCHAR(512) NOT NULL COMMENT '宠物照片URL',
        \`breed\` VARCHAR(100) DEFAULT NULL COMMENT '品种',
        \`age\` VARCHAR(50) DEFAULT NULL COMMENT '年龄描述',
        \`gender\` ENUM('male', 'female') DEFAULT NULL COMMENT '性别',
        \`weight\` DECIMAL(5, 2) DEFAULT NULL COMMENT '体重(KG)',
        \`is_sterilized\` BOOLEAN DEFAULT FALSE COMMENT '是否绝育',
        \`health_desc\` TEXT DEFAULT NULL COMMENT '健康状况描述',
        \`character_tags\` JSON DEFAULT NULL COMMENT '性格标签数组, e.g., ["亲人", "胆小"]',
        \`special_notes\` TEXT DEFAULT NULL COMMENT '特殊注意事项',
        \`allergy_info\` TEXT DEFAULT NULL COMMENT '过敏源信息',
        \`vaccine_proof_urls\` JSON DEFAULT NULL COMMENT '疫苗证明图片URL数组',
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_owner_user_id\` (\`owner_user_id\`),
        FOREIGN KEY (\`owner_user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='宠物档案表';
    `;
    
    await connection.query(createTableSQL);
    
    console.log('pets表创建成功');
    
    // 关闭连接
    await connection.end();
    
    return true;
  } catch (error) {
    console.error('pets表创建失败:', error);
    return false;
  }
}

/**
 * 回滚pets表的迁移
 */
async function down() {
  try {
    console.log('正在删除pets表...');
    
    // 创建数据库连接
    const connection = await mysql.createConnection(dbConfig);
    
    // 删除pets表
    await connection.query('DROP TABLE IF EXISTS `pets`;');
    
    console.log('pets表删除成功');
    
    // 关闭连接
    await connection.end();
    
    return true;
  } catch (error) {
    console.error('pets表删除失败:', error);
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
        console.log('迁移成功: 创建pets表');
      } else {
        console.log('迁移失败: 创建pets表');
        process.exit(1);
      }
    } else if (action === 'down') {
      const success = await down();
      if (success) {
        console.log('回滚成功: 删除pets表');
      } else {
        console.log('回滚失败: 删除pets表');
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