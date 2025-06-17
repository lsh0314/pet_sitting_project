const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/order.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');

// 用户订单相关接口
router.post('/', authMiddleware, OrderController.createOrder);
router.get('/my', authMiddleware, OrderController.getMyOrders);
router.get('/:id', authMiddleware, OrderController.getOrderDetail);
router.post('/:id/cancel', authMiddleware, OrderController.cancelOrder);

// 管理员订单管理接口
router.get('/admin/list', authMiddleware, adminMiddleware, OrderController.getAllOrders);
router.get('/admin/:id', authMiddleware, adminMiddleware, OrderController.getAdminOrderDetail);
router.post('/admin/:id/status', authMiddleware, adminMiddleware, OrderController.updateOrderStatus);
router.get('/admin/export', authMiddleware, adminMiddleware, OrderController.exportOrders);

module.exports = router;
