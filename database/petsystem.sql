-- ----------------------------
-- 数据库和表结构设计
-- 数据库名: pet_sitting_db
-- 字符集: utf8mb4
-- 排序规则: utf8mb4_unicode_ci
-- ----------------------------

-- ----------------------------
-- 1. 用户表 (users)
-- 存储所有用户，包括宠物主和帮溜员
-- ----------------------------
CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户唯一ID',
  `wechat_openid` VARCHAR(128) NOT NULL UNIQUE COMMENT '微信OpenID，用于登录凭证',
  `nickname` VARCHAR(255) DEFAULT NULL COMMENT '用户昵称',
  `avatar_url` VARCHAR(512) DEFAULT NULL COMMENT '用户头像URL',
  `gender` ENUM('male', 'female', 'other') DEFAULT NULL COMMENT '性别',
  `role` ENUM('pet_owner', 'sitter') NOT NULL DEFAULT 'pet_owner' COMMENT '用户当前主要角色',
  `status` ENUM('active', 'banned') NOT NULL DEFAULT 'active' COMMENT '账户状态',
  `identity_status` ENUM('unsubmitted', 'pending', 'approved', 'rejected') NOT NULL DEFAULT 'unsubmitted' COMMENT '实名认证状态，冗余字段方便查询',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_wechat_openid` (`wechat_openid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户基础信息表';

-- ----------------------------
-- 2. 宠物表 (pets)
-- 存储宠物主名下的宠物档案
-- ----------------------------
CREATE TABLE `pets` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '宠物唯一ID',
  `owner_user_id` BIGINT UNSIGNED NOT NULL COMMENT '宠物主人用户ID',
  `name` VARCHAR(100) NOT NULL COMMENT '宠物名',
  `photo_url` VARCHAR(512) NOT NULL COMMENT '宠物照片URL',
  `breed` VARCHAR(100) DEFAULT NULL COMMENT '品种',
  `age` VARCHAR(50) DEFAULT NULL COMMENT '年龄描述',
  `gender` ENUM('male', 'female') DEFAULT NULL COMMENT '性别',
  `weight` DECIMAL(5, 2) DEFAULT NULL COMMENT '体重(KG)',
  `is_sterilized` BOOLEAN DEFAULT FALSE COMMENT '是否绝育',
  `health_desc` TEXT DEFAULT NULL COMMENT '健康状况描述',
  `character_tags` JSON DEFAULT NULL COMMENT '性格标签数组, e.g., ["亲人", "胆小"]',
  `special_notes` TEXT DEFAULT NULL COMMENT '特殊注意事项',
  `allergy_info` TEXT DEFAULT NULL COMMENT '过敏源信息',
  `vaccine_proof_urls` JSON DEFAULT NULL COMMENT '疫苗证明图片URL数组',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_owner_user_id` (`owner_user_id`),
  FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='宠物档案表';

-- ----------------------------
-- 3. 帮溜员专业资料表 (sitter_profiles)
-- 一对一关联用户表，存储帮溜员的专业信息
-- ----------------------------
CREATE TABLE `sitter_profiles` (
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID，同时是主键和外键',
  `bio` TEXT DEFAULT NULL COMMENT '个人简介',
  `service_area` VARCHAR(255) DEFAULT NULL COMMENT '服务区域描述',
  `available_dates` JSON DEFAULT NULL COMMENT '可服务日期数组, e.g., ["2025-06-15", "2025-06-16"]',
  `total_services_completed` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '累计完成服务次数',
  `rating` DECIMAL(3, 2) NOT NULL DEFAULT 5.00 COMMENT '综合评分',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帮溜员专业资料表';

-- ----------------------------
-- 4. 帮溜员服务项目表 (sitter_services)
-- 存储帮溜员提供的服务及其定价
-- ----------------------------
CREATE TABLE `sitter_services` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sitter_user_id` BIGINT UNSIGNED NOT NULL COMMENT '帮溜员用户ID',
  `service_type` ENUM('walk', 'feed', 'boarding') NOT NULL COMMENT '服务类型',
  `price` DECIMAL(10, 2) NOT NULL COMMENT '服务价格',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sitter_service` (`sitter_user_id`, `service_type`),
  FOREIGN KEY (`sitter_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帮溜员服务项目及定价表';


