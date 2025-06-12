# 宠物派管理后台

这是宠物派平台的管理后台项目，基于 Vue 3 + Vite + Element Plus 开发。

## 功能特性

- 管理员登录认证
- 数据仪表盘与可视化
- 订单管理
- 用户管理
- 帮溜员管理
- 宠物管理
- 系统设置

## 技术栈

- Vue 3 + Composition API
- Vue Router
- Pinia 状态管理
- Element Plus UI 组件库
- Axios 网络请求
- Vite 构建工具
- SCSS 样式处理

## 开发环境设置

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 项目结构

```
src/
├── assets/          # 静态资源
├── components/      # 通用组件
├── layouts/         # 布局组件
├── router/          # 路由配置
├── stores/          # Pinia状态管理
├── utils/           # 工具函数
└── views/           # 页面视图
```

## API 配置

管理后台默认通过代理连接到后端 API 服务：

- 开发环境: `http://localhost:3000/api`
- 生产环境: 配置在环境变量中

## 浏览器兼容性

- Chrome >= 64
- Firefox >= 78
- Safari >= 12
- Edge >= 79
