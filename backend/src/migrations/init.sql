-- 创建数据库
CREATE DATABASE IF NOT EXISTS pet_sitting DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE pet_sitting;

-- 用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户唯一ID',
  `openid` VARCHAR(128) NOT NULL UNIQUE COMMENT '微信OpenID，用于登录凭证',
  `nickname` VARCHAR(255) DEFAULT NULL COMMENT '用户昵称',
  `avatar` VARCHAR(512) DEFAULT NULL COMMENT '用户头像URL',
  `gender` ENUM('male', 'female', 'other') DEFAULT NULL COMMENT '性别',
  `role` ENUM('pet_owner', 'sitter') NOT NULL DEFAULT 'pet_owner' COMMENT '用户当前主要角色',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号码',
  `email` VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
  `status` ENUM('active', 'banned') NOT NULL DEFAULT 'active' COMMENT '账户状态',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_openid` (`openid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户基础信息表';

-- 宠物表
CREATE TABLE IF NOT EXISTS `pets` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '宠物唯一ID',
  `owner_id` BIGINT UNSIGNED NOT NULL COMMENT '宠物主人用户ID',
  `name` VARCHAR(100) NOT NULL COMMENT '宠物名',
  `photo` VARCHAR(512) DEFAULT NULL COMMENT '宠物照片URL',
  `breed` VARCHAR(100) DEFAULT NULL COMMENT '品种',
  `age` VARCHAR(50) DEFAULT NULL COMMENT '年龄描述',
  `gender` ENUM('male', 'female') DEFAULT NULL COMMENT '性别',
  `weight` DECIMAL(5, 2) DEFAULT NULL COMMENT '体重(KG)',
  `is_sterilized` BOOLEAN DEFAULT FALSE COMMENT '是否绝育',
  `health_desc` TEXT DEFAULT NULL COMMENT '健康状况描述',
  `character_tags` VARCHAR(255) DEFAULT NULL COMMENT '性格标签，用逗号分隔',
  `special_notes` TEXT DEFAULT NULL COMMENT '特殊注意事项',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_owner_id` (`owner_id`),
  FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='宠物档案表';

-- 帮溜员资料表
CREATE TABLE IF NOT EXISTS `sitter_profiles` (
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID，同时是主键和外键',
  `bio` TEXT DEFAULT NULL COMMENT '个人简介',
  `service_area` VARCHAR(255) DEFAULT NULL COMMENT '服务区域描述',
  `total_services` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '累计完成服务次数',
  `rating` DECIMAL(3, 2) NOT NULL DEFAULT 5.00 COMMENT '综合评分',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帮溜员专业资料表';

-- 帮溜员服务表
CREATE TABLE IF NOT EXISTS `sitter_services` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sitter_id` BIGINT UNSIGNED NOT NULL COMMENT '帮溜员用户ID',
  `service_type` ENUM('walk', 'feed', 'boarding') NOT NULL COMMENT '服务类型',
  `price` DECIMAL(10, 2) NOT NULL COMMENT '服务价格',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sitter_service` (`sitter_id`, `service_type`),
  FOREIGN KEY (`sitter_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帮溜员服务项目及定价表';

-- 订单表
CREATE TABLE IF NOT EXISTS `orders` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '订单唯一ID',
  `owner_id` BIGINT UNSIGNED NOT NULL COMMENT '宠物主用户ID',
  `sitter_id` BIGINT UNSIGNED NOT NULL COMMENT '帮溜员用户ID',
  `pet_id` BIGINT UNSIGNED NOT NULL COMMENT '服务的宠物ID',
  `status` ENUM('pending', 'accepted', 'paid', 'ongoing', 'completed', 'cancelled', 'confirmed') NOT NULL DEFAULT 'pending' COMMENT '订单状态',
  `service_type` ENUM('walk', 'feed', 'boarding') NOT NULL COMMENT '服务类型',
  `service_date` DATE NOT NULL COMMENT '服务日期',
  `start_time` TIME NOT NULL COMMENT '服务开始时间',
  `end_time` TIME NOT NULL COMMENT '服务结束时间',
  `address` VARCHAR(512) NOT NULL COMMENT '服务地点',
  `remarks` TEXT DEFAULT NULL COMMENT '宠物主备注',
  `price` DECIMAL(10, 2) NOT NULL COMMENT '订单总价',
  `commission_rate` DECIMAL(5, 4) NOT NULL DEFAULT 0.1000 COMMENT '平台佣金比例',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_owner_id` (`owner_id`),
  KEY `idx_sitter_id` (`sitter_id`),
  KEY `idx_pet_id` (`pet_id`),
  KEY `idx_status` (`status`),
  FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`sitter_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`pet_id`) REFERENCES `pets`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务订单表';

-- 支付记录表
CREATE TABLE IF NOT EXISTS `payments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT UNSIGNED NOT NULL COMMENT '关联的订单ID',
  `transaction_id` VARCHAR(128) DEFAULT NULL UNIQUE COMMENT '支付交易号',
  `amount` DECIMAL(10, 2) NOT NULL COMMENT '支付金额',
  `status` ENUM('pending', 'success', 'failed', 'refunded') NOT NULL DEFAULT 'pending' COMMENT '支付状态',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='支付记录表';

-- 管理员表
CREATE TABLE IF NOT EXISTS `admins` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '管理员用户名',
  `password` VARCHAR(255) NOT NULL COMMENT '密码哈希',
  `name` VARCHAR(50) NOT NULL COMMENT '管理员姓名',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员表';

-- 插入默认管理员账户 (密码: admin123)
INSERT INTO `admins` (`username`, `password`, `name`) VALUES
('admin', '$2b$10$nMvzO6lQP8MMH.jSDPd2Se4XS8g4/vTdXbsMqnP.S1L8sdI5ua3/6', '系统管理员'); 