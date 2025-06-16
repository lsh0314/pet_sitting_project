const db = require('../config/database');

class Payment {
  /**
   * 创建支付记录
   * @param {Object} paymentData - 支付数据
   * @param {number} paymentData.order_id - 订单ID
   * @param {string} paymentData.wechat_transaction_id - 微信支付交易号（MVP阶段可为空）
   * @param {number} paymentData.amount - 支付金额
   * @returns {Promise<Object>} - 创建的支付记录
   */
  static async create(paymentData) {
    try {
      // 设置支付状态为成功（MVP阶段简化处理）
      const payment = {
        ...paymentData,
        status: 'success'
      };

      const [result] = await db.query(
        'INSERT INTO payments (order_id, wechat_transaction_id, amount, status) VALUES (?, ?, ?, ?)',
        [payment.order_id, payment.wechat_transaction_id, payment.amount, payment.status]
      );

      return {
        id: result.insertId,
        ...payment
      };
    } catch (error) {
      console.error('创建支付记录失败:', error);
      throw error;
    }
  }

  /**
   * 根据订单ID获取支付记录
   * @param {number} orderId - 订单ID
   * @returns {Promise<Object|null>} - 支付记录或null
   */
  static async getByOrderId(orderId) {
    try {
      const [payments] = await db.query(
        'SELECT * FROM payments WHERE order_id = ?',
        [orderId]
      );

      return payments.length > 0 ? payments[0] : null;
    } catch (error) {
      console.error('获取支付记录失败:', error);
      throw error;
    }
  }
}

module.exports = Payment;