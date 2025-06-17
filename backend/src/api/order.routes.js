const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/order.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// 创建订单（需要认证）
router.post('/', authMiddleware, OrderController.createOrder);

// 获取我的订单列表（需要认证）
router.get('/my', authMiddleware, OrderController.getMyOrders);

// 获取订单详情（需要认证）
router.get('/:id', authMiddleware, OrderController.getOrderDetail);

// 取消订单（需要认证）
router.post('/:id/cancel', authMiddleware, OrderController.cancelOrder);

// 开始服务（需要认证）
router.post('/:id/start', authMiddleware, OrderController.startService);

// 完成服务（需要认证）
router.post('/:id/complete', authMiddleware, OrderController.completeService);

// 上传服务报告（需要认证）
router.post('/:id/report', authMiddleware, OrderController.addServiceReport);

// 上传GPS轨迹点（需要认证）
router.post('/:id/track', authMiddleware, OrderController.addTrackPoint);

module.exports = router; 