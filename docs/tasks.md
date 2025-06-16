这个计划将优先构建核心的用户路径：**注册 -> 创建资料 -> 发现 -> 下单 -> 支付 -> 完成**。

---

### MVP 范围定义

为了快速迭代，MVP 将**包含**以下核心功能：

- 用户注册与登录（微信授权）。
- 帮溜员创建和编辑自己的基础资料（简介、服务和价格）。
- 宠物主创建和编辑宠物档案。
- 宠物主能查看帮溜员列表并进入其主页。
- 宠物主能对特定帮溜员发起“直接邀约”订单。
- 帮溜员能接受或拒绝邀约。
- 宠物主能完成（模拟）支付。
- 双方能更新订单状态（开始服务、完成服务、确认收货）。
- 一个最基础的管理员后台，能查看用户和订单列表。

MVP 将**不包含**以下功能（可后续迭代）：

- 复杂的搜索与筛选。
- 订单广场（公开招标模式）。
- 实时 GPS 轨迹。
- 服务中的图文汇报。
- 应用内聊天。
- 评价与评分系统。
- 提现与钱包明细。
- 申诉与售后。

---

### MVP 构建的详细逐步计划

我将任务分解到极致，每个任务都标注了所属的模块（`[Backend]`, `[Miniprogram]`, `[Admin-Web]`, `[DB]`）和关注点。

#### **阶段 0：项目初始化与环境搭建 (Setup)**

- **任务 0.1: [Backend]** 初始化 Node.js 项目。安装 Express、MySQL2、jsonwebtoken、bcrypt 等核心依赖。创建`architecture.md`中描述的文件夹结构。
- **任务 0.2: [Miniprogram]** 使用微信开发者工具，创建一个新的小程序项目，建立`architecture.md`中描述的文件夹和初始页面文件。
- **任务 0.3: [Admin-Web]** 使用 Vite 初始化一个 Vue 3 项目，安装 Vue Router、Pinia 和 axios。建立`architecture.md`中描述的文件夹结构。
- **任务 0.4: [Backend]** 编写数据库连接配置文件 (`src/config/database.js`)，并测试与本地 MySQL 服务器的连通性。

#### **阶段 1：用户认证与基础框架 (Authentication)**

- **任务 1.1: [DB]** 编写并执行`users`表的 SQL 迁移脚本。
- **任务 1.2: [Backend] (API)** 实现`POST /api/auth/wechat-login`接口。 **逻辑**: 接收`code`，（MVP 阶段可返回模拟的`openid`），在`users`表中查找或创建用户，生成 JWT 并返回。
- **任务 1.3: [Backend] (Middleware)** 编写 JWT 认证中间件`auth.middleware.js`。该中间件用于解析请求头中的 token，验证其有效性，并将用户信息附加到`req`对象上，供后续受保护的接口使用。
- **任务 1.4: [Miniprogram] (UI)** 在`pages/auth/`下，创建登录页面的 UI，包含一个“微信授权登录”按钮。
- **任务 1.5: [Miniprogram] (Logic)** 为登录按钮绑定事件：调用`wx.login()`获取`code`，然后调用封装好的 API 请求函数，将`code`发送到后端的`POST /api/auth/wechat-login`接口。
- **任务 1.6: [Miniprogram] (State)** 登录成功后，将后端返回的 JWT `token`和用户信息，通过`wx.setStorageSync`保存到本地缓存。同时设置一个全局状态（`app.globalData`）来标记用户已登录。
- **任务 1.7: [Backend] (API)** 实现`GET /api/user/profile`接口，使用`auth.middleware.js`保护。它应返回当前登录用户的基本信息。
- **任务 1.8: [Miniprogram] (Logic)** 在小程序启动时（`app.js`的`onLaunch`），检查本地缓存中是否存在`token`。如果存在，则调用`GET /api/user/profile`验证 token 有效性并获取用户信息，以实现自动登录。

#### **阶段 2：核心资料创建 (Profile Creation)**

- **任务 2.1: [DB]** 编写并执行`pets`表的 SQL 迁移脚本。
- **任务 2.2: [Backend] (API)** 实现`POST /api/pet`和`GET /api/pet`（列表）接口，均使用 JWT 中间件保护。
- **任务 2.3: [Miniprogram] (UI)** 在`pages/my/`下创建“我的宠物”页面，包含一个宠物列表和一个“添加新宠物”的按钮。
- **任务 2.4: [Miniprogram] (UI)** 创建“添加/编辑宠物”的表单页面。
- **任务 2.5: [Miniprogram] (Logic)** 将“添加/编辑宠物”表单与`POST /api/pet`（或`PUT /api/pet/:id`）接口连接。
- **任务 2.6: [Miniprogram] (Logic)** 在“我的宠物”页面加载时，调用`GET /api/pet`接口，获取并展示宠物列表。
- **任务 2.7: [DB]** 编写并执行`sitter_profiles`和`sitter_services`表的 SQL 迁移脚本。
- **任务 2.8: [Backend] (API)** 实现`PUT /api/sitter/profile`和`GET /api/sitter/profile`接口，均使用 JWT 中间件保护。`PUT`接口需要同时处理`sitter_profiles`和`sitter_services`两张表的数据。
- **任务 2.9: [Miniprogram] (UI)** 在`pages/my/`下创建“我的帮溜主页”页面，包含一个表单用于编辑个人简介、服务区域、服务类型和价格。
- **任务 2.10: [Miniprogram] (Logic)** 将该表单与`PUT /api/sitter/profile`接口连接，并能在页面加载时通过`GET /api/sitter/profile`回填已有数据。

