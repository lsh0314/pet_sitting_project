const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function runMigration() {
  try {
    console.log('开始执行位置字段迁移...');
    
    // 读取SQL文件
    const sqlPath = path.join(__dirname, 'add_location_fields.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // 分割SQL语句
    const statements = sql
      .split(';')
      .filter(statement => statement.trim() !== '')
      .map(statement => statement + ';');
    
    // 执行每条SQL语句
    for (const statement of statements) {
      console.log(`执行SQL: ${statement}`);
      try {
        await db.query(statement);
        console.log('SQL执行成功');
      } catch (err) {
        // 如果字段已存在，忽略错误
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log('字段已存在，跳过');
        } else {
          throw err;
        }
      }
    }
    
    console.log('位置字段迁移完成');
    process.exit(0);
  } catch (error) {
    console.error('迁移失败:', error);
    process.exit(1);
  }
}

runMigration(); 