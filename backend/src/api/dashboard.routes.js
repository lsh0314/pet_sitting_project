const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboard.controller.js');
const authMiddleware  = require('../middlewares/auth.middleware.js');
const adminMiddleware  = require('../middlewares/admin.middleware.js');

// 管理员仪表盘数据路由
router.get('/admin/statistics', authMiddleware, adminMiddleware, DashboardController.getStatistics)
router.get('/admin/recent-orders', authMiddleware, adminMiddleware, DashboardController.getRecentOrders)
router.get('/admin/order-trend', authMiddleware, adminMiddleware, DashboardController.getOrderTrend)
router.get('/admin/service-distribution', authMiddleware, adminMiddleware, DashboardController.getServiceDistribution)
router.get('/admin/pet-count', authMiddleware, adminMiddleware, DashboardController.getPetCount)

// 公开的统计数据路由
router.get('/public/pet-count', DashboardController.getPetCount)

module.exports = router;
