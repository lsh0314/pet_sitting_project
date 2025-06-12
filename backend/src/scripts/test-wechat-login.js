const axios = require('axios');

/**
 * 测试微信登录API
 */
async function testWechatLogin() {
  try {
    console.log('测试微信登录API...');
    
    const response = await axios.post('http://localhost:3000/api/auth/wechat-login', {
      code: 'test_code_123',
      nickName: '测试用户',
      avatarUrl: 'https://example.com/avatar.jpg'
    });
    
    console.log('响应状态码:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data.token) {
      console.log('✅ 微信登录API测试成功!');
      return true;
    } else {
      console.error('❌ 微信登录API测试失败: 响应格式不正确');
      return false;
    }
  } catch (error) {
    console.error('❌ 微信登录API测试失败:', error.message);
    if (error.response) {
      console.error('错误响应:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    const success = await testWechatLogin();
    
    if (success) {
      console.log('所有测试通过!');
      process.exit(0);
    } else {
      console.error('测试失败!');
      process.exit(1);
    }
  } catch (error) {
    console.error('测试过程出错:', error);
    process.exit(1);
  }
}

// 执行主函数
main(); 