const DashboardModel = require('../models/dashboard.model.js')

/**
 * 仪表盘控制器
 * 处理仪表盘相关请求
 */
class DashboardController {
  /**
   * 获取统计数据
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  static async getStatistics(req, res) {
    try {
      console.log('开始获取统计数据')
      
      const totalUsers = await DashboardModel.getTotalUsers()
      const totalOrders = await DashboardModel.getTotalOrders()
      const totalSitters = await DashboardModel.getTotalSitters()
      const totalRevenue = await DashboardModel.getTotalRevenue()

      console.log('统计数据获取成功:', {
        totalUsers,
        totalOrders,
        totalSitters,
        totalRevenue
      })

      res.json({
        success: true,
        data: {
            totalUsers,
            totalOrders,
            totalSitters,
            totalRevenue
        }
      })
    } catch (error) {
      console.error('获取统计数据失败:', error)
      res.status(500).json({
        success: false,
        message: '获取统计数据失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }

  /**
   * 获取最近订单
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  static async getRecentOrders(req, res) {
    try {
      console.log('开始获取最近订单')
      
      const orders = await DashboardModel.getRecentOrders(10)

      console.log('最近订单获取成功，数量:', orders.length)

      res.json({
        success: true,
        data: orders
      })
    } catch (error) {
      console.error('获取最近订单失败:', error)
      res.status(500).json({
        success: false,
        message: '获取最近订单失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }

  /**
   * 获取订单趋势
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  static async getOrderTrend(req, res) {
    try {
      const { timeRange } = req.query
      let days = 7
      if (timeRange === '30days') days = 30
      if (timeRange === '90days') days = 90

      console.log(`获取订单趋势数据，时间范围: ${days}天`)

      const trendData = await DashboardModel.getOrderTrend(days)

      console.log('订单趋势数据获取成功，天数:', trendData.dates.length)

      res.json({
        success: true,
        data: trendData
      })
    } catch (error) {
      console.error('获取订单趋势失败:', error)
      res.status(500).json({
        success: false,
        message: '获取订单趋势失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }

  /**
   * 获取服务类型分布
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  static async getServiceDistribution(req, res) {
    try {
      console.log('开始获取服务类型分布数据')
      
      const distribution = await DashboardModel.getServiceDistribution()

      console.log('服务类型分布数据获取成功，类型数:', distribution.length)

      res.json({
        success: true,
        data: distribution
      })
    } catch (error) {
      console.error('获取服务分布失败:', error)
      res.status(500).json({
        success: false,
        message: '获取服务分布失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }
}

module.exports = DashboardController;
