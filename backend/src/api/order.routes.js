const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/order.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// 创建订单（需要认证）
router.post('/', authMiddleware, OrderController.createOrder);

module.exports = router; 