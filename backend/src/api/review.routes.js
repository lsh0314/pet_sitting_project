const express = require('express')
const router = express.Router()
const ReviewController = require('../controllers/review.controller')
const authMiddleware = require('../middlewares/auth.middleware')
const adminMiddleware = require('../middlewares/admin.middleware')

// 获取评价列表
router.get('/admin/list', authMiddleware, adminMiddleware, ReviewController.getReviewList)

// 搜索评价
router.get('/admin/search', authMiddleware, adminMiddleware, ReviewController.searchReviews)

// 获取评价详情
router.get('/admin/:id/detail', authMiddleware, adminMiddleware, ReviewController.getReviewDetail)

// 删除评价
router.delete('/admin/:id', authMiddleware, adminMiddleware, ReviewController.deleteReview)

// 回复评价
router.post('/admin/:id/update', authMiddleware, adminMiddleware, ReviewController.updateReview)

// 导出评价数据
router.get('/admin/export', authMiddleware, adminMiddleware, ReviewController.exportReviews)

// 切换评价显示状态
router.post('/admin/:id/toggle-visibility', authMiddleware, adminMiddleware, ReviewController.toggleVisibility)

module.exports = router
