const db = require('../config/database');

/**
 * 修复宠物名称编码问题
 */
async function fixPetNames() {
  try {
    console.log('开始修复宠物名称...');
    
    // 更新宠物名称
    await db.execute('UPDATE pets SET name = ? WHERE id = ?', ['咪咪', 1]);
    await db.execute('UPDATE pets SET name = ? WHERE id = ?', ['旺财', 3]);
    
    console.log('宠物名称更新完成');
    
    // 验证更新结果
    const [pets] = await db.execute('SELECT id, name FROM pets');
    console.log('宠物名称验证:');
    console.table(pets);
    
    console.log('修复完成');
    process.exit(0);
  } catch (error) {
    console.error('修复宠物名称时出错:', error);
    process.exit(1);
  }
}

// 执行修复
fixPetNames(); 