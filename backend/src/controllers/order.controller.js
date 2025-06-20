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
          'pending_confirm': '待确认',
          'pending_review': '待评价',
          'completed': '已完成',
          'confirmed': '已确定',
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
          address: order.address, // 添加地址字段
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
        'pending_confirm': '待确认',
        'pending_review': '待评价',
        'completed': '已完成',
        'confirmed': '已确定',
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
      
      // 获取服务报告（包括打卡照片）
      let reports = [];
      try {
        console.log(`获取订单 ${orderId} 的服务报告`);
        reports = await Order.getReports(orderId);
        console.log('从Order.getReports获取的报告:', JSON.stringify(reports));
        
        // 报告中的imageUrls已经在getReports方法中解析过，不需要再次解析
      } catch (e) {
        console.error('获取服务报告失败:', e);
      }
      
      // 获取GPS轨迹点（如果是遛狗服务）
      let tracks = [];
      if (order.serviceType === 'walk') {
        try {
          tracks = await Order.getTrackPoints(orderId);
        } catch (e) {
          console.error('获取GPS轨迹点失败:', e);
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
        reports: reports, // 添加服务报告
        tracks: tracks,   // 添加GPS轨迹点
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
      
      console.log('开始服务请求数据:', req.body);
      
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
        imageUrls: JSON.stringify([photoUrl]), // 确保是JSON字符串
        videoUrl: null
      };
      
      console.log('服务报告数据:', reportData);
      
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
      
      console.log('完成服务请求数据:', req.body);
      
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
        imageUrls: JSON.stringify([photoUrl]), // 确保是JSON字符串
        videoUrl: null
      };
      
      console.log('服务报告数据:', reportData);
      
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
      const { latitude, longitude, address, distance, type } = req.body;
      
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
        longitude,
        address,
        distance,
        type
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

  /**
   * 获取订单轨迹点列表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  static async getOrderTracks(req, res) {
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
      
      // 验证是否为遛狗服务
      if (order.serviceType !== 'walk') {
        return res.status(400).json({
          success: false,
          message: '只有遛狗服务才有轨迹点'
        });
      }
      
      // 获取轨迹点列表
      const tracks = await Order.getTrackPoints(orderId);
      
      // 返回成功响应
      res.status(200).json({
        success: true,
        data: tracks
      });
    } catch (error) {
      console.error('获取轨迹点列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取轨迹点列表失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 获取订单服务报告列表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  static async getOrderReports(req, res) {
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
      
      // 获取服务报告列表
      const reports = await Order.getReports(orderId);
      
      // 返回成功响应
      res.status(200).json({
        success: true,
        data: reports
      });
    } catch (error) {
      console.error('获取服务报告列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取服务报告列表失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 确认服务完成
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  static async confirmService(req, res) {
    try {
      // 获取订单ID
      const orderId = req.params.id;
      
      // 获取当前用户ID（宠物主）
      const ownerId = req.user.id;
      
      // 获取订单详情
      const order = await Order.findById(orderId);
      
      // 验证订单是否存在
      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }
      
      // 验证用户是否是该订单的宠物主
      if (order.ownerUserId !== ownerId) {
        return res.status(403).json({
          success: false,
          message: '您不是该订单的宠物主'
        });
      }
      
      // 验证订单状态是否为待确认
      if (order.status !== 'pending_confirm') {
        return res.status(400).json({
          success: false,
          message: '只能确认待确认状态的订单'
        });
      }
      
      // 确认服务完成
      const success = await Order.confirmService(orderId);
      
      if (!success) {
        return res.status(500).json({
          success: false,
          message: '确认服务完成失败'
        });
      }
      
      // 返回成功响应
      res.status(200).json({
        success: true,
        message: '服务已确认完成'
      });
    } catch (error) {
      console.error('确认服务完成失败:', error);
      res.status(500).json({
        success: false,
        message: '确认服务完成失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 添加订单评价
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  static async addReview(req, res) {
    try {
      // 获取订单ID
      const orderId = req.params.id;
      
      // 获取当前用户ID
      const userId = req.user.id;
      
      // 获取请求体中的数据
      const { rating, comment, tags, isAnonymous } = req.body;
      
      // 验证必填字段
      if (rating === undefined) {
        return res.status(400).json({
          success: false,
          message: '缺少必填字段：rating'
        });
      }
      
      // 验证评分范围
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: '评分必须在1-5之间'
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
      
      // 验证用户是否是该订单的宠物主或帮溜员
      if (order.ownerUserId !== userId && order.sitterUserId !== userId) {
        return res.status(403).json({
          success: false,
          message: '您无权评价此订单'
        });
      }
      
      // 验证订单状态是否为已确认或已完成
      const validStatuses = ['completed', 'confirmed', 'pending_review'];
      if (!validStatuses.includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: '只能评价已完成或已确认的订单'
        });
      }
      
      // 确定评价者和被评价者
      let revieweeUserId;
      if (userId === order.ownerUserId) {
        // 宠物主评价帮溜员
        revieweeUserId = order.sitterUserId;
      } else {
        // 帮溜员评价宠物主
        revieweeUserId = order.ownerUserId;
      }
      
      // 创建评价数据
      const reviewData = {
        orderId,
        reviewerUserId: userId,
        revieweeUserId,
        rating,
        comment,
        tags,
        isAnonymous
      };
      
      // 保存评价
      const reviewId = await Order.addReview(reviewData);
      
      if (!reviewId) {
        return res.status(400).json({
          success: false,
          message: '您已经评价过此订单'
        });
      }
      
      // 如果是宠物主评价帮溜员，更新帮溜员的评分
      if (userId === order.ownerUserId) {
        // TODO: 更新帮溜员的平均评分（未来迭代）
      }
      
      // 注意：订单状态更新已经在 Order.addReview 方法中处理
      
      // 返回成功响应
      res.status(201).json({
        success: true,
        message: '评价已提交',
        reviewId
      });
    } catch (error) {
      console.error('添加评价失败:', error);
      res.status(500).json({
        success: false,
        message: '添加评价失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 获取订单评价
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  static async getOrderReview(req, res) {
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
          message: '您无权查看此订单评价'
        });
      }
      
      // 获取订单评价
      const review = await Order.getReview(orderId);
      
      if (!review) {
        return res.status(404).json({
          success: false,
          message: '该订单暂无评价'
        });
      }
      
      // 返回成功响应
      res.status(200).json({
        success: true,
        data: review
      });
    } catch (error) {
      console.error('获取订单评价失败:', error);
      res.status(500).json({
        success: false,
        message: '获取订单评价失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 获取订单详情（管理员）
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  static async getAdminOrderDetail(req, res) {
    try {
      // 获取订单ID
      const orderId = req.params.id;
      
      // 获取订单详情
      const order = await Order.findById(orderId);
      
      // 验证订单是否存在
      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }
      
      // 状态文本映射
      const statusTextMap = {
        'pending': '待接单',
        'accepted': '待支付',
        'paid': '待服务',
        'ongoing': '服务中',
        'pending_confirm': '待确认',
        'pending_review': '待评价',
        'completed': '已完成',
        'confirmed': '已确定',
        'cancelled': '已取消'
      };
      
      // 服务类型文本映射
      const serviceTypeTextMap = {
        'walk': '遛狗',
        'feed': '喂食',
        'boarding': '寄养'
      };
      
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
   * 获取所有订单列表（管理员）
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  /**
 * 获取所有订单列表（管理员）
 */
  static async getAllOrders(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        orderId,
        username,
        serviceType,
        status,
        startDate,
        endDate
      } = req.query;
  
      // 确保分页参数是数字类型
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      
      // 查询选项
      const options = {
        page: Math.max(1, pageNum),  // 确保页码至少为1
        limit: Math.max(1, Math.min(100, limitNum)),  // 限制每页条数在1-100之间
        orderId,
        username,
        serviceType,
        status,
        startDate,
        endDate
      };
      
      // 获取订单列表
      const result = await Order.findAll(options);
      
      // 检查是否有数据
      if (!result.rows || result.rows.length === 0) {
        return res.status(200).json({
          success: true,
          data: {
            items: [],
            total: 0,
            page: pageNum,
            limit: limitNum
          }
        });
      }
      
      // 简化返回数据，只包含前端列表需要的关键信息
      const simplifiedOrders = result.rows.map(order => ({
        id: order.id,
        status: order.status,
        serviceType: order.service_type,
        serviceDate: order.service_date,
        price: order.price,
        petName: order.pet_name,
        ownerName: order.owner_nickname,
        sitterName: order.sitter_nickname,
        createdAt: order.created_at
      }));

      // 返回成功响应
      res.status(200).json({
        success: true,
        data: {
          items: simplifiedOrders,
          total: result.total,
          page: pageNum,
          limit: limitNum
        }
      });
    } catch (error) {
      console.error('获取订单列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取订单列表失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 更新订单状态（管理员）
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  static async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
  
      // 验证状态值
      const validStatuses = ['pending', 'accepted', 'paid', 'in_progress', 'completed', 'cancelled', 'refunded'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: '无效的订单状态'
        });
      }
  
      // 更新订单状态
      const result = await Order.updateStatus(id, status, req.user.id);
  
      if (!result) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }
  
      // 返回成功响应
      res.status(200).json({
        success: true,
        message: '订单状态更新成功'
      });
    } catch (error) {
      console.error('更新订单状态失败:', error);
      res.status(500).json({
        success: false,
        message: '更新订单状态失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 导出订单数据（管理员）
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  static async exportOrders(req, res) {
  try {
    const {
      orderId,
      username,
      serviceType,
      status,
      startDate,
      endDate
    } = req.query;

    // 查询选项
    const options = {
      orderId,
      username,
      serviceType,
      status,
      startDate,
      endDate
    };

    // 获取所有符合条件的订单
    const orders = await Order.exportData(options);

    // 创建CSV数据
    const fields = [
      '订单ID',
      '用户名',
      '宠物名',
      '服务类型',
      '服务日期',
      '服务时间',
      '服务地址',
      '订单金额',
      '订单状态',
      '创建时间'
    ];

    const csv = [
      fields.join(','), // 表头
      ...orders.map(order => {
        return [
          order.id,
          order.username,
          order.petName,
          order.serviceType,
          order.serviceDate,
          `${order.startTime}-${order.endTime}`,
          `"${order.address.replace(/"/g, '""')}"`, // 处理地址中可能存在的逗号
          order.price,
          order.status,
          order.createdAt
        ].join(',');
      })
    ].join('\n');

    // 设置响应头
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=orders-${new Date().toISOString()}.csv`);
    res.charset = 'utf-8'; // 明确设置字符集

    // 发送CSV数据
    res.send(Buffer.from('\ufeff' + csv, 'utf-8')); // 使用Buffer确保编码正确
  } catch (error) {
    console.error('导出订单数据失败:', error);
    res.status(500).json({
      success: false,
      message: '导出订单数据失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

}

module.exports = OrderController;
