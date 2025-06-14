const Order = require('../models/order.model');
const Pet = require('../models/pet.model');
const SitterProfile = require('../models/sitter.profile.model');
const SitterService = require('../models/sitter.service.model');

/**
 * 订单控制器 - 处理与订单相关的请求
 */
class OrderController {
  /**
   * 创建新订单
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  static async createOrder(req, res) {
    try {
      // 从认证中间件获取当前用户ID（宠物主）
      const ownerUserId = req.user.id;
      
      // 获取请求体中的订单数据
      const {
        petId,
        serviceType,
        serviceDate,
        startTime,
        endTime,
        address,
        remarks,
        price,
        targetSitter
      } = req.body;
      
      // 验证必填字段
      if (!petId || !serviceType || !serviceDate || !startTime || !endTime || !address || !price || !targetSitter) {
        return res.status(400).json({
          success: false,
          message: '缺少必填字段'
        });
      }
      
      // 验证宠物是否属于当前用户
      const isPetOwner = await Pet.belongsToUser(petId, ownerUserId);
      if (!isPetOwner) {
        return res.status(403).json({
          success: false,
          message: '您不是该宠物的主人'
        });
      }
      
      // 验证目标帮溜员是否存在
      const sitterProfile = await SitterProfile.findByUserId(targetSitter);
      if (!sitterProfile) {
        return res.status(404).json({
          success: false,
          message: '目标帮溜员不存在'
        });
      }
      
      // 验证帮溜员是否提供该类型的服务
      const sitterServices = await SitterService.findByUserId(targetSitter);
      const hasService = sitterServices.some(service => service.service_type === serviceType);
      if (!hasService) {
        return res.status(400).json({
          success: false,
          message: '该帮溜员不提供此类服务'
        });
      }
      
      // 创建订单数据对象
      const orderData = {
        ownerUserId,
        sitterUserId: targetSitter,
        petId,
        status: 'accepted', // MVP阶段直接设为accepted，表示等待支付
        serviceType,
        serviceDate,
        startTime,
        endTime,
        address,
        remarks,
        price,
        commissionRate: 0.1 // 默认佣金比例10%
      };
      
      // 创建订单
      const orderId = await Order.create(orderData);
      
      // 返回成功响应
      res.status(201).json({
        success: true,
        orderId
      });
    } catch (error) {
      console.error('创建订单失败:', error);
      res.status(500).json({
        success: false,
        message: '创建订单失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = OrderController; 