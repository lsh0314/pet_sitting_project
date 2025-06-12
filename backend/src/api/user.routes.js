const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticateJWT } = require('../middlewares/auth.middleware');

/**
 * @route GET /api/user/profile
 * @desc 获取当前用户资料
 * @access Private
 */
router.get('/profile', authenticateJWT, userController.getProfile);

/**
 * @route PUT /api/user/profile
 * @desc 更新当前用户资料
 * @access Private
 */
router.put('/profile', authenticateJWT, userController.updateProfile);

module.exports = router; 