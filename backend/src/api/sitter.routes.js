const express = require('express');
const router = express.Router();
const SitterController = require('../controllers/sitter.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// 所有帮溜员相关的路由都需要认证
router.use(authMiddleware);

// 获取当前用户的帮溜员资料
router.get('/profile', SitterController.getProfile);

// 更新当前用户的帮溜员资料
router.put('/profile', SitterController.updateProfile);

// 获取所有帮溜员列表（公开列表，用于宠物主浏览）
router.get('/', SitterController.getSitters);

// 获取指定帮溜员的公开资料
router.get('/:id', SitterController.getSitterById);

module.exports = router; 