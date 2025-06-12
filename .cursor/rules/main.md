# 宠物帮溜平台 - 全局规则 (main.md)

## 1. 项目核心目标

本项目旨在创建一个连接宠物主和宠物帮溜员（Sitter）的在线服务平台。核心功能包括用户注册、资料管理、服务发现、订单创建、在线支付和后台管理。

详细需求请参考 `docs/需求分析.md`。

## 2. 核心架构

项目采用前后端分离的客户端-服务器架构。

- **后端**: Node.js + Express.js, 提供 RESTful API。
- **小程序端**: 微信小程序，面向宠物主和帮溜员。
- **Web 管理后台**: Vue.js 3，面向平台管理员。

详细架构设计请参考 `docs/architecture.md`。

## 3. 全局技术栈

- **后端**: Node.js, Express.js, MySQL2, jsonwebtoken
- **数据库**: MySQL
- **小程序**: 原生微信小程序语法
- **管理后台**: Vue 3 (Composition API, `<script setup>`), Vite, Pinia, Vue Router, Element Plus

## 4. 通用编码规范

- **代码注释**: 核心业务逻辑必须有中文注释。
- **命名**: 变量和函数名使用驼峰命名法 (camelCase)。
- **API 风格**: 严格遵循 RESTful 设计原则。

## 5. 模块特定规则

在为项目的特定部分编写代码时，请务必遵循以下相应文件中的规则：

- **后端开发**: 遵循 `.cursor-rules/backend.md`
- **小程序开发**: 遵循 `.cursor-rules/miniprogram.md`
- **Web 管理后台开发**: 遵循 `.cursor-rules/admin-web.md`
- **数据库操作**: 遵循 `.cursor-rules/database.md`
