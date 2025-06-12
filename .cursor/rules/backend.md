# 后端开发规则 (backend.md)

## 1. 核心职责

后端是项目的业务逻辑和数据处理中心。所有数据必须通过后端 API 进行读写。

## 2. 文件夹结构与职责

- `src/api/` (或 `routes/`): 定义 API 路由，只负责路径和 HTTP 方法的映射，调用对应的 Controller。
- `src/controllers/`: 控制器层。负责解析 HTTP 请求参数，验证输入，调用 Service 层处理业务，并返回标准格式的 JSON 响应。
- `src/services/`: 服务层。封装并实现所有核心业务逻辑，例如计算费用、更新订单状态等。如果逻辑简单，可以合并到 Controller 层。
- `src/models/`: 模型层。定义数据库表结构映射，并提供与数据库交互的方法。
- `src/middlewares/`: 中间件。例如 `auth.middleware.js` 用于 JWT 验证。
- `src/config/`: 存放所有配置文件，如数据库连接信息。

## 3. API 响应格式

所有 API 的响应都必须遵循统一格式：

- **成功**: `{ success: true, data: { ... } }`
- **失败**: `{ success: false, errorCode: 'ERROR_CODE', message: '错误描述' }`

## 4. 错误处理

- 使用集中的错误处理中间件。
- 在 Controller 层使用 `try...catch` 结构捕获 Service 层抛出的错误，并转换为标准的错误响应。

## 5. 认证

- 所有需要用户登录才能访问的接口，都必须使用 `auth.middleware.js` 进行保护。
- 管理员接口 (`/api/admin/*`) 需要使用单独的管理员认证中间件。
