const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');

// 用户个人相关
router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, userController.updateProfile);

// 管理员用户管理接口
router.get('/admin/list', authMiddleware, adminMiddleware, userController.getUserList);
router.put('/admin/:id/status', authMiddleware, adminMiddleware, userController.updateUserStatus);
router.get('/admin/search', authMiddleware, adminMiddleware, userController.searchUsers);
router.get('/admin/:id/detail', authMiddleware, adminMiddleware, userController.getUserDetail);
router.put('/admin/:id/role', authMiddleware, adminMiddleware, userController.updateUserRole);
router.put('/admin/:id/info', authMiddleware, adminMiddleware, userController.updateUserInfo);
router.get('/admin/export', authMiddleware, adminMiddleware, userController.exportUsers);

module.exports = router;
