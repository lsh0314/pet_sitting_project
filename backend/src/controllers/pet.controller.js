const Pet = require('../models/pet.model');

/**
 * 宠物控制器 - 处理与宠物相关的请求
 */
class PetController {
  /**
   * 获取当前用户的所有宠物
   */
  static async getPets(req, res) {
    try {
      // 从认证中间件获取用户ID
      const userId = req.user.id;
      
      // 获取用户的所有宠物
      const pets = await Pet.findByOwner(userId);
      
      res.json(pets);
    } catch (error) {
      console.error('获取宠物列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取宠物列表失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 创建新宠物
   */
  static async createPet(req, res) {
    try {
      // 验证必填字段
      const { name, photo } = req.body;
      
      if (!name || !photo) {
        return res.status(400).json({
          success: false,
          message: '宠物名称和照片为必填项'
        });
      }
      
      // 从认证中间件获取用户ID
      const userId = req.user.id;
      
      // 创建宠物
      const petId = await Pet.create(req.body, userId);
      
      res.status(201).json({
        success: true,
        petId
      });
    } catch (error) {
      console.error('创建宠物失败:', error);
      res.status(500).json({
        success: false,
        message: '创建宠物失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 获取单个宠物详情
   */
  static async getPetById(req, res) {
    try {
      const petId = parseInt(req.params.id);
      
      if (isNaN(petId)) {
        return res.status(400).json({
          success: false,
          message: '无效的宠物ID'
        });
      }
      
      // 获取宠物详情
      const pet = await Pet.findById(petId);
      
      console.log('=== PetController.getPetById 调试信息 ===');
      console.log('请求的宠物ID:', petId);
      console.log('当前用户ID:', req.user.id);
      
      if (!pet) {
        console.log('未找到宠物数据');
        return res.status(404).json({
          success: false,
          errorCode: 'NOT_FOUND',
          message: '未找到对应宠物'
        });
      }
      
      console.log('从模型获取的宠物数据:', JSON.stringify(pet, null, 2));
      
      // 验证宠物是否属于当前用户
      if (pet.owner_user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: '您无权访问此宠物信息'
        });
      }
      
      // 处理疫苗证明URL，添加完整URL前缀
      console.log('处理前的vaccine_proof_urls:', pet.vaccine_proof_urls);
      if (!pet.vaccine_proof_urls || !Array.isArray(pet.vaccine_proof_urls)) {
        console.log('vaccine_proof_urls不是数组，设置为空数组');
        pet.vaccine_proof_urls = [];
      } else {
        console.log('开始处理vaccine_proof_urls，原始数据:', pet.vaccine_proof_urls);
        // 转换vaccine_proof_urls中的相对路径为完整URL
        pet.vaccine_proof_urls = pet.vaccine_proof_urls.map(url => {
          if (url && !url.startsWith('http')) {
            const fullUrl = `${process.env.API_BASE_URL || 'http://localhost:3000'}/uploads/${url}`;
            console.log(`转换URL: ${url} -> ${fullUrl}`);
            return fullUrl;
          }
          return url;
        });
        console.log('处理后的vaccine_proof_urls:', pet.vaccine_proof_urls);
      }
      
      // 确保characterTags字段存在
      console.log('处理前的characterTags:', pet.characterTags);
      if (!pet.characterTags || !Array.isArray(pet.characterTags)) {
        console.log('characterTags不是数组，设置为空数组');
        pet.characterTags = [];
      }
      console.log('处理后的characterTags:', pet.characterTags);
      
      // 将字段名映射为前端期望的格式
      pet.vaccineProof = pet.vaccine_proof_urls;
      console.log('映射后的vaccineProof:', pet.vaccineProof);
      
      // 移除敏感字段和不需要的字段
      delete pet.owner_user_id;
      delete pet.vaccine_proof_urls;
      
      console.log('=== 最终返回给前端的数据 ===');
      console.log(JSON.stringify(pet, null, 2));
      console.log('=====================================');
      
      res.json(pet);
    } catch (error) {
      console.error('获取宠物详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取宠物详情失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 更新宠物信息
   */
  static async updatePet(req, res) {
    try {
      const petId = parseInt(req.params.id);
      
      if (isNaN(petId)) {
        return res.status(400).json({
          success: false,
          message: '无效的宠物ID'
        });
      }
      
      // 检查宠物是否存在
      const pet = await Pet.findById(petId);
      
      if (!pet) {
        return res.status(404).json({
          success: false,
          errorCode: 'NOT_FOUND',
          message: '未找到对应宠物'
        });
      }
      
      // 验证宠物是否属于当前用户
      if (pet.owner_user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: '您无权修改此宠物信息'
        });
      }
      
      // 更新宠物信息
      const success = await Pet.update(petId, req.body);
      
      if (success) {
        res.json({
          success: true,
          message: '宠物档案更新成功'
        });
      } else {
        res.status(500).json({
          success: false,
          message: '宠物档案更新失败'
        });
      }
    } catch (error) {
      console.error('更新宠物信息失败:', error);
      res.status(500).json({
        success: false,
        message: '更新宠物信息失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 删除宠物
   */
  static async deletePet(req, res) {
    try {
      const petId = parseInt(req.params.id);
      
      if (isNaN(petId)) {
        return res.status(400).json({
          success: false,
          message: '无效的宠物ID'
        });
      }
      
      // 检查宠物是否存在并属于当前用户
      const belongs = await Pet.belongsToUser(petId, req.user.id);
      
      if (!belongs) {
        return res.status(404).json({
          success: false,
          message: '未找到对应宠物或您无权删除此宠物'
        });
      }
      
      // 删除宠物
      const success = await Pet.delete(petId);
      
      if (success) {
        res.json({
          success: true,
          message: '宠物档案已删除'
        });
      } else {
        res.status(500).json({
          success: false,
          message: '宠物档案删除失败'
        });
      }
    } catch (error) {
      console.error('删除宠物失败:', error);
      res.status(500).json({
        success: false,
        message: '删除宠物失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 管理员获取所有宠物列表
   */
  static async adminGetPets(req, res) {
    try {
      const { page = 1, limit = 10, keyword, type, gender, owner } = req.query;
      
      const result = await Pet.adminList({
        page: parseInt(page),
        limit: parseInt(limit),
        keyword,
        type,
        gender,
        owner
      });
      
      res.json({
        success: true,
        data: result.data,
        total: result.total,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (error) {
      console.error('管理员获取宠物列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取宠物列表失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 管理员获取宠物详情
   */
  static async adminGetPetById(req, res) {
    try {
      const petId = parseInt(req.params.id);
      
      if (isNaN(petId)) {
        return res.status(400).json({
          success: false,
          message: '无效的宠物ID'
        });
      }
      
      const pet = await Pet.adminGetById(petId);
      
      if (!pet) {
        return res.status(404).json({
          success: false,
          message: '未找到对应宠物'
        });
      }
      
      // 确保vaccine_proof_urls字段存在且包含正确的图片路径
      if (!pet.vaccine_proof_urls || !Array.isArray(pet.vaccine_proof_urls)) {
        pet.vaccine_proof_urls = [];
      } else {
        // 转换vaccine_proof_urls中的相对路径为完整URL
        pet.vaccine_proof_urls = pet.vaccine_proof_urls.map(url => {
          if (url && !url.startsWith('http')) {
            return `${process.env.API_BASE_URL}/uploads/${url}`;
          }
          return url;
        });
      }
      
      // 调试日志 - 查看处理后的vaccine_proof_urls
      console.log('Processed vaccine_proof_urls:', pet.vaccine_proof_urls);
      
      res.json({
        success: true,
        data: pet
      });
    } catch (error) {
      console.error('管理员获取宠物详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取宠物详情失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 管理员更新宠物信息
   */
  static async adminUpdatePet(req, res) {
    try {
      const petId = parseInt(req.params.id);
      
      if (isNaN(petId)) {
        return res.status(400).json({
          success: false,
          message: '无效的宠物ID'
        });
      }
      
      const pet = await Pet.adminGetById(petId);
      
      if (!pet) {
        return res.status(404).json({
          success: false,
          message: '未找到对应宠物'
        });
      }
      
      const success = await Pet.update(petId, req.body);
      
      if (success) {
        res.json({
          success: true,
          message: '宠物档案更新成功'
        });
      } else {
        res.status(500).json({
          success: false,
          message: '宠物档案更新失败'
        });
      }
    } catch (error) {
      console.error('管理员更新宠物信息失败:', error);
      res.status(500).json({
        success: false,
        message: '更新宠物信息失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 管理员删除宠物
   */
  static async adminDeletePet(req, res) {
    try {
      const petId = parseInt(req.params.id);
      
      if (isNaN(petId)) {
        return res.status(400).json({
          success: false,
          message: '无效的宠物ID'
        });
      }
      
      const pet = await Pet.adminGetById(petId);
      
      if (!pet) {
        return res.status(404).json({
          success: false,
          message: '未找到对应宠物'
        });
      }
      
      const success = await Pet.delete(petId);
      
      if (success) {
        res.json({
          success: true,
          message: '宠物档案已删除'
        });
      } else {
        res.status(500).json({
          success: false,
          message: '宠物档案删除失败'
        });
      }
    } catch (error) {
      console.error('管理员删除宠物失败:', error);
      res.status(500).json({
        success: false,
        message: '删除宠物失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = PetController;
