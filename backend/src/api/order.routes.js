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

// 获取GPS轨迹点列表（需要认证）
router.get('/:id/tracks', authMiddleware, OrderController.getOrderTracks);

// 获取服务报告列表（需要认证）
router.get('/:id/reports', authMiddleware, OrderController.getOrderReports);

// 确认服务完成（需要认证）
router.post('/:id/confirm', authMiddleware, OrderController.confirmService);

// 评价订单（需要认证）
router.post('/:id/review', authMiddleware, OrderController.addReview);

module.exports = router; 