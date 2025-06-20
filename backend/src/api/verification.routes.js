const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verification.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');

// 用户提交认证申请
router.post('/apply', authMiddleware, verificationController.submitVerification);

// 获取认证列表
router.get('/admin/list', authMiddleware, adminMiddleware, verificationController.getVerifications);

// 获取认证详情
router.get('/admin/:id', authMiddleware, adminMiddleware, verificationController.getVerificationDetail);

// 审核认证
router.post('/admin/:id/review', authMiddleware, adminMiddleware, verificationController.reviewVerification);

module.exports = router;
