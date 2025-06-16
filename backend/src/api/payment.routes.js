const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// 处理订单支付请求（需要认证）
router.post('/order/:id', authMiddleware, PaymentController.processOrderPayment);

module.exports = router;