const express = require('express');
const router = express.Router();
const SitterController = require('../controllers/sitter.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// 公开接口 - 不需要认证
// 获取所有帮溜员列表（公开列表，用于宠物主浏览）
router.get('/', SitterController.getSitters);

// 需要认证的接口
// 获取当前用户的帮溜员资料
router.get('/profile', authMiddleware, SitterController.getProfile);

// 更新当前用户的帮溜员资料
router.put('/profile', authMiddleware, SitterController.updateProfile);

// 公开接口 - 获取指定帮溜员的公开资料
router.get('/:id([0-9]+)', SitterController.getSitterById);

module.exports = router; 