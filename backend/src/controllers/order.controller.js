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
        targetSitter,
        locationCoords
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
        commissionRate: 0.1, // 默认佣金比例10%
        locationCoords: locationCoords ? JSON.stringify(locationCoords) : null // 保存位置坐标
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

  /**
   * 获取我的订单列表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  static async getMyOrders(req, res) {
    try {
      // 从认证中间件获取当前用户ID
      const userId = req.user.id;
      
      // 获取查询参数
      const { role, status, page = 1, limit = 10 } = req.query;
      
      // 验证角色参数
      if (!role || !['pet_owner', 'sitter'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: '无效的角色参数，必须是 pet_owner 或 sitter'
        });
      }
      
      // 查询选项
      const options = {
        status,
        page: parseInt(page),
        limit: parseInt(limit)
      };
      
      // 获取订单列表
      const result = await Order.findByUser(userId, role, options);
      
      // 格式化订单数据，添加状态文本和服务类型文本
      const formattedOrders = result.orders.map(order => {
        // 状态文本映射
        const statusTextMap = {
          'pending': '待接单',
          'accepted': '待支付',
          'paid': '待服务',
          'ongoing': '服务中',
          'completed': '已完成',
          'cancelled': '已取消'
        };
        
        // 服务类型文本映射
        const serviceTypeTextMap = {
          'walk': '遛狗',
          'feed': '喂食',
          'boarding': '寄养'
        };
        
        // 构建时间范围
        const timeRange = `${order.startTime} - ${order.endTime}`;
        
        return {
          orderId: order.id,
          petName: order.petName,
          petPhoto: order.petPhoto,
          status: order.status,
          statusText: statusTextMap[order.status] || order.status,
          serviceType: order.serviceType,
          serviceTypeText: serviceTypeTextMap[order.serviceType] || order.serviceType,
          serviceDate: order.serviceDate,
          timeRange,
          startTime: order.startTime,
          endTime: order.endTime,
          price: order.price,
          createdAt: order.createdAt,
          // 根据角色返回不同的对方信息
          counterpart: role === 'pet_owner' 
            ? { id: order.sitterUserId, nickname: order.sitterNickname, avatar: order.sitterAvatar }
            : { id: order.ownerUserId, nickname: order.ownerNickname, avatar: order.ownerAvatar }
        };
      });
      
      // 返回成功响应
      res.status(200).json({
        success: true,
        data: {
          orders: formattedOrders,
          pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages
          }
        }
      });
    } catch (error) {
      console.error('获取我的订单列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取订单列表失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 获取订单详情
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  static async getOrderDetail(req, res) {
    try {
      // 获取订单ID
      const orderId = req.params.id;
      
      // 获取当前用户ID
      const userId = req.user.id;
      
      // 获取订单详情
      const order = await Order.findById(orderId);
      
      // 验证订单是否存在
      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }
      
      // 验证用户是否有权限查看该订单（必须是订单的宠物主或帮溜员）
      if (order.ownerUserId !== userId && order.sitterUserId !== userId) {
        return res.status(403).json({
          success: false,
          message: '您无权查看此订单'
        });
      }
      
      // 状态文本映射
      const statusTextMap = {
        'pending': '待接单',
        'accepted': '待支付',
        'paid': '待服务',
        'ongoing': '服务中',
        'completed': '已完成',
        'cancelled': '已取消'
      };
      
      // 服务类型文本映射
      const serviceTypeTextMap = {
        'walk': '遛狗',
        'feed': '喂食',
        'boarding': '寄养'
      };
      
      // 解析位置坐标
      let locationCoords = null;
      if (order.locationCoords) {
        try {
          locationCoords = JSON.parse(order.locationCoords);
        } catch (e) {
          console.error('解析位置坐标失败:', e);
        }
      }
      
      // 构建响应数据
      const responseData = {
        orderId: order.id,
        status: order.status,
        statusText: statusTextMap[order.status] || order.status,
        pet: {
          id: order.petId,
          name: order.petName,
          photo: order.petPhoto
        },
        serviceType: order.serviceType,
        serviceTypeText: serviceTypeTextMap[order.serviceType] || order.serviceType,
        serviceDate: order.serviceDate,
        startTime: order.startTime,
        endTime: order.endTime,
        timeRange: `${order.startTime} - ${order.endTime}`,
        address: order.address,
        locationCoords: locationCoords,
        remarks: order.remarks,
        owner: {
          id: order.ownerUserId,
          nickname: order.ownerNickname,
          avatar: order.ownerAvatar
        },
        sitter: {
          id: order.sitterUserId,
          nickname: order.sitterNickname,
          avatar: order.sitterAvatar
        },
        payment: {
          price: order.price,
          isPaid: ['paid', 'ongoing', 'completed'].includes(order.status)
        },
        track: [], // 轨迹数据，MVP阶段为空数组
        report: [], // 服务报告，MVP阶段为空数组
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      };
      
      // 返回成功响应
      res.status(200).json({
        success: true,
        data: responseData
      });
    } catch (error) {
      console.error('获取订单详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取订单详情失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 取消订单
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  static async cancelOrder(req, res) {
    try {
      // 获取订单ID
      const orderId = req.params.id;
      
      // 获取当前用户ID
      const userId = req.user.id;
      
      // 获取订单详情
      const order = await Order.findById(orderId);
      
      // 验证订单是否存在
      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }
      
      // 验证用户是否有权限取消该订单（必须是订单的宠物主或帮溜员）
      if (order.ownerUserId !== userId && order.sitterUserId !== userId) {
        return res.status(403).json({
          success: false,
          message: '您无权取消此订单'
        });
      }
      
      // 验证订单状态是否允许取消（只能取消待接单、待支付、待服务状态的订单）
      const cancelableStatuses = ['pending', 'accepted', 'paid'];
      if (!cancelableStatuses.includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: '当前订单状态不允许取消'
        });
      }
      
      // 更新订单状态为已取消
      const success = await Order.updateStatus(orderId, 'cancelled');
      
      if (!success) {
        return res.status(500).json({
          success: false,
          message: '取消订单失败'
        });
      }
      
      // 返回成功响应
      res.status(200).json({
        success: true,
        message: '订单已取消'
      });
    } catch (error) {
      console.error('取消订单失败:', error);
      res.status(500).json({
        success: false,
        message: '取消订单失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 开始服务
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  static async startService(req, res) {
    try {
      // 获取订单ID
      const orderId = req.params.id;
      
      // 获取当前用户ID（帮溜员）
      const sitterId = req.user.id;
      
      // 获取请求体中的数据
      const { photoUrl, location } = req.body;
      
      // 验证必填字段
      if (!photoUrl) {
        return res.status(400).json({
          success: false,
          message: '缺少必填字段：photoUrl'
        });
      }
      
      // 获取订单详情
      const order = await Order.findById(orderId);
      
      // 验证订单是否存在
      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }
      
      // 验证用户是否是该订单的帮溜员
      if (order.sitterUserId !== sitterId) {
        return res.status(403).json({
          success: false,
          message: '您不是该订单的帮溜员'
        });
      }
      
      // 验证订单状态是否为待服务
      if (order.status !== 'paid') {
        return res.status(400).json({
          success: false,
          message: '只能开始待服务状态的订单'
        });
      }
      
      // 创建服务报告（开始服务打卡）
      const reportData = {
        orderId,
        text: '服务开始打卡',
        imageUrls: JSON.stringify([photoUrl]),
        videoUrl: null
      };
      
      // 保存位置信息（如果有）
      let locationData = null;
      if (location) {
        locationData = {
          orderId,
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address || null,
          distance: location.distance || null,
          type: 'start' // 标记为开始服务的位置
        };
      }
      
      // 更新订单状态为服务中
      const success = await Order.startService(orderId, reportData, locationData);
      
      if (!success) {
        return res.status(500).json({
          success: false,
          message: '开始服务失败'
        });
      }
      
      // 返回成功响应
      res.status(200).json({
        success: true,
        message: '服务已开始'
      });
    } catch (error) {
      console.error('开始服务失败:', error);
      res.status(500).json({
        success: false,
        message: '开始服务失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 完成服务
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  static async completeService(req, res) {
    try {
      // 获取订单ID
      const orderId = req.params.id;
      
      // 获取当前用户ID（帮溜员）
      const sitterId = req.user.id;
      
      // 获取请求体中的数据
      const { photoUrl, location } = req.body;
      
      // 验证必填字段
      if (!photoUrl) {
        return res.status(400).json({
          success: false,
          message: '缺少必填字段：photoUrl'
        });
      }
      
      // 获取订单详情
      const order = await Order.findById(orderId);
      
      // 验证订单是否存在
      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }
      
      // 验证用户是否是该订单的帮溜员
      if (order.sitterUserId !== sitterId) {
        return res.status(403).json({
          success: false,
          message: '您不是该订单的帮溜员'
        });
      }
      
      // 验证订单状态是否为服务中
      if (order.status !== 'ongoing') {
        return res.status(400).json({
          success: false,
          message: '只能完成服务中状态的订单'
        });
      }
      
      // 创建服务报告（完成服务打卡）
      const reportData = {
        orderId,
        text: '服务完成打卡',
        imageUrls: JSON.stringify([photoUrl]),
        videoUrl: null
      };
      
      // 保存位置信息（如果有）
      let locationData = null;
      if (location) {
        locationData = {
          orderId,
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address || null,
          distance: location.distance || null,
          type: 'end' // 标记为结束服务的位置
        };
      }
      
      // 更新订单状态为已完成
      const success = await Order.completeService(orderId, reportData, locationData);
      
      if (!success) {
        return res.status(500).json({
          success: false,
          message: '完成服务失败'
        });
      }
      
      // 返回成功响应
      res.status(200).json({
        success: true,
        message: '服务已完成'
      });
    } catch (error) {
      console.error('完成服务失败:', error);
      res.status(500).json({
        success: false,
        message: '完成服务失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 添加服务报告
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  static async addServiceReport(req, res) {
    try {
      // 获取订单ID
      const orderId = req.params.id;
      
      // 获取当前用户ID（帮溜员）
      const sitterId = req.user.id;
      
      // 获取请求体中的数据
      const { text, imageUrls, videoUrl } = req.body;
      
      // 验证至少有一种媒体内容
      if (!imageUrls && !videoUrl) {
        return res.status(400).json({
          success: false,
          message: '服务报告必须包含图片或视频'
        });
      }
      
      // 获取订单详情
      const order = await Order.findById(orderId);
      
      // 验证订单是否存在
      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }
      
      // 验证用户是否是该订单的帮溜员
      if (order.sitterUserId !== sitterId) {
        return res.status(403).json({
          success: false,
          message: '您不是该订单的帮溜员'
        });
      }
      
      // 验证订单状态是否为服务中
      if (order.status !== 'ongoing') {
        return res.status(400).json({
          success: false,
          message: '只能为服务中状态的订单添加报告'
        });
      }
      
      // 创建服务报告
      const reportData = {
        orderId,
        text: text || '',
        imageUrls: imageUrls ? JSON.stringify(imageUrls) : null,
        videoUrl: videoUrl || null
      };
      
      // 保存服务报告
      const reportId = await Order.addReport(reportData);
      
      if (!reportId) {
        return res.status(500).json({
          success: false,
          message: '添加服务报告失败'
        });
      }
      
      // 返回成功响应
      res.status(201).json({
        success: true,
        message: '服务报告已添加',
        reportId
      });
    } catch (error) {
      console.error('添加服务报告失败:', error);
      res.status(500).json({
        success: false,
        message: '添加服务报告失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 添加轨迹点
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  static async addTrackPoint(req, res) {
    try {
      // 获取订单ID
      const orderId = req.params.id;
      
      // 获取当前用户ID（帮溜员）
      const sitterId = req.user.id;
      
      // 获取请求体中的数据
      const { latitude, longitude } = req.body;
      
      // 验证必填字段
      if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({
          success: false,
          message: '缺少必填字段：latitude, longitude'
        });
      }
      
      // 获取订单详情
      const order = await Order.findById(orderId);
      
      // 验证订单是否存在
      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }
      
      // 验证用户是否是该订单的帮溜员
      if (order.sitterUserId !== sitterId) {
        return res.status(403).json({
          success: false,
          message: '您不是该订单的帮溜员'
        });
      }
      
      // 验证订单状态是否为服务中
      if (order.status !== 'ongoing') {
        return res.status(400).json({
          success: false,
          message: '只能为服务中状态的订单添加轨迹点'
        });
      }
      
      // 验证是否为遛狗服务
      if (order.serviceType !== 'walk') {
        return res.status(400).json({
          success: false,
          message: '只有遛狗服务才能添加轨迹点'
        });
      }
      
      // 创建轨迹点数据
      const trackData = {
        orderId,
        latitude,
        longitude
      };
      
      // 保存轨迹点
      const trackId = await Order.addTrackPoint(trackData);
      
      if (!trackId) {
        return res.status(500).json({
          success: false,
          message: '添加轨迹点失败'
        });
      }
      
      // 返回成功响应
      res.status(201).json({
        success: true,
        message: '轨迹点已添加',
        trackId
      });
    } catch (error) {
      console.error('添加轨迹点失败:', error);
      res.status(500).json({
        success: false,
        message: '添加轨迹点失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = OrderController; 