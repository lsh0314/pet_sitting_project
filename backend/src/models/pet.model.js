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
      // 处理JSON字段 - MySQL json类型可以直接接受JavaScript数组
      const characterTags = petData.characterTags || null;
      const vaccineProofUrls = petData.vaccineProof || null;
      
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
      
      // 调试：打印从数据库获取的原始数据
      console.log('=== Pet.findById 调试信息 ===');
      console.log('宠物ID:', petId);
      console.log('原始character_tags:', pet.character_tags);
      console.log('原始vaccine_proof_urls:', pet.vaccine_proof_urls);
      console.log('character_tags类型:', typeof pet.character_tags);
      console.log('vaccine_proof_urls类型:', typeof pet.vaccine_proof_urls);
      
      // 处理JSON字段 - MySQL的json类型会自动反序列化
      if (pet.character_tags) {
        console.log('character_tags存在，类型:', typeof pet.character_tags);
        if (Array.isArray(pet.character_tags)) {
          console.log('character_tags已经是数组，直接使用:', pet.character_tags);
          pet.characterTags = pet.character_tags;
        } else if (typeof pet.character_tags === 'string') {
          try {
            console.log('character_tags是字符串，尝试解析...');
            pet.characterTags = JSON.parse(pet.character_tags);
            console.log('解析后的characterTags:', pet.characterTags);
          } catch (e) {
            console.log('解析character_tags失败:', e.message);
            pet.characterTags = [];
          }
        } else {
          console.log('character_tags类型未知，设置为空数组');
          pet.characterTags = [];
        }
        delete pet.character_tags;
      } else {
        console.log('character_tags为空，设置默认值[]');
        pet.characterTags = [];
      }
      
      if (pet.vaccine_proof_urls) {
        console.log('vaccine_proof_urls存在，类型:', typeof pet.vaccine_proof_urls);
        if (Array.isArray(pet.vaccine_proof_urls)) {
          console.log('vaccine_proof_urls已经是数组，直接使用:', pet.vaccine_proof_urls);
          // 已经是数组，直接使用
        } else if (typeof pet.vaccine_proof_urls === 'string') {
          try {
            console.log('vaccine_proof_urls是字符串，尝试解析...');
            pet.vaccine_proof_urls = JSON.parse(pet.vaccine_proof_urls);
            console.log('解析后的vaccine_proof_urls:', pet.vaccine_proof_urls);
          } catch (e) {
            console.log('解析vaccine_proof_urls失败:', e.message);
            pet.vaccine_proof_urls = [];
          }
        } else {
          console.log('vaccine_proof_urls类型未知，设置为空数组');
          pet.vaccine_proof_urls = [];
        }
      } else {
        console.log('vaccine_proof_urls为空，设置默认值[]');
        pet.vaccine_proof_urls = [];
      }
      
      console.log('=== 处理后的宠物数据 ===');
      console.log('最终characterTags:', pet.characterTags);
      console.log('最终vaccine_proof_urls:', pet.vaccine_proof_urls);
      console.log('===============================');
      
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
        values.push(petData.characterTags);
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
        values.push(petData.vaccineProof);
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

  /**
   * 获取宠物表中的最大ID
   * @returns {Promise<number>} - 返回最大宠物ID
   */
  static async getMaxPetId() {
    try {
      const [rows] = await db.execute('SELECT MAX(id) as maxId FROM pets');
      return rows[0].maxId || 0;
    } catch (error) {
      console.error('获取最大宠物ID失败:', error);
      throw error;
    }
  }

  /**
   * 管理员获取宠物列表(分页+筛选)
   * @param {Object} options - 查询选项
   * @param {number} options.page - 页码
   * @param {number} options.limit - 每页数量
   * @param {string} [options.keyword] - 搜索关键词
   * @param {string} [options.type] - 宠物类型
   * @param {string} [options.gender] - 性别
   * @returns {Promise<Object>} - 返回宠物列表和总数
   */
  static async adminList({ page = 1, limit = 10, keyword, type, gender, owner }) {
    try {
      // 构建查询条件和参数
      const conditions = [];
      const params = [];
      
      if (keyword) {
        conditions.push('(p.name LIKE ? OR p.id = ?)');
        params.push(`%${keyword}%`, keyword);
      }
      
      if (type) {
        conditions.push('p.breed = ?');
        params.push(type);
      }
      
      if (gender) {
        conditions.push('p.gender = ?');
        params.push(gender);
      }
      
      if (owner) {
        // 定义一个辅助函数来判断字符串是否完全由数字组成
        const isPurelyNumeric = (str) => /^\d+$/.test(str);

        // 如果 owner 是一个纯数字字符串
        if (isPurelyNumeric(owner)) {
          // 那么它可以是用户ID，也可以是某个用户的纯数字昵称
          conditions.push('(u.nickname LIKE ? OR p.owner_user_id = ?)');
          params.push(`%${owner}%`, owner); // 第一个用于模糊搜索，第二个用于ID精确匹配
        } else {
          // 如果 owner 包含非数字字符 (如 "张三")，那它只能是昵称
          conditions.push('u.nickname LIKE ?');
          params.push(`%${owner}%`);
        }
      }
      
      const whereClause = conditions.length > 0 
        ? `WHERE ${conditions.join(' AND ')}` 
        : '';
      
      // 查询总数
      const [totalResult] = await db.execute(
        `SELECT COUNT(*) as total FROM pets p
         LEFT JOIN users u ON p.owner_user_id = u.id
         ${whereClause}`,
        params
      );
      
      // 查询分页数据
      const offset = (page - 1) * limit;
      const limitNum = Number(limit);
      const offsetNum = Number(offset);
      
      const [rows] = await db.execute(
        `SELECT 
          p.id, p.name, p.photo_url as photo, p.breed, p.age, p.gender, 
          p.weight, p.health_desc as healthStatus, 
          p.character_tags as tags, p.special_notes as likes, 
          p.allergy_info as dislikes, p.created_at, p.updated_at,
          p.owner_user_id as owner_id,
          u.nickname as owner_nickname,
          u.avatar_url as owner_avatar_url
         FROM pets p
         LEFT JOIN users u ON p.owner_user_id = u.id
         ${whereClause}
         ORDER BY p.created_at DESC
         LIMIT ${limitNum} OFFSET ${offsetNum}`,
        params
      );
      
      // 处理JSON字段 - MySQL的json类型会自动反序列化
      const processedRows = rows.map(row => {
        if (row.tags) {
          if (Array.isArray(row.tags)) {
            // 已经是数组，直接使用
          } else if (typeof row.tags === 'string') {
            try {
              row.tags = JSON.parse(row.tags);
            } catch (e) {
              row.tags = [];
            }
          } else {
            row.tags = [];
          }
        } else {
          row.tags = [];
        }
        return row;
      });
      
      return {
        data: processedRows,
        total: totalResult[0].total
      };
    } catch (error) {
      console.error('管理员获取宠物列表失败:', error);
      throw error;
    }
  }

  /**
   * 管理员获取宠物详情
   * @param {number} petId - 宠物ID
   * @returns {Promise<Object|null>} - 返回宠物详情或null
   */
  static async adminGetById(petId) {
    try {
      const [rows] = await db.execute(
        `SELECT 
          id, owner_user_id, name, photo_url as photo, breed, age, gender, 
          weight, is_sterilized as isSterilized, health_desc as healthDesc, 
          character_tags, special_notes, 
          allergy_info, vaccine_proof_urls,
          created_at, updated_at
         FROM pets 
         WHERE id = ?`,
        [petId]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      const pet = rows[0];
      
      // 处理JSON字段 - MySQL的json类型会自动反序列化
      if (pet.character_tags) {
        if (Array.isArray(pet.character_tags)) {
          // 已经是数组，直接使用
        } else if (typeof pet.character_tags === 'string') {
          try {
            pet.character_tags = JSON.parse(pet.character_tags);
          } catch (e) {
            pet.character_tags = [];
          }
        } else {
          pet.character_tags = [];
        }
      } else {
        pet.character_tags = [];
      }
      
      // 处理疫苗证明URL - 直接使用数据库中的JSON字段
      if (pet.vaccine_proof_urls) {
        if (Array.isArray(pet.vaccine_proof_urls)) {
          // 已经是数组，直接使用
        } else if (typeof pet.vaccine_proof_urls === 'string') {
          try {
            pet.vaccine_proof_urls = JSON.parse(pet.vaccine_proof_urls);
          } catch (e) {
            pet.vaccine_proof_urls = [];
          }
        } else {
          pet.vaccine_proof_urls = [];
        }
      } else {
        pet.vaccine_proof_urls = [];
      }
      
      // 确保是数组类型
      if (!Array.isArray(pet.vaccine_proof_urls)) {
        pet.vaccine_proof_urls = [];
      }
      
      return pet;
    } catch (error) {
      console.error('管理员获取宠物详情失败:', error);
      throw error;
    }
  }
}

module.exports = Pet;
