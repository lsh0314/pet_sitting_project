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
          message: '您无权访问此宠物信息'
        });
      }
      
      // 移除敏感字段
      delete pet.owner_user_id;
      
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
}

module.exports = PetController; 