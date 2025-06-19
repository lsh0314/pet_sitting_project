const WithdrawalModel = require('../models/withdrawal.model');
const { success, error: responseError } = require('../utils/response.util');

class WithdrawalController {
  /**
   * 获取提现申请列表(管理员)
   */
  static async listWithdrawals(req, res) {
    try {
      const { page = 1, limit = 10, status, keyword } = req.query;
      
      const items = await WithdrawalModel.findAllWithUser({
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        keyword
      });
      
      const total = await WithdrawalModel.countAll({
        status,
        keyword
      });

      return success(res, {
        items,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (err) {
      console.error('获取提现列表失败:', err);
      return responseError(res, '获取提现列表失败', 500);
    }
  }

  /**
   * 获取提现详情(管理员)
   */
  static async getWithdrawalDetail(req, res) {
    try {
      const { id } = req.params;
      const withdrawal = await WithdrawalModel.findById(id);

      if (!withdrawal) {
        return error(res, '提现记录不存在', 404);
      }

      // TODO: 添加用户和审核人信息查询
      return success(res, withdrawal);
    } catch (error) {
      console.error('获取提现详情失败:', error);
      return error(res, '获取提现详情失败');
    }
  }

  /**
   * 审核通过提现申请(管理员)
   */
  static async approveWithdrawal(req, res) {
    try {
      const { id } = req.params;
      
      const withdrawal = await WithdrawalModel.findById(id);
      if (!withdrawal) {
        return error(res, '提现记录不存在', 404);
      }

      if (withdrawal.status !== 'processing') {
        return error(res, '当前状态不可审核');
      }

      // 更新状态为已通过
      await WithdrawalModel.updateStatus(
        id,
        'approved',
        req.user.id
      );

      // TODO: 实际打款逻辑

      return success(res, null, '审核通过成功');
    } catch (error) {
      console.error('审核通过失败:', error);
      return error(res, '审核通过失败');
    }
  }

  /**
   * 拒绝提现申请(管理员)
   */
  static async rejectWithdrawal(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason || reason.trim().length < 2) {
        return error(res, '请填写有效的驳回原因');
      }

      const withdrawal = await WithdrawalModel.findById(id);
      if (!withdrawal) {
        return error(res, '提现记录不存在', 404);
      }

      if (withdrawal.status !== 'processing') {
        return error(res, '当前状态不可审核');
      }

      // 更新状态为已拒绝
      await WithdrawalModel.updateStatus(
        id,
        'rejected',
        req.user.id,
        reason.trim()
      );

      // TODO: 通知用户

      return success(res, null, '审核驳回成功');
    } catch (error) {
      console.error('审核驳回失败:', error);
      return error(res, '审核驳回失败');
    }
  }
}

module.exports = WithdrawalController;