#### **阶段 3：核心交易流程 (Discovery & Ordering)**

- **任务 3.1: [Backend] (API)** 实现`GET /api/sitters`列表接口。**MVP 逻辑**: 直接查询所有`role`为`sitter`且已填写`sitter_profiles`的用户，返回基础信息（头像、昵称、简介、评分）。
- **任务 3.2: [Miniprogram] (UI)** 在`pages/index/`页面，设计"上门喂猫"和"上门遛狗"两个服务入口按钮，并创建`pages/sitter-list/`页面，用于展示帮溜员列表。
- **任务 3.3: [Miniprogram] (Logic)** 点击首页的"上门喂猫"或"上门遛狗"按钮时，跳转到`pages/sitter-list/`页面，并传递相应的服务类型参数。在`pages/sitter-list/`页面加载时，调用`GET /api/sitters`接口并传递服务类型参数，展示对应类型的帮溜员列表。
- **任务 3.4: [Miniprogram] (Logic)** 为列表中的每个帮溜员项添加点击事件，跳转到帮溜员的公开主页`pages/sitter/detail`，并传递其`id`。
- **任务 3.5: [Backend] (API)** 实现`GET /api/sitter/:id`接口，返回指定帮溜员的公开信息。
- **任务 3.6: [Miniprogram] (Logic)** 在`pages/sitter/detail`页面加载时，根据传入的`id`调用`GET /api/sitter/:id`接口，展示帮溜员的详细资料。
- **任务 3.7: [DB]** 编写并执行`orders`表的 SQL 迁移脚本。
- **任务 3.8: [Backend] (API)** 实现`POST /api/order`接口。**MVP 逻辑**: 这是一个直接邀约接口，`targetSitter`字段为必填。创建订单时，状态设为`pending`或`accepted`（此处定义`accepted`更简单，代表等待支付）。
- **任务 3.9: [Miniprogram] (UI)** 在帮溜员主页上，添加一个“向 TA 下单”按钮，点击后跳转到订单创建页。
- **任务 3.10: [Miniprogram] (UI)** 创建`pages/order/create`页面，包含一个表单让宠物主选择自己的宠物、服务时间、填写备注等。
- **任务 3.11: [Miniprogram] (Logic)** 连接订单创建表单与`POST /api/order`接口。
- **任务 3.12: [Backend] (API)** 实现`GET /api/order/my`接口。根据传入的`role`（`pet_owner`或`sitter`）返回相应的订单列表。
- **任务 3.13: [Miniprogram] (UI/Logic)** 创建“我的订单”页面，并根据用户角色调用`GET /api/order/my`接口展示订单列表。

- **任务 3.14**: [Backend] (API) - 实现后端接口 实现`GET /api/order/my`接口，根据 role 参数返回“我作为宠物主”或“我作为帮溜员”的订单列表。

- **任务 3.15: [Miniprogram] (UI)** - 创建订单列表页面

- **任务 3.16: [Miniprogram] (Logic)** - 实现 Tab 切换和数据加载
  这个任务是给刚刚创建的 UI 页面注入灵魂（数据和交互）。

#### **阶段 4：支付与订单完成 (Payment & Completion)**

- **任务 4.1: [DB]** 编写并执行`payments`表的 SQL 迁移脚本。
- **任务 4.2: [Backend] (API)** 实现`POST /api/payment/order/:id`接口。**MVP 逻辑**: 不必接入真实微信支付。该接口只需在`payments`表中创建一条记录，然后将对应`orders`表的状态更新为`paid`即可。
- **任务 4.3: [Miniprogram] (UI)** 在 pages/order/create 页面调用 POST /api/order 成功后，不跳转，而是立即使用返回的 orderId，继续调用 POST /api/payment/order/:id 接口。
- **任务 4.4: [Miniprogram] (Logic)** 为“去支付”按钮绑定事件，调用`POST /api/payment/order/:id`接口，成功后提示“支付成功”，并刷新订单状态。
- **任务 4.5: [Backend] (API)** 实现`POST /api/order/:id/start`和`POST /api/order/:id/complete`接口，用于帮溜员更新订单状态。
- **任务 4.6: [Backend] (API)** 实现`POST /api/order/:id/confirm`接口，用于宠物主确认收货，将订单状态变为最终的`completed`或`confirmed`。
- **任务 4.7: [Miniprogram] (UI/Logic)** 在订单详情页，根据当前用户角色和订单状态，动态显示“开始服务”、“完成服务”、“确认收货”等操作按钮，并绑定到对应的 API 接口。

#### **阶段 5：基础后台管理 (Basic Admin)**

- **任务 5.1: [DB]** 编写并执行`admins`表的 SQL 迁移脚本，并手动插入一个初始管理员账户。
- **任务 5.2: [Backend] (API)** 实现`POST /api/admin/login`接口。
- **任务 5.3: [Backend] (API)** 实现`GET /api/admin/users`和`GET /api/admin/orders`两个只读列表接口。
- **任务 5.4: [Admin-Web] (UI/Logic)** 创建登录页面，并连接到`POST /api/admin/login`接口，成功后将 token 存入`localStorage`。
- **任务 5.5: [Admin-Web] (UI/Logic)** 创建一个简单的后台布局（侧边栏+内容区）。
- **任务 5.6: [Admin-Web] (View)** 创建`UserList.vue`页面，调用`GET /api/admin/users`接口并用表格展示所有用户。
- **任务 5.7: [Admin-Web] (View)** 创建`OrderList.vue`页面，调用`GET /api/admin/orders`接口并用表格展示所有订单。