-- ----------------------------
-- 5. 订单表 (orders)
-- 核心业务表，记录所有服务订单
-- ----------------------------
CREATE TABLE `orders` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '订单唯一ID',
  `owner_user_id` BIGINT UNSIGNED NOT NULL COMMENT '宠物主用户ID',
  `sitter_user_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '帮溜员用户ID (接单后才有)',
  `pet_id` BIGINT UNSIGNED NOT NULL COMMENT '服务的宠物ID',
  `status` ENUM('pending', 'accepted', 'paid', 'ongoing', 'completed', 'cancelled', 'confirmed') NOT NULL DEFAULT 'pending' COMMENT '订单状态',
  `service_type` ENUM('walk', 'feed', 'boarding') NOT NULL COMMENT '服务类型',
  `service_date` DATE NOT NULL COMMENT '服务日期',
  `start_time` TIME NOT NULL COMMENT '服务开始时间',
  `end_time` TIME NOT NULL COMMENT '服务结束时间',
  `address` VARCHAR(512) NOT NULL COMMENT '服务地点',
  `remarks` TEXT DEFAULT NULL COMMENT '宠物主备注',
  `price` DECIMAL(10, 2) NOT NULL COMMENT '订单总价',
  `commission_rate` DECIMAL(5, 4) NOT NULL DEFAULT 0.1000 COMMENT '平台佣金比例（下单时确定）',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_owner_id` (`owner_user_id`),
  KEY `idx_sitter_id` (`sitter_user_id`),
  KEY `idx_pet_id` (`pet_id`),
  KEY `idx_status` (`status`),
  FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`sitter_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`pet_id`) REFERENCES `pets`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务订单表';


-- ----------------------------
-- 6. 服务报告表 (order_reports)
-- 记录服务过程中的汇报
-- ----------------------------
CREATE TABLE `order_reports` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT UNSIGNED NOT NULL COMMENT '关联的订单ID',
  `text` TEXT DEFAULT NULL COMMENT '文字描述',
  `image_urls` JSON DEFAULT NULL COMMENT '图片URL数组',
  `video_url` VARCHAR(512) DEFAULT NULL COMMENT '视频URL',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务报告表';


-- ----------------------------
-- 7. GPS轨迹表 (order_tracks)
-- 记录遛狗服务的GPS轨迹点
-- ----------------------------
CREATE TABLE `order_tracks` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT UNSIGNED NOT NULL COMMENT '关联的订单ID',
  `latitude` DECIMAL(10, 8) NOT NULL COMMENT '纬度',
  `longitude` DECIMAL(11, 8) NOT NULL COMMENT '经度',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='GPS轨迹点表';


-- ----------------------------
-- 8. 评价表 (reviews)
-- 存储订单的双向评价
-- ----------------------------
CREATE TABLE `reviews` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT UNSIGNED NOT NULL COMMENT '关联的订单ID',
  `reviewer_user_id` BIGINT UNSIGNED NOT NULL COMMENT '评价人ID',
  `reviewee_user_id` BIGINT UNSIGNED NOT NULL COMMENT '被评价人ID',
  `rating` TINYINT UNSIGNED NOT NULL COMMENT '星级评分 (1-5)',
  `comment` TEXT DEFAULT NULL COMMENT '文字评价',
  `tags` JSON DEFAULT NULL COMMENT '评价标签数组',
  `is_anonymous` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否匿名',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_reviewer` (`order_id`, `reviewer_user_id`),
  KEY `idx_reviewee_id` (`reviewee_user_id`),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reviewer_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reviewee_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单评价表';


