// 测试脚本，用于检查页面是否正确注册
console.log('开始测试页面注册情况...');

// 尝试获取当前页面路径
const getCurrentPages = function() {
  try {
    if (typeof getCurrentPages === 'function') {
      return getCurrentPages();
    }
  } catch (e) {
    console.error('获取当前页面失败:', e);
  }
  return [];
};

// 打印当前注册的页面
console.log('当前注册的页面:', getCurrentPages());

// 尝试加载add.js
try {
  const addPage = require('./add.js');
  console.log('add.js 加载成功:', addPage);
} catch (e) {
  console.error('add.js 加载失败:', e);
}

// 尝试加载detail.js
try {
  const detailPage = require('./detail.js');
  console.log('detail.js 加载成功:', detailPage);
} catch (e) {
  console.error('detail.js 加载失败:', e);
}

// 检查app.json中是否注册了这些页面
try {
  const appConfig = require('../../../app.json');
  console.log('app.json 中注册的页面:', appConfig.pages);
  
  const hasAddPage = appConfig.pages.includes('pages/my/pets/add');
  const hasDetailPage = appConfig.pages.includes('pages/my/pets/detail');
  
  console.log('add页面是否注册:', hasAddPage);
  console.log('detail页面是否注册:', hasDetailPage);
} catch (e) {
  console.error('检查app.json失败:', e);
}

console.log('测试完成'); 