const db = require('./src/config/database');

async function debugPetData() {
  try {
    console.log('=== 调试数据库中的宠物数据 ===');
    
    // 查询所有宠物的ID和名称
    const [pets] = await db.execute('SELECT id, name FROM pets LIMIT 5');
    console.log('现有宠物列表:');
    pets.forEach(pet => {
      console.log(`ID: ${pet.id}, 名称: ${pet.name}`);
    });
    
    if (pets.length > 0) {
      const petId = pets[0].id;
      console.log(`\n查询宠物ID ${petId} 的详细信息:`);
      
      // 查询具体宠物的详细信息
      const [rows] = await db.execute(
        `SELECT 
          id, name, character_tags, vaccine_proof_urls
         FROM pets 
         WHERE id = ?`,
        [petId]
      );
      
      if (rows.length > 0) {
        const pet = rows[0];
        console.log('原始数据:');
        console.log('character_tags (原始):', pet.character_tags);
        console.log('character_tags (类型):', typeof pet.character_tags);
        console.log('vaccine_proof_urls (原始):', pet.vaccine_proof_urls);
        console.log('vaccine_proof_urls (类型):', typeof pet.vaccine_proof_urls);
        
        // 尝试解析
        if (pet.character_tags) {
          try {
            const parsed = JSON.parse(pet.character_tags);
            console.log('character_tags 解析成功:', parsed);
          } catch (e) {
            console.log('character_tags 解析失败:', e.message);
          }
        }
        
        if (pet.vaccine_proof_urls) {
          try {
            const parsed = JSON.parse(pet.vaccine_proof_urls);
            console.log('vaccine_proof_urls 解析成功:', parsed);
          } catch (e) {
            console.log('vaccine_proof_urls 解析失败:', e.message);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('调试失败:', error);
  } finally {
    process.exit(0);
  }
}

debugPetData(); 