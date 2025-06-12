const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

/**
 * @route POST /api/auth/wechat-login
 * @desc 微信小程序登录
 * @access Public
 */
router.post('/wechat-login', authController.wechatLogin);

/**
 * @route POST /api/auth/admin-login
 * @desc 管理员登录
 * @access Public
 */
router.post('/admin-login', authController.adminLogin);

module.exports = router; 