-- ----------------------------
-- 9. 支付记录表 (payments)
-- 记录与订单相关的支付信息
-- ----------------------------
CREATE TABLE `payments` (
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

-- ----------------------------
-- 10. 提现申请表 (withdrawals)
-- 记录帮溜员的提现申请
-- ----------------------------
CREATE TABLE `withdrawals` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sitter_user_id` BIGINT UNSIGNED NOT NULL COMMENT '申请提现的帮溜员ID',
  `amount` DECIMAL(10, 2) NOT NULL COMMENT '提现金额',
  `method` ENUM('wechat', 'bank') NOT NULL COMMENT '提现方式',
  `status` ENUM('processing', 'approved', 'rejected') NOT NULL DEFAULT 'processing' COMMENT '申请状态',
  `admin_comment` VARCHAR(255) DEFAULT NULL COMMENT '管理员审核备注',
  `reviewed_by_admin_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '审核管理员ID',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sitter_id` (`sitter_user_id`),
  KEY `idx_status` (`status`),
  FOREIGN KEY (`sitter_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='提现申请表';


-- ----------------------------
-- 11. 售后申诉表 (complaints)
-- 记录用户发起的售后申诉
-- ----------------------------
CREATE TABLE `complaints` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT UNSIGNED NOT NULL COMMENT '关联的订单ID',
  `complainant_user_id` BIGINT UNSIGNED NOT NULL COMMENT '申诉人ID',
  `type` VARCHAR(100) NOT NULL COMMENT '申诉类型',
  `reason` TEXT NOT NULL COMMENT '申诉原因',
  `evidence_urls` JSON DEFAULT NULL COMMENT '证据图片/视频URL数组',
  `status` ENUM('processing', 'resolved', 'closed') NOT NULL DEFAULT 'processing' COMMENT '处理状态',
  `resolution` VARCHAR(255) DEFAULT NULL COMMENT '平台处理结果描述',
  `resolved_by_admin_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '处理管理员ID',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_complainant_id` (`complainant_user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='售后申诉表';


-- ----------------------------
-- 12. 资质认证表 (verifications)
-- 存储帮溜员的实名、证书等认证申请
-- ----------------------------
CREATE TABLE `verifications` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '申请认证的用户ID',
  `type` ENUM('identity', 'certificate') NOT NULL COMMENT '认证类型',
  `submitted_data` JSON NOT NULL COMMENT '提交的材料，如身份证照片URL等',
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending' COMMENT '审核状态',
  `admin_comment` TEXT DEFAULT NULL COMMENT '管理员审核备注（如驳回原因）',
  `reviewed_by_admin_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '审核管理员ID',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资质认证审核表';


-- ----------------------------
-- 13. 管理员表 (admins)
-- 存储后台管理员账号信息
-- ----------------------------
CREATE TABLE `admins` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(100) NOT NULL UNIQUE COMMENT '管理员用户名',
  `password_hash` VARCHAR(255) NOT NULL COMMENT '哈希后的密码',
  `role` VARCHAR(50) NOT NULL DEFAULT 'admin' COMMENT '管理员角色',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='后台管理员表';

-- ----------------------------
-- 14. 系统配置表 (system_configs)
-- 存储平台级别的可变配置
-- ----------------------------
CREATE TABLE `system_configs` (
  `config_key` VARCHAR(100) NOT NULL COMMENT '配置项的键',
  `config_value` VARCHAR(512) NOT NULL COMMENT '配置项的值',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '配置项描述',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统全局配置表';

-- 可以为该表预置一些初始数据
INSERT INTO `system_configs` (`config_key`, `config_value`, `description`) VALUES
('commission_rate', '0.1', '平台默认佣金比例 (10%)'),
('min_withdrawal_amount', '50', '最低提现金额 (元)');