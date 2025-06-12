# Web 管理后台开发规则 (admin-web.md)

## 1. 技术栈规范

- **框架**: 必须使用 Vue 3 的 Composition API 写法，并使用 `<script setup>` 语法糖。
- **UI 库**: 遵循 Element Plus 组件库的使用规范。
- **状态管理**: 使用 Pinia 进行全局状态管理。每个业务模块（如用户、订单）可以有自己的 store，存放在 `src/store/` 目录下。

## 2. API 请求

- 所有 API 请求封装在 `src/api/` 目录下，按模块创建不同的文件，如 `user.js`, `order.js`。
- 使用 `axios` 拦截器统一处理请求头的 `Authorization` Token 附加和响应的错误处理。

## 3. 路由

- 路由配置在 `src/router/index.js` 中。
- 每个视图（View）对应一个路由，存放在 `src/views/` 目录下。
- 使用路由守卫（`beforeEach`）进行登录状态校验和页面访问权限控制。

## 4. 编码风格

- 组件文件名使用大驼峰命名法 (PascalCase)，如 `UserList.vue`。
- 遵循 Vue 官方推荐的编码风格。
