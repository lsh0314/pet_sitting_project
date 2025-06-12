

# 🐾 宠物管理模块 API 接口文档

## ✅ 1. 获取宠物列表

- **接口路径**：`GET /api/pet`
- **请求方法**：GET  
- **描述**：获取当前登录宠物主名下的所有宠物档案
- **认证要求**：需要携带 `Authorization: Bearer <token>`

### 响应示例

```json
[
  {
    "id": 1,
    "name": "豆豆",
    "photo": "https://cdn.com/doudou.jpg",
    "breed": "柯基",
    "age": "2岁",
    "weight": 10,
    "gender": "male"
  },
  {
    "id": 2,
    "name": "喵喵",
    "photo": "https://cdn.com/miaomiao.jpg",
    "breed": "英短",
    "age": "1岁",
    "weight": 5,
    "gender": "female"
  }
]
```

------

## ✅ 2. 创建宠物档案

- **接口路径**：`POST /api/pet`
- **请求方法**：POST
- **描述**：创建新的宠物档案

### 请求参数

| 参数名            | 类型     | 必填 | 描述                         |
| ----------------- | -------- | ---- | ---------------------------- |
| name              | string   | 是   | 宠物名                       |
| photo             | string   | 是   | 宠物照片 URL                 |
| breed             | string   | 否   | 品种                         |
| age               | string   | 否   | 年龄（如 "2岁"）             |
| gender            | string   | 否   | 性别：`male` / `female`      |
| weight            | number   | 否   | 体重（单位：kg）             |
| isSterilized      | boolean  | 否   | 是否绝育                     |
| vaccineProof      | string[] | 否   | 疫苗接种证明图片数组 URL     |
| healthDesc        | string   | 否   | 健康状况描述                 |
| characterTags     | string[] | 否   | 性格标签（如：亲人、胆小等） |
| specialNotes      | string   | 否   | 特别注意事项                 |
| allergyInfo       | string   | 否   | 过敏源说明                   |
| emergencyVetPhone | string   | 否   | 紧急兽医联系电话             |

### 请求示例

```json
{
  "name": "豆豆",
  "photo": "https://cdn.com/doudou.jpg",
  "breed": "柯基",
  "age": "2岁",
  "gender": "male",
  "weight": 10,
  "isSterilized": true,
  "vaccineProof": ["https://cdn.com/vaccine1.jpg"],
  "healthDesc": "无明显疾病",
  "characterTags": ["亲人", "活泼"],
  "specialNotes": "不能吃鸡肉",
  "allergyInfo": "对鸡肉过敏",
  "emergencyVetPhone": "13800001111"
}
```

### 响应示例

```json
{
  "success": true,
  "petId": 123
}
```

------

## ✅ 3. 获取单个宠物详情

- **接口路径**：`GET /api/pet/:id`
- **请求方法**：GET
- **描述**：根据宠物 ID 获取详细信息

### 路径参数

| 参数名 | 类型 | 描述    |
| ------ | ---- | ------- |
| id     | int  | 宠物 ID |

### 响应示例

```json
{
  "id": 123,
  "name": "豆豆",
  "photo": "https://cdn.com/doudou.jpg",
  "breed": "柯基",
  "age": "2岁",
  "gender": "male",
  "weight": 10,
  "isSterilized": true,
  "vaccineProof": ["https://cdn.com/vaccine1.jpg"],
  "healthDesc": "健康",
  "characterTags": ["亲人", "活泼"],
  "specialNotes": "不能吃鸡肉",
  "allergyInfo": "对鸡肉过敏",
  "emergencyVetPhone": "13800001111"
}
```

------

## ✅ 4. 更新宠物档案

- **接口路径**：`PUT /api/pet/:id`
- **请求方法**：PUT
- **描述**：修改指定宠物的信息

### 路径参数

| 参数名 | 类型 | 描述    |
| ------ | ---- | ------- |
| id     | int  | 宠物 ID |

### 请求参数

字段同「创建宠物档案」一致，允许部分更新。

### 响应示例

```json
{
  "success": true,
  "message": "宠物档案更新成功"
}
```

------

## ✅ 5. 删除宠物档案

- **接口路径**：`DELETE /api/pet/:id`
- **请求方法**：DELETE
- **描述**：删除指定宠物

### 路径参数

| 参数名 | 类型 | 描述    |
| ------ | ---- | ------- |
| id     | int  | 宠物 ID |

### 响应示例

```json
{
  "success": true,
  "message": "宠物档案已删除"
}
```

------

## ✅ 统一错误返回格式（建议）

```json
{
  "success": false,
  "errorCode": "NOT_FOUND",
  "message": "未找到对应宠物"
}
```

------

> 💡 提示：此模块中的所有接口都建议加入用户权限校验，确保用户只能操作自己名下的宠物。