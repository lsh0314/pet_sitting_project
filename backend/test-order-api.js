const axios = require('axios');
const db = require('./src/config/database');

// 测试创建订单API
async function testCreateOrder() {
  try {
    // 1. 查询数据库获取有效的测试数据
    console.log('正在查询测试数据...');
    
    // 查询宠物和其主人
    const [pets] = await db.execute(`
      SELECT p.id as pet_id, p.name as pet_name, p.owner_user_id, 
             u.nickname, u.wechat_openid
      FROM pets p
      JOIN users u ON p.owner_user_id = u.id
      LIMIT 1
    `);
    
    if (pets.length === 0) {
      console.error('找不到宠物数据');
      return;
    }
    
    const petId = pets[0].pet_id;
    const petName = pets[0].pet_name;
    const ownerId = pets[0].owner_user_id;
    const ownerName = pets[0].nickname;
    const ownerOpenid = pets[0].wechat_openid;
    
    console.log(`找到宠物: ID=${petId}, 名称=${petName}`);
    console.log(`宠物主人: ID=${ownerId}, 昵称=${ownerName}, OpenID=${ownerOpenid}`);
    
    // 查询一个有效的帮溜员及其服务
    const [sitterServices] = await db.execute(`
      SELECT sp.user_id as sitter_id, u.nickname as sitter_name, 
             ss.service_type, ss.price
      FROM sitter_profiles sp
      JOIN users u ON sp.user_id = u.id
      JOIN sitter_services ss ON sp.user_id = ss.sitter_user_id
      LIMIT 1
    `);
    
    if (sitterServices.length === 0) {
      console.error('找不到帮溜员服务数据');
      return;
    }
    
    const sitterId = sitterServices[0].sitter_id;
    const sitterName = sitterServices[0].sitter_name;
    const serviceType = sitterServices[0].service_type;
    const price = sitterServices[0].price;
    
    console.log(`找到帮溜员: ID=${sitterId}, 昵称=${sitterName}`);
    console.log(`服务: 类型=${serviceType}, 价格=${price}`);
    
    // 2. 使用开发环境测试登录接口，直接指定openid
    console.log('正在登录...');
    console.log(`使用OpenID ${ownerOpenid} 登录用户 ${ownerId}`);
    
    const loginResponse = await axios.post('http://localhost:3000/api/auth/dev-login', {
      openid: ownerOpenid
    });
    
    if (!loginResponse.data.success && !(loginResponse.data.data && loginResponse.data.data.token)) {
      console.error('登录失败:', loginResponse.data);
      return;
    }
    
    const token = loginResponse.data.data.token;
    console.log('登录成功，获取到令牌');
    console.log('登录用户ID:', loginResponse.data.data.user.id);
    
    // 3. 创建订单
    console.log('正在创建订单...');
    
    // 准备订单数据
    const orderData = {
      petId: petId,
      serviceType: serviceType,
      serviceDate: '2023-07-15',
      startTime: '09:00',
      endTime: '10:00',
      address: 'XX小区',
      remarks: '请准时到达',
      price: price,
      targetSitter: sitterId
    };
    
    console.log('订单数据:', orderData);
    
    // 发送POST请求
    const response = await axios.post('http://localhost:3000/api/order', orderData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // 输出响应结果
    console.log('创建订单成功:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // 4. 验证订单已创建
    if (response.data.orderId) {
      const [orders] = await db.execute('SELECT * FROM orders WHERE id = ?', [response.data.orderId]);
      if (orders.length > 0) {
        console.log('订单已成功保存到数据库');
        console.log('订单数据:', orders[0]);
      } else {
        console.error('订单未保存到数据库');
      }
    }
  } catch (error) {
    // 输出错误信息
    console.error('创建订单失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误响应:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('错误:', error.message);
      console.error('错误堆栈:', error.stack);
    }
  }
}

// 执行测试
testCreateOrder(); 