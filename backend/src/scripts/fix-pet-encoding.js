const db = require('../config/database');

/**
 * 修复宠物表中的乱码问题
 */
async function fixPetEncoding() {
  try {
    console.log('开始修复宠物表中的乱码问题...');
    
    // 查询所有宠物
    const [pets] = await db.execute('SELECT id, name FROM pets');
    console.log(`找到 ${pets.length} 个宠物记录`);
    
    // 更新宠物名称
    const updates = [
      { id: 1, name: '咪咪' },  // ID为1的宠物名称修改为"咪咪"
      { id: 3, name: '旺财' }   // ID为3的宠物名称修改为"旺财"
      // 可以根据需要添加更多宠物
    ];
    
    // 逐个更新宠物名称
    for (const pet of updates) {
      await db.execute(
        'UPDATE pets SET name = ? WHERE id = ?',
        [pet.name, pet.id]
      );
      console.log(`已更新宠物ID ${pet.id} 的名称为 "${pet.name}"`);
    }
    
    console.log('宠物名称更新完成');
    
    // 验证更新结果
    const [updatedPets] = await db.execute('SELECT id, name FROM pets');
    for (const pet of updatedPets) {
      console.log(`宠物ID: ${pet.id}, 名称: ${pet.name}`);
    }
    
    console.log('宠物表编码修复完成');
    process.exit(0);
  } catch (error) {
    console.error('修复宠物编码时出错:', error);
    process.exit(1);
  }
}

// 执行修复
fixPetEncoding(); 