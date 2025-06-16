const PaymentModel = require('../models/payment.model');
const OrderModel = require('../models/order.model');

class PaymentController {
  /**
   * 处理订单支付请求
   * MVP逻辑：不接入真实微信支付，只创建支付记录并更新订单状态
   */
  static async processOrderPayment(req, res) {
    try {
      const orderId = parseInt(req.params.id);
      
      // 1. 获取订单信息
      const order = await OrderModel.findById(orderId);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }
      
      // 2. 验证订单是否属于当前用户
      // 打印调试信息
      console.log('订单所有者ID:', order.owner_user_id || order.ownerUserId);
      console.log('当前用户ID:', req.user.id);
      
      // 使用ownerUserId字段（驼峰命名）
      if (order.ownerUserId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: '无权支付此订单'
        });
      }
      
      // 3. 验证订单状态是否为等待支付
      if (order.status !== 'accepted') {
        return res.status(400).json({
          success: false,
          message: `订单当前状态为 ${order.status}，不可支付`
        });
      }
      
      // 4. 检查订单是否已支付
      const existingPayment = await PaymentModel.getByOrderId(orderId);
      if (existingPayment) {
        return res.status(400).json({
          success: false,
          message: '订单已支付，请勿重复支付'
        });
      }
      
      // 5. 创建支付记录
      const paymentData = {
        order_id: orderId,
        wechat_transaction_id: `mock_${Date.now()}`, // MVP阶段使用模拟的交易号
        amount: order.price
      };
      
      const payment = await PaymentModel.create(paymentData);
      
      // 6. 更新订单状态为已支付
      await OrderModel.updateStatus(orderId, 'paid');
      
      // 7. 返回支付成功响应
      // 在MVP阶段，我们直接返回成功，不需要返回微信支付参数
      return res.json({
        success: true,
        message: '支付成功',
        payment: {
          id: payment.id,
          amount: payment.amount,
          status: payment.status,
          created_at: new Date()
        }
      });
      
    } catch (error) {
      console.error('处理支付失败:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误，支付处理失败'
      });
    }
  }
}

module.exports = PaymentController;