const express = require('express');
const router = express.Router();
const PetController = require('../controllers/pet.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');

// 所有宠物相关的路由都需要认证
router.use(authMiddleware);

// 获取当前用户的所有宠物
router.get('/', PetController.getPets);

// 创建新宠物
router.post('/', PetController.createPet);

// 获取单个宠物详情
router.get('/:id', PetController.getPetById);

// 更新宠物信息
router.put('/:id', PetController.updatePet);

// 删除宠物
router.delete('/:id', PetController.deletePet);

// 后台管理接口
router.get('/admin/list', authMiddleware, adminMiddleware, PetController.adminGetPets);
router.get('/admin/:id', authMiddleware, adminMiddleware, PetController.adminGetPetById);
router.put('/admin/:id', authMiddleware, adminMiddleware, PetController.adminUpdatePet);
router.delete('/admin/:id', authMiddleware, adminMiddleware, PetController.adminDeletePet);

module.exports = router;
