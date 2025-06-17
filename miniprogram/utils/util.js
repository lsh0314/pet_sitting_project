/**
 * 格式化时间
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的时间字符串
 */
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

/**
 * 格式化数字
 * @param {number} n - 数字
 * @returns {string} 格式化后的数字字符串
 */
const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

/**
 * 格式化日期
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的日期字符串
 */
const formatDate = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  return `${[year, month, day].map(formatNumber).join('-')}`
}

/**
 * 格式化价格，保留两位小数
 * @param {number} price - 价格
 * @returns {string} 格式化后的价格字符串
 */
const formatPrice = price => {
  return parseFloat(price).toFixed(2)
}

/**
 * 获取当前日期的字符串表示
 * @returns {string} 当前日期字符串
 */
const getCurrentDate = () => {
  return formatDate(new Date())
}

/**
 * 获取指定天数后的日期
 * @param {number} days - 天数
 * @returns {string} 日期字符串
 */
const getDateAfterDays = (days) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return formatDate(date)
}

/**
 * 检查对象是否为空
 * @param {Object} obj - 对象
 * @returns {boolean} 是否为空
 */
const isEmptyObject = (obj) => {
  return Object.keys(obj).length === 0
}

/**
 * 深拷贝对象
 * @param {Object} obj - 需要拷贝的对象
 * @returns {Object} 拷贝后的对象
 */
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * 生成随机字符串
 * @param {number} length - 字符串长度
 * @returns {string} 随机字符串
 */
const randomString = (length = 16) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 获取服务类型显示文本
 * @param {string} type - 服务类型
 * @returns {string} 显示文本
 */
const getServiceTypeText = (type) => {
  const typeMap = {
    'walk': '遛狗',
    'feed': '喂食',
    'boarding': '寄养'
  }
  return typeMap[type] || '未知服务'
}

/**
 * 获取订单状态显示文本
 * @param {string} status - 订单状态
 * @returns {string} 显示文本
 */
const getOrderStatusText = (status) => {
  const statusMap = {
    'accepted': '等待支付',
    'paid': '待开始',
    'ongoing': '服务中',
    'completed': '待确认',
    'confirmed': '已完成',
    'cancelled': '已取消'
  }
  return statusMap[status] || '未知状态'
}

module.exports = {
  formatTime,
  formatNumber,
  formatDate,
  formatPrice,
  getCurrentDate,
  getDateAfterDays,
  isEmptyObject,
  deepClone,
  randomString,
  getServiceTypeText,
  getOrderStatusText
} 