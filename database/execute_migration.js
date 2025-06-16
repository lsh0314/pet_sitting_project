const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function executeMigration(filename) {
  // 创建数据库连接
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pet_sitting_db',
    multipleStatements: true
  });

  try {
    console.log(`正在执行迁移: ${filename}`);
    
    // 读取SQL文件内容
    const sqlFilePath = path.join(__dirname, 'migrations', filename);
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // 执行SQL
    await connection.query(sqlContent);
    
    console.log(`迁移 ${filename} 执行成功!`);
  } catch (error) {
    console.error(`迁移执行失败: ${error.message}`);
    throw error;
  } finally {
    await connection.end();
  }
}

// 如果直接运行此脚本，执行指定的迁移
if (require.main === module) {
  const migrationFile = process.argv[2];
  if (!migrationFile) {
    console.error('请指定要执行的迁移文件名，例如: node execute_migration.js create_payments_table.sql');
    process.exit(1);
  }
  
  executeMigration(migrationFile)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { executeMigration };