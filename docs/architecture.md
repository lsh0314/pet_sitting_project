## 🐾 宠物帮溜平台 - 开发架构说明 (Architecture.md)

### 一、 总体架构

本项目采用前后端分离的**客户端-服务器 (Client-Server)** 架构。

- **后端 (Backend)**：基于 **Node.js (Express/Koa)** 的 RESTful API 服务器，作为唯一的数据和业务逻辑中心。

- 客户端 (Clients)

  ：

  1. **小程序端 (Miniprogram)**：面向**宠物主**和**帮溜员**，提供核心业务功能。
  2. **Web管理后台 (Admin Web)**：面向**平台管理员**，提供运营和管理功能。

------

### 二、 文件与文件夹结构

这是一个推荐的、清晰的项目结构，便于团队协作和代码维护。

Plaintext

```
pet_sitting_project/
├── backend/                  # 后端服务器 (Node.js)
│   ├── src/
│   │   ├── api/              # 路由层: 定义API端点 (e.g., user.routes.js, order.routes.js)
│   │   ├── controllers/      # 控制器层: 处理请求, 调用服务, 返回响应 (e.g., user.controller.js)
│   │   ├── services/         # 服务层: 封装核心业务逻辑 (e.g., payment.service.js)
│   │   ├── models/           # 模型层: 定义数据库模型, 与数据库交互 (e.g., user.model.js)
│   │   ├── middlewares/      # 中间件层: 如JWT认证、错误处理 (e.g., auth.middleware.js)
│   │   ├── config/           # 配置层: 数据库连接, 环境变量等 (e.g., database.js)
│   │   └── utils/            # 工具函数库
│   ├── .env                  # 环境变量文件
│   ├── app.js                # Express应用主入口
│   └── package.json          # 项目依赖
│
├── miniprogram/              # 小程序端
│   ├── pages/                # 主页面
│   │   ├── index/            # 首页 (帮溜员列表/订单广场)
│   │   ├── my/               # 个人中心 (我的资料/我的宠物/我的钱包)
│   │   ├── order/            # 订单相关页面 (订单列表/订单详情/创建订单)
│   │   ├── sitter/           # 帮溜员相关页面 (帮溜员主页/我的日历)
│   │   ├── chat/             # 聊天页面
│   │   └── auth/             # 授权登录页
│   ├── components/           # 可复用UI组件 (e.g., order-card, pet-profile)
│   ├── utils/                # 工具函数 (e.g., api.js 封装请求, util.js 格式化工具)
│   ├── app.js                # 小程序逻辑主文件
│   ├── app.json              # 小程序公共配置
│   └── app.wxss              # 小程序公共样式
│
└── admin-web/                # Web管理后台 (Vue/React)
    ├── public/
    ├── src/
    │   ├── api/              # API请求封装 (e.g., admin.api.js)
    │   ├── assets/           # 静态资源 (css, images)
    │   ├── components/       # 可复用UI组件 (e.g., Sidebar, Pagination)
    │   ├── router/           # 路由配置 (vue-router)
    │   ├── store/            # 状态管理 (Pinia/Vuex)
    │   ├── views/            # 页面级组件 (e.g., Dashboard.vue, UserList.vue)
    │   └── main.js           # Web应用主入口
    ├── .env                  # 环境变量文件
    └── package.json          # 项目依赖
```

------

### 三、 各部分核心作用

#### 1. 后端 (Backend)

- **角色**: **项目的大脑和数据中枢**。

- 职责

  :

  - 实现全部API接口文档中定义的功能。
  - 处理所有业务逻辑，如订单状态流转、用户角色权限判断、支付与结算逻辑等。
  - 连接并操作 **MySQL数据库**，是数据的唯一合法读写入口。
  - 通过 **JWT (JSON Web Token)** 进行用户认证和会话管理。
  - 向小程序端和Web管理后台提供统一、标准化的数据接口。

#### 2. 小程序端 (Miniprogram)

- **角色**: **面向普通用户的核心操作界面**。

- 职责

  :

  - 提供给“宠物主”和“帮溜员”一个美观、易用的用户界面。
  - 负责**展示**从后端获取的数据（如订单列表、帮溜员资料等）。
  - 负责**收集**用户的输入（如创建订单的表单、聊天信息等），并通过调用API发送给后端。
  - **不包含任何核心业务逻辑**，所有操作都依赖后端API。

#### 3. Web管理后台 (Admin Web)

- **角色**: **面向平台管理员的“上帝视角”控制台**。

- 职责

  :

  - 提供一个数据可视化和集中管理的界面（如数据看板、用户列表、订单监控）。
  - 调用 `/api/admin/*` 开头的接口，执行管理操作，如审核认证、处理申诉、封禁用户、配置平台参数等。
  - 通常使用现成的UI库（如 Element Plus, Ant Design Vue）来快速构建界面。

------

### 四、 状态存储与服务连接

#### 1. 服务如何连接？ (How Services Connect)

- **架构模式**: 典型的 **Client-Server** 模式。

- **通信协议**: 小程序端和Web后台，都通过 **HTTPS** 协议请求后端的 **RESTful API** 进行数据交换。

- 认证方式

  :

  1. 用户（小程序或管理员）通过登录接口 (`/api/auth/wechat-login` 或 `/api/admin/login`) 获得一个 **JWT**。
  2. 客户端将此 JWT 存储起来。
  3. 在后续的每次API请求中，客户端都需要在请求头 `Authorization` 中携带此 JWT (`Bearer <JWT>`)。
  4. 后端通过一个**认证中间件**来验证每个受保护请求的 JWT 是否有效，从而识别用户身份和授权。

#### 2. 状态存储在哪里？ (Where State is Stored)

- **持久化状态 (Persistent State) - 单一数据源**:

  - **位置**: **MySQL 数据库**。
  - **内容**: 所有核心业务数据，如用户信息、宠物档案、订单记录、支付流水、评价、申诉等，都永久存储在这里。这是整个应用的“事实之源 (Single Source of Truth)”。

- **客户端状态 (Client-side State) - 临时会话数据**:

  - 小程序端

    :

    - **登录凭证 (Token)**: 使用 `wx.setStorageSync` 存储在微信小程序的本地缓存中，实现持久登录。
    - **全局用户信息**: 登录后获取的用户基本信息（昵称、头像）可以存放在 `app.js` 的 `globalData` 中，方便所有页面访问。
    - **页面数据**: 每个页面从API获取的数据和用户的表单输入，临时存放在对应页面的 `data` 对象中，用于UI渲染。

  - Web管理后台

    :

    - **登录凭证 (Token)**: 存放在浏览器的 `localStorage` 中，实现持久登录。
    - **全局状态**: 管理员信息、菜单权限、全局加载状态等，由状态管理库 **Pinia (或 Vuex)** 统一管理。
    - **组件状态**: 各个页面或组件内部的临时数据（如查询表单的条件、对话框的开关等）存放在组件自身的状态中。