const db = require('../config/database');

/**
 * 宠物模型 - 负责与pets表交互
 */
class Pet {
  /**
   * 创建新宠物档案
   * @param {Object} petData - 宠物信息
   * @param {number} ownerUserId - 宠物主人用户ID
   * @returns {Promise<number>} - 返回新创建的宠物ID
   */
  static async create(petData, ownerUserId) {
    try {
      // 处理JSON字段
      const characterTags = petData.characterTags ? JSON.stringify(petData.characterTags) : null;
      const vaccineProofUrls = petData.vaccineProof ? JSON.stringify(petData.vaccineProof) : null;
      
      const [result] = await db.execute(
        `INSERT INTO pets (
          owner_user_id, name, photo_url, breed, age, gender, 
          weight, is_sterilized, health_desc, character_tags, 
          special_notes, allergy_info, vaccine_proof_urls
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ownerUserId,
          petData.name,
          petData.photo,
          petData.breed || null,
          petData.age || null,
          petData.gender || null,
          petData.weight || null,
          petData.isSterilized || false,
          petData.healthDesc || null,
          characterTags,
          petData.specialNotes || null,
          petData.allergyInfo || null,
          vaccineProofUrls
        ]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('创建宠物档案失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户名下的所有宠物
   * @param {number} ownerUserId - 宠物主人用户ID
   * @returns {Promise<Array>} - 返回宠物列表
   */
  static async findByOwner(ownerUserId) {
    try {
      const [rows] = await db.execute(
        `SELECT id, name, photo_url as photo, breed, age, gender, weight 
         FROM pets 
         WHERE owner_user_id = ?
         ORDER BY created_at DESC`,
        [ownerUserId]
      );
      
      return rows;
    } catch (error) {
      console.error('获取宠物列表失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取宠物详情
   * @param {number} petId - 宠物ID
   * @returns {Promise<Object|null>} - 返回宠物详情或null
   */
  static async findById(petId) {
    try {
      const [rows] = await db.execute(
        `SELECT 
          id, owner_user_id, name, photo_url as photo, breed, age, gender, 
          weight, is_sterilized as isSterilized, health_desc as healthDesc, 
          character_tags, special_notes as specialNotes, 
          allergy_info as allergyInfo, vaccine_proof_urls
         FROM pets 
         WHERE id = ?`,
        [petId]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      const pet = rows[0];
      
      // 处理JSON字段
      if (pet.character_tags) {
        try {
          pet.characterTags = JSON.parse(pet.character_tags);
        } catch (e) {
          pet.characterTags = [];
        }
        delete pet.character_tags;
      }
      
      if (pet.vaccine_proof_urls) {
        try {
          pet.vaccineProof = JSON.parse(pet.vaccine_proof_urls);
        } catch (e) {
          pet.vaccineProof = [];
        }
        delete pet.vaccine_proof_urls;
      }
      
      return pet;
    } catch (error) {
      console.error('获取宠物详情失败:', error);
      throw error;
    }
  }

  /**
   * 更新宠物信息
   * @param {number} petId - 宠物ID
   * @param {Object} petData - 更新的宠物信息
   * @returns {Promise<boolean>} - 更新是否成功
   */
  static async update(petId, petData) {
    try {
      // 构建更新字段和值
      const updateFields = [];
      const values = [];
      
      if (petData.name !== undefined) {
        updateFields.push('name = ?');
        values.push(petData.name);
      }
      
      if (petData.photo !== undefined) {
        updateFields.push('photo_url = ?');
        values.push(petData.photo);
      }
      
      if (petData.breed !== undefined) {
        updateFields.push('breed = ?');
        values.push(petData.breed);
      }
      
      if (petData.age !== undefined) {
        updateFields.push('age = ?');
        values.push(petData.age);
      }
      
      if (petData.gender !== undefined) {
        updateFields.push('gender = ?');
        values.push(petData.gender);
      }
      
      if (petData.weight !== undefined) {
        updateFields.push('weight = ?');
        values.push(petData.weight);
      }
      
      if (petData.isSterilized !== undefined) {
        updateFields.push('is_sterilized = ?');
        values.push(petData.isSterilized);
      }
      
      if (petData.healthDesc !== undefined) {
        updateFields.push('health_desc = ?');
        values.push(petData.healthDesc);
      }
      
      if (petData.characterTags !== undefined) {
        updateFields.push('character_tags = ?');
        values.push(JSON.stringify(petData.characterTags));
      }
      
      if (petData.specialNotes !== undefined) {
        updateFields.push('special_notes = ?');
        values.push(petData.specialNotes);
      }
      
      if (petData.allergyInfo !== undefined) {
        updateFields.push('allergy_info = ?');
        values.push(petData.allergyInfo);
      }
      
      if (petData.vaccineProof !== undefined) {
        updateFields.push('vaccine_proof_urls = ?');
        values.push(JSON.stringify(petData.vaccineProof));
      }
      
      if (updateFields.length === 0) {
        return true; // 没有要更新的字段
      }
      
      // 添加宠物ID到值数组
      values.push(petId);
      
      const [result] = await db.execute(
        `UPDATE pets SET ${updateFields.join(', ')} WHERE id = ?`,
        values
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('更新宠物信息失败:', error);
      throw error;
    }
  }

  /**
   * 删除宠物
   * @param {number} petId - 宠物ID
   * @returns {Promise<boolean>} - 删除是否成功
   */
  static async delete(petId) {
    try {
      const [result] = await db.execute(
        'DELETE FROM pets WHERE id = ?',
        [petId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('删除宠物失败:', error);
      throw error;
    }
  }

  /**
   * 检查宠物是否属于指定用户
   * @param {number} petId - 宠物ID
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>} - 是否属于该用户
   */
  static async belongsToUser(petId, userId) {
    try {
      const [rows] = await db.execute(
        'SELECT 1 FROM pets WHERE id = ? AND owner_user_id = ?',
        [petId, userId]
      );
      
      return rows.length > 0;
    } catch (error) {
      console.error('检查宠物所有权失败:', error);
      throw error;
    }
  }
}

module.exports = Pet;