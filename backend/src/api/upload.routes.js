const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middlewares/auth.middleware');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// 创建上传中间件
const upload = multer({ storage: storage });

// 图片上传接口
router.post('/image', authMiddleware, upload.single('photo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }
    
    // 构建文件URL
    // 使用完整的URL，包括协议、主机名和端口
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
    
    console.log('上传文件成功，URL:', fileUrl);
    
    // 返回文件URL
    res.json({
      success: true,
      url: fileUrl,
      message: '文件上传成功'
    });
  } catch (error) {
    console.error('文件上传失败:', error);
    res.status(500).json({
      success: false,
      message: '文件上传失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 