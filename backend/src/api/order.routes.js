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

module.exports = router; 