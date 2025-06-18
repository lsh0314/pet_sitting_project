const Verification = require('../models/verification.model');

/**
 * 获取认证列表
 */
const getVerifications = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, status, keyword } = req.query;
    
    const result = await Verification.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      status,
      keyword
    });

    res.json({
      success: true,
      data: {
        items: result.rows,
        total: result.total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取认证列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取认证列表失败'
    });
  }
};

/**
 * 获取认证详情
 */
const getVerificationDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const verification = await Verification.findById(id);

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: '认证记录不存在'
      });
    }

    res.json({
      success: true,
      data: verification
    });
  } catch (error) {
    console.error('获取认证详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取认证详情失败'
    });
  }
};

/**
 * 审核认证申请
 */
const reviewVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    // 验证参数
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: '无效的审核操作'
      });
    }

    // 如果是拒绝操作，必须提供原因
    if (action === 'reject' && !reason) {
      return res.status(400).json({
        success: false,
        message: '拒绝时必须提供原因'
      });
    }

    // 获取认证记录
    const verification = await Verification.findById(id);
    if (!verification) {
      return res.status(404).json({
        success: false,
        message: '认证记录不存在'
      });
    }

    // 检查状态是否允许审核
    if (verification.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '该认证申请已经处理过了'
      });
    }

    // 更新状态
    const status = action === 'approve' ? 'approved' : 'rejected';
    const admin_comment = action === 'reject' ? reason : '审核通过';
    
    const result = await Verification.updateStatus(id, {
      status,
      admin_comment,
      reviewed_by_admin_id: req.user.id, // 记录审核人
      updated_at: new Date()
    });

    // 如果是通过认证，更新用户的实名认证状态
    if (action === 'approve' && verification.type === 'identity') {
      await Verification.updateUserIdentityStatus(verification.user_id, true);
    }

    res.json({
      success: true,
      message: action === 'approve' ? '审核通过成功' : '审核拒绝成功',
      data: result
    });

  } catch (error) {
    console.error('审核认证失败:', error);
    res.status(500).json({
      success: false,
      message: '审核认证失败: ' + error.message
    });
  }
};

module.exports = {
  getVerifications,
  getVerificationDetail,
  reviewVerification
};
