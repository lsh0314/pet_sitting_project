const db = require('../config/database');

/**
 * 修复宠物表中所有可能包含中文的字段
 */
async function fixAllPetFields() {
  try {
    console.log('开始修复宠物表中的所有中文字段...');
    
    // 宠物ID=1的完整信息修复
    await db.execute(`
      UPDATE pets SET 
        name = ?,
        breed = ?,
        health_desc = ?,
        character_tags = ?,
        special_notes = ?,
        allergy_info = ?
      WHERE id = ?
    `, [
      '咪咪',                                    // 名称
      '橘猫',                                    // 品种
      '健康状况良好，已接种疫苗',                 // 健康描述
      JSON.stringify(['亲人', '活泼', '爱玩']),  // 性格标签
      '喜欢被抚摸头部，不喜欢肚子被碰',           // 特殊注意事项
      '对鱼过敏',                                // 过敏信息
      1
    ]);
    
    console.log('宠物ID=1的信息已更新');
    
    // 宠物ID=3的完整信息修复
    await db.execute(`
      UPDATE pets SET 
        name = ?,
        breed = ?,
        health_desc = ?,
        character_tags = ?,
        special_notes = ?,
        allergy_info = ?
      WHERE id = ?
    `, [
      '旺财',                                    // 名称
      '柴犬',                                    // 品种
      '健康',                                    // 健康描述
      JSON.stringify(['亲人', '胆小', '爱叫']),  // 性格标签
      '喜欢散步，每天需要遛两次',                 // 特殊注意事项
      '无',                                      // 过敏信息
      3
    ]);
    
    console.log('宠物ID=3的信息已更新');
    
    // 验证更新结果
    const [pets] = await db.execute(`
      SELECT id, name, breed, health_desc, character_tags, special_notes, allergy_info 
      FROM pets
    `);
    
    console.log('宠物信息验证:');
    
    // 处理JSON字段以便显示
    const formattedPets = pets.map(pet => {
      const result = {...pet};
      try {
        if (pet.character_tags) {
          result.character_tags = JSON.parse(pet.character_tags);
        }
      } catch (e) {
        // 保持原样
      }
      return result;
    });
    
    console.table(formattedPets);
    
    console.log('所有宠物信息修复完成');
    process.exit(0);
  } catch (error) {
    console.error('修复宠物信息时出错:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// 执行修复
fixAllPetFields(); 