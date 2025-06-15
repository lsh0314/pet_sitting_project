# pet_sitting_project

一个连接宠物主和宠物帮溜员的在线服务平台。

## 项目架构

项目采用前后端分离的客户端-服务器架构：

- **后端**: Node.js + Express.js, 提供 RESTful API
- **小程序端**: 微信小程序，面向宠物主和帮溜员
- **Web 管理后台**: Vue.js 3，面向平台管理员

## 后端服务启动步骤

1. 安装依赖

```bash
cd backend
npm install
```

2. 创建 .env 文件

```bash
# 复制示例配置
cp .env.example .env
# 修改.env文件，设置数据库连接参数
```

3. 初始化数据库

```bash
npm run migrate
```

4. 启动服务

```bash
# 开发模式启动
npm run dev
# 或生产模式启动
npm start
```

## 小程序启动步骤

1. 使用微信开发者工具打开 `miniprogram` 目录

## 管理后台启动步骤

1. 安装依赖

```bash
cd admin-web
npm install
```

2. 开发模式启动

```bash
npm run dev
```

3. 构建生产版本

```bash
npm run build
```

## API 文档

详细 API 文档请参见 `docs/api` 目录。
