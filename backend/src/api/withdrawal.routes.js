const express = require('express');
const router = express.Router();
const WithdrawalController = require('../controllers/withdrawal.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');

// 获取提现列表(管理员)
router.get('/admin/list', 
  authMiddleware, 
  adminMiddleware,
  WithdrawalController.listWithdrawals
);

// 获取提现详情(管理员)
router.get('/admin/:id', 
  authMiddleware,
  adminMiddleware,
  WithdrawalController.getWithdrawalDetail
);

// 审核通过提现(管理员)
router.post('/admin/:id/approve', 
  authMiddleware,
  adminMiddleware,
  WithdrawalController.approveWithdrawal
);

// 审核拒绝提现(管理员)
router.post('/admin/:id/reject', 
  authMiddleware,
  adminMiddleware,
  WithdrawalController.rejectWithdrawal
);

module.exports = router;
