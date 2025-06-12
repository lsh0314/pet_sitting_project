const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

/**
 * 数据库配置
 */
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  multipleStatements: true // 允许执行多条SQL语句
};

/**
 * 执行SQL脚本
 */
async function executeSqlFile() {
  try {
    console.log('正在执行SQL文件: petsystem.sql');
    
    // 读取SQL文件内容
    const sqlFilePath = path.join(__dirname, 'petsystem.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // 创建数据库连接
    const connection = await mysql.createConnection(dbConfig);
    
    // 先创建数据库
    await connection.query('CREATE DATABASE IF NOT EXISTS pet_sitting_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
    
    // 使用该数据库
    await connection.query('USE pet_sitting_db;');
    
    // 执行SQL语句
    await connection.query(sqlContent);
    
    console.log('SQL脚本执行成功');
    
    // 关闭连接
    await connection.end();
    
    return true;
  } catch (error) {
    console.error('SQL脚本执行失败:', error);
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    const success = await executeSqlFile();
    
    if (success) {
      console.log('数据库初始化成功');
    } else {
      console.log('数据库初始化失败');
      process.exit(1);
    }
  } catch (error) {
    console.error('导入过程出错:', error);
    process.exit(1);
  }
}

// 执行主函数
main();