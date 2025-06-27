/**
 * 工具函数集合
 */

// 格式化日期
exports.formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 其他工具函数...
exports.someOtherHelper = () => {
  // 实现...
};
