# 小程序开发规则 (miniprogram.md)

## 1. 核心职责

小程序是面向最终用户的界面，负责 UI 展示和用户交互。它不应包含任何核心业务逻辑。

## 2. API 请求

- 所有对后端 API 的请求都必须封装在 `utils/api.js` 文件中。
- `api.js` 中封装的请求函数需要自动从 `wx.getStorageSync` 读取 JWT `token`，并添加到请求的 `Authorization` 头中。
- 对请求进行统一的错误处理和加载提示（`wx.showLoading` / `wx.hideLoading`）。

## 3. 状态管理

- **用户认证 Token**: 必须使用 `wx.setStorageSync` / `wx.getStorageSync` 进行持久化存储。
- **全局应用级状态**: 如登录后的用户信息，应存储在 `app.js` 的 `globalData` 中。
- **页面级状态**: 每个页面的数据都存放在各自 `.js` 文件的 `data` 对象中。

## 4. 组件化

- 对于在多个页面中重复使用的 UI 部分（如订单卡片、宠物信息卡片），必须抽离为自定义组件，存放在 `components/` 目录下。

## 5. 页面导航

- 页面之间的跳转统一使用 `wx.navigateTo` 或 `wx.switchTab` 等原生 API。
- 页面间传递复杂数据时，优先考虑使用事件总线（EventBus）或全局状态管理。
