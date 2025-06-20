const SitterProfile = require('../models/sitter.profile.model');
const SitterService = require('../models/sitter.service.model');

/**
 * 帮溜员控制器 - 处理与帮溜员相关的请求
 */
class SitterController {
  /**
   * 获取当前用户的帮溜员资料
   */
  static async getProfile(req, res) {
    try {
      // 从认证中间件获取用户ID
      const userId = req.user.id;
      
      // 获取帮溜员基本资料
      const profile = await SitterProfile.findByUserId(userId);
      
      // 如果没有找到资料，返回空对象
      if (!profile) {
        return res.json({
          profile: null,
          services: []
        });
      }
      
      // 获取帮溜员服务项目
      const services = await SitterService.findByUserId(userId);
      
      // 返回组合数据
      res.json({
        profile,
        services: services || []
      });
    } catch (error) {
      console.error('获取帮溜员资料失败:', error);
      res.status(500).json({
        success: false,
        message: '获取帮溜员资料失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 更新当前用户的帮溜员资料
   */
  static async updateProfile(req, res) {
    try {
      // 从认证中间件获取用户ID
      const userId = req.user.id;
      
      // 从请求体中获取资料和服务数据
      const { profile, services } = req.body;
      
      if (!profile) {
        return res.status(400).json({
          success: false,
          message: '请提供帮溜员资料'
        });
      }
      
      // 更新用户角色为帮溜员（如果需要）
      // 这里假设有一个User模型可以更新用户角色
      // await User.updateRole(userId, 'sitter');
      
      // 更新或创建帮溜员资料
      let profileResult;
      const existingProfile = await SitterProfile.findByUserId(userId);
      
      if (existingProfile) {
        // 更新现有资料
        profileResult = await SitterProfile.update(userId, profile);
      } else {
        // 创建新资料
        profileResult = await SitterProfile.create(userId, profile);
      }
      
      // 处理服务项目
      let servicesResult = true;
      if (Array.isArray(services) && services.length > 0) {
        // 先删除现有服务
        await SitterService.deleteByUserId(userId);
        
        // 添加新服务
        for (const service of services) {
          if (!service.service_type || !service.price) {
            return res.status(400).json({
              success: false,
              message: '服务项目必须包含类型和价格'
            });
          }
          
          await SitterService.create(userId, service);
        }
      }
      
      if (profileResult && servicesResult) {
        res.json({
          success: true,
          message: '帮溜员资料更新成功'
        });
      } else {
        res.status(500).json({
          success: false,
          message: '帮溜员资料更新失败'
        });
      }
    } catch (error) {
      console.error('更新帮溜员资料失败:', error);
      res.status(500).json({
        success: false,
        message: '更新帮溜员资料失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 获取所有帮溜员列表（公开列表，用于宠物主浏览）
   */
  static async getSitters(req, res) {
    try {
      // 获取查询参数
      const { service_type, page = 1, size = 10, sort } = req.query;
      
      // 计算分页参数
      const offset = (page - 1) * size;
      const limit = parseInt(size);
      
      // 构建查询选项
      const options = {
        offset,
        limit,
        sort
      };
      
      // 如果指定了服务类型，添加到查询条件
      if (service_type) {
        options.service_type = service_type;
      }
      
      // 获取帮溜员列表
      const { sitters, total } = await SitterProfile.findAll(options);
      
      res.json({
        success: true,
        data: sitters,
        total,
        page: parseInt(page),
        size: parseInt(size),
        totalPages: Math.ceil(total / size)
      });
    } catch (error) {
      console.error('获取帮溜员列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取帮溜员列表失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 获取指定帮溜员的公开资料
   */
  static async getSitterById(req, res) {
    try {
      const sitterId = parseInt(req.params.id);
      
      if (isNaN(sitterId)) {
        return res.status(400).json({
          success: false,
          message: '无效的帮溜员ID'
        });
      }
      
      // 获取帮溜员基本资料
      const profile = await SitterProfile.findByUserId(sitterId);
      
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: '未找到对应帮溜员'
        });
      }
      
      // 获取帮溜员服务项目
      const services = await SitterService.findByUserId(sitterId);
      
      // 构建返回数据，格式与API文档一致
      const sitterData = {
        id: profile.user_id,
        nickname: profile.nickname,
        avatar: profile.avatar_url,
        bio: profile.bio,
        serviceArea: profile.service_area,
        rating: profile.rating || 5.0,
        totalServices: profile.total_services_completed || 0,
        services: services.map(service => ({
          type: service.service_type,
          price: service.price
        })),
        availableDates: []
      };
      
      // 安全解析available_dates
      if (profile.available_dates) {
        try {
          // 检查available_dates是否已经是数组
          if (Array.isArray(profile.available_dates)) {
            sitterData.availableDates = profile.available_dates;
          } else {
            // 尝试解析JSON字符串
            sitterData.availableDates = JSON.parse(profile.available_dates);
          }
        } catch (e) {
          console.error('解析available_dates失败:', e);
          // 保持默认空数组
        }
      }
      
      // 返回组合数据
      res.json({
        success: true,
        data: sitterData
      });
    } catch (error) {
      console.error('获取帮溜员详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取帮溜员详情失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = SitterController; 