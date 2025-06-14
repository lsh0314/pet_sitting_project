const db = require('../config/database');

/**
 * 检查数据库编码设置
 */
async function checkDatabaseEncoding() {
  try {
    console.log('开始检查数据库编码设置...');
    
    // 检查数据库字符集
    const [dbResult] = await db.execute(`
      SELECT default_character_set_name, default_collation_name
      FROM information_schema.SCHEMATA
      WHERE schema_name = ?
    `, [process.env.DB_NAME || 'pet_sitting_db']);
    
    console.log('数据库字符集设置:');
    console.table(dbResult);
    
    // 检查表字符集
    const [tablesResult] = await db.execute(`
      SELECT table_name, table_collation
      FROM information_schema.TABLES
      WHERE table_schema = ?
    `, [process.env.DB_NAME || 'pet_sitting_db']);
    
    console.log('表字符集设置:');
    console.table(tablesResult);
    
    // 检查列字符集
    const [columnsResult] = await db.execute(`
      SELECT table_name, column_name, character_set_name, collation_name
      FROM information_schema.COLUMNS
      WHERE table_schema = ?
      AND data_type IN ('varchar', 'char', 'text', 'enum')
    `, [process.env.DB_NAME || 'pet_sitting_db']);
    
    console.log('列字符集设置:');
    console.table(columnsResult);
    
    console.log('编码检查完成');
    
    // 检查连接编码
    const [connectionResult] = await db.execute('SHOW VARIABLES LIKE "character_set%"');
    console.log('连接字符集设置:');
    console.table(connectionResult);
    
    const [collationResult] = await db.execute('SHOW VARIABLES LIKE "collation%"');
    console.log('连接排序规则设置:');
    console.table(collationResult);
    
    process.exit(0);
  } catch (error) {
    console.error('检查数据库编码时出错:', error);
    process.exit(1);
  }
}

// 执行检查
checkDatabaseEncoding(); 