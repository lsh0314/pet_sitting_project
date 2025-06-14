const fs = require('fs');
const path = require('path');

/**
 * 迁移运行器
 * 执行所有迁移脚本
 */
async function runMigrations() {
  try {
    console.log('开始执行数据库迁移...');
    
    // 获取migrations目录
    const migrationsDir = path.join(__dirname, 'migrations');
    
    // 确保migrations目录存在
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
    }
    
    // 获取所有迁移文件
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort(); // 按文件名排序，通常是按数字前缀排序
    
    if (migrationFiles.length === 0) {
      console.log('没有找到迁移文件');
      return;
    }
    
    console.log(`找到 ${migrationFiles.length} 个迁移文件`);
    
    // 执行每个迁移
    for (const file of migrationFiles) {
      console.log(`正在执行迁移: ${file}`);
      const migration = require(path.join(migrationsDir, file));
      
      // 执行up方法
      const success = await migration.up();
      
      if (success) {
        console.log(`迁移成功: ${file}`);
      } else {
        console.error(`迁移失败: ${file}`);
        process.exit(1);
      }
    }
    
    console.log('所有迁移执行完成');
  } catch (error) {
    console.error('迁移过程出错:', error);
    process.exit(1);
  }
}

/**
 * 回滚迁移
 * 按照相反的顺序执行down方法
 */
async function rollbackMigrations() {
  try {
    console.log('开始回滚数据库迁移...');
    
    // 获取migrations目录
    const migrationsDir = path.join(__dirname, 'migrations');
    
    // 确保migrations目录存在
    if (!fs.existsSync(migrationsDir)) {
      console.log('migrations目录不存在');
      return;
    }
    
    // 获取所有迁移文件并按相反顺序排序
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort()
      .reverse(); // 反向排序，以便从最新的迁移开始回滚
    
    if (migrationFiles.length === 0) {
      console.log('没有找到迁移文件');
      return;
    }
    
    console.log(`找到 ${migrationFiles.length} 个迁移文件`);
    
    // 执行每个迁移的down方法
    for (const file of migrationFiles) {
      console.log(`正在回滚迁移: ${file}`);
      const migration = require(path.join(migrationsDir, file));
      
      // 执行down方法
      const success = await migration.down();
      
      if (success) {
        console.log(`回滚成功: ${file}`);
      } else {
        console.error(`回滚失败: ${file}`);
        process.exit(1);
      }
    }
    
    console.log('所有迁移回滚完成');
  } catch (error) {
    console.error('回滚过程出错:', error);
    process.exit(1);
  }
}

/**
 * 主函数
 */
async function main() {
  const action = process.argv[2] || 'up';
  
  try {
    if (action === 'up') {
      await runMigrations();
    } else if (action === 'down') {
      await rollbackMigrations();
    } else {
      console.error('无效的操作。请使用 "up" 或 "down"');
      process.exit(1);
    }
  } catch (error) {
    console.error('执行过程出错:', error);
    process.exit(1);
  }
}

// 执行主函数
main(); 