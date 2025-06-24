const Verification = require('../models/verification.model');

/**
 * 用户提交认证申请
 */
const submitVerification = async (req, res) => {
  try {
    const { type, submitted_data } = req.body;
    const userId = req.user.id;
    
    // 验证参数
    if (!type || !submitted_data) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }
    
    // 验证认证类型
    if (!['identity', 'certificate'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: '无效的认证类型'
      });
    }
    
    // 解析提交的数据
    let parsedData;
    try {
      parsedData = JSON.parse(submitted_data);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: '提交的数据格式不正确'
      });
    }
    
    // 验证身份证信息是否完整
    if (!parsedData.name || !parsedData.id_card_number || 
        !parsedData.id_card_front || !parsedData.id_card_back) {
      return res.status(400).json({
        success: false,
        message: '身份证认证信息不完整'
      });
    }
    
    // 如果是证书认证，验证是否包含证书信息
    if (type === 'certificate') {
      // 检查是否包含证书类型
      if (!parsedData.certificate_type) {
        return res.status(400).json({
          success: false,
          message: '缺少证书类型信息'
        });
      }
      
      // 检查是否至少有一个证书字段
      const hasCertificate = Object.keys(parsedData).some(key => 
        key.includes('_cert') && typeof parsedData[key] === 'string' && parsedData[key].trim() !== '');
      
      if (!hasCertificate) {
        return res.status(400).json({
          success: false,
          message: '证书认证信息不完整'
        });
      }
    }
    
    // 检查是否已有待审核或已通过的认证
    const existingVerification = await Verification.findPendingOrApprovedByUserId(userId);
    if (existingVerification) {
      const status = existingVerification.status === 'pending' ? '待审核' : '已通过';
      return res.status(400).json({
        success: false,
        message: `您已有${status}的认证申请，请勿重复提交`
      });
    }
    
    // 创建认证申请
    const result = await Verification.create({
      user_id: userId,
      type,
      submitted_data,
      status: 'pending'
    });
    
    // 更新用户的身份认证状态为待审核
    await Verification.updateUserIdentityStatus(userId, 'pending');
    
    res.json({
      success: true,
      message: '认证申请提交成功，请等待审核',
      data: { id: result.insertId }
    });
    
  } catch (error) {
    console.error('提交认证申请失败:', error);
    res.status(500).json({
      success: false,
      message: '提交认证申请失败: ' + error.message
    });
  }
};

/**
 * 获取当前用户的认证状态
 */
const getUserVerificationStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 查询用户是否有已通过的认证
    const verification = await Verification.findPendingOrApprovedByUserId(userId);
    
    if (!verification) {
      return res.json({
        success: true,
        data: {
          status: 'none',
          message: '未提交认证申请'
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        id: verification.id,
        type: verification.type,
        status: verification.status,
        created_at: verification.created_at,
        updated_at: verification.updated_at,
        admin_comment: verification.admin_comment || ''
      }
    });
    
  } catch (error) {
    console.error('获取用户认证状态失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户认证状态失败: ' + error.message
    });
  }
};

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

    // 如果是通过认证，更新用户的实名认证状态和角色
    if (action === 'approve') {
      await Verification.updateUserIdentityStatus(verification.user_id, 'approved');
      
      // 如果是证书认证类型，则将用户角色更新为sitter
      if (verification.type === 'certificate') {
        await Verification.updateUserRole(verification.user_id, 'sitter');
      }
    }

    res.json({
      success: true,
      message: action === 'approve' ? '审核通过成功' : '审核拒绝成功',
      data: result
    });

  } catch (error) {
    console.error('审核认证申请失败:', error);
    res.status(500).json({
      success: false,
      message: '审核认证申请失败: ' + error.message
    });
  }
};

module.exports = {
  submitVerification,
  getUserVerificationStatus,
  getVerifications,
  getVerificationDetail,
  reviewVerification
};
