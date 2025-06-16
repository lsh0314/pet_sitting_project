-- 创建支付记录表 (payments)
CREATE TABLE IF NOT EXISTS `payments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT UNSIGNED NOT NULL COMMENT '关联的订单ID',
  `wechat_transaction_id` VARCHAR(128) DEFAULT NULL UNIQUE COMMENT '微信支付交易号',
  `amount` DECIMAL(10, 2) NOT NULL COMMENT '支付金额',
  `status` ENUM('pending', 'success', 'failed', 'refunded', 'partial_refunded') NOT NULL DEFAULT 'pending' COMMENT '支付状态',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='支付记录表';