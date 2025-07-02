<template>
  <div class="pets-view">
    <el-container>
      <el-main>
        <h2>宠物管理</h2>
        <!-- 搜索和筛选 -->
        <el-card class="filter-card">
          <div class="filter-container">
            <el-input
              v-model="filters.keyword"
              placeholder="输入宠物名称或ID搜索"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
              style="width: 220px"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            
            <el-input
              v-model="filters.owner"
              placeholder="输入主人ID搜索"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
              style="width: 220px"
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
            
            <el-select 
              v-model="filters.gender" 
              placeholder="性别" 
              clearable 
              @change="handleSearch"
              style="width: 120px"
            >
              <el-option label="全部性别" value="" />
              <el-option label="公" value="male" />
              <el-option label="母" value="female" />
            </el-select>
            
            <el-button type="primary" @click="handleSearch">筛选</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </div>
        </el-card>

        <!-- 宠物列表卡片 -->
        <el-card v-loading="loading">
          <!-- 宠物列表 -->
          <el-table
            :data="petList"
            :key="tableKey"
            border
            style="width: 100%"
            :fit="true"
          >
            <template #empty>
              <div class="empty-table">
                暂无数据
              </div>
            </template>

            <el-table-column type="index" width="50" label="#" :key="'index'" />
            
            <el-table-column prop="id" label="宠物ID" width="80" :key="'id'" />
            
            <el-table-column label="宠物信息" min-width="220" :key="'pet-info'">
              <template #default="{ row }">
                <div class="pet-info">
                  <el-avatar :size="40" :src="row.photo">
                    {{ row.name ? row.name.charAt(0) : 'P' }}
                  </el-avatar>
                  <div class="pet-details">
                    <div class="name">{{ row.name }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
        
            <el-table-column label="主人" min-width="220">
              <template #header>
                <span>主人信息</span>
              </template>
              <template #default="{ row }">
                <div class="owner-column">
                  <el-avatar :size="40" :src="row.owner_avatar_url || '/default-avatar.png'">
                    {{ row.owner_nickname ? row.owner_nickname.charAt(0) : '未' }}
                  </el-avatar>
                  <div class="owner-info">
                    <div class="owner-name">{{ row.owner_nickname || '未知主人' }}</div>
                    <div class="owner-id">ID: {{ row.owner_id || '无' }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
            
            <el-table-column prop="breed" label="品种" min-width="100">
              <template #default="{ row }">
                <el-tag effect="plain">
                  {{ row.breed || '未知' }}
                </el-tag>
              </template>
            </el-table-column>
            
            <el-table-column prop="gender" label="性别" min-width="60">
              <template #default="{ row }">
                {{ row.gender === 'male' ? '公' : '母' }}
              </template>
            </el-table-column>
            
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button
                  link
                  type="primary"
                  size="small"
                  @click="viewPetDetail(row)"
                >
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <!-- 分页 -->
          <div class="pagination-container">
            <el-pagination
              v-if="pagination.total > 0"
              :key="pagination.page + '-' + pagination.limit"
              :current-page="pagination.page"
              :page-size="pagination.limit"
              :total="pagination.total"
              :page-sizes="[10, 20, 50, 100]"
              :background="true"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handlePageChange"
            />
            <div v-else class="no-data">暂无数据</div>
          </div>
        </el-card>

        <!-- 宠物详情抽屉 -->
        <el-drawer
          v-model="petDetailVisible"
          :title="'宠物详情 - ' + (currentPet && currentPet.name || '')"
          size="500px"
          destroy-on-close
        >
          <div v-if="currentPet" class="pet-detail">
            <div class="detail-header">
              <el-avatar :size="80" :src="currentPet.photo">
                {{ currentPet.name ? currentPet.name.charAt(0) : 'P' }}
              </el-avatar>
              <h3>{{ currentPet.name }}</h3>
            </div>
            
            <el-descriptions :column="1" border>
              <el-descriptions-item label="宠物ID">{{ currentPet.id }}</el-descriptions-item>
              <el-descriptions-item label="品种">{{ currentPet.breed || '未知' }}</el-descriptions-item>
              <el-descriptions-item label="性别">{{ currentPet.gender === 'male' ? '公' : '母' }}</el-descriptions-item>
              <el-descriptions-item label="体重">{{ currentPet.weight }} kg</el-descriptions-item>
              <el-descriptions-item label="健康状况">{{ currentPet.health_status || '未知' }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ formatDate(currentPet.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="最后更新">{{ formatDate(currentPet.updated_at) }}</el-descriptions-item>
            </el-descriptions>

            <div class="detail-section">
              <h4>疫苗记录</h4>
              <div class="vaccine-images">
                <el-image
                  v-for="(img, index) in currentPet.vaccine_images"
                  :key="index"
                  :src="img"
                  :preview-src-list="currentPet.vaccine_images"
                  fit="cover"
                  style="width: 120px; height: 160px; margin-right: 10px; border-radius: 4px;"
                >
                  <template #error>
                    <div class="image-error">
                      <el-icon><Picture /></el-icon>
                      <span>加载失败</span>
                    </div>
                  </template>
                </el-image>
                <div v-if="!currentPet.vaccine_images || currentPet.vaccine_images.length === 0" class="no-vaccine">
                  暂无疫苗记录
                </div>
              </div>
            </div>
            
            <div class="detail-section">
              <h4>宠物特点</h4>
              <div class="tags-container">
                <el-tag
                  v-for="(tag, index) in currentPet.tags"
                  :key="index"
                  type="info"
                  style="margin-right: 8px; margin-bottom: 8px"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </div>
            
            <div class="detail-section">
              <h4>喜好</h4>
              <div class="preference-card">
                <el-card shadow="hover" v-if="currentPet.likes">
                  <div class="preference-content">
                    <el-icon size="20" color="#67C23A"><SuccessFilled /></el-icon>
                    <div class="preference-text">{{ currentPet.likes }}</div>
                  </div>
                </el-card>
                <el-empty v-else description="无记录" :image-size="60" />
              </div>
            </div>
            
            <div class="detail-section">
              <h4>注意事项</h4>
              <div class="notice-card">
                <el-card shadow="hover" v-if="currentPet.dislikes">
                  <div class="notice-content">
                    <el-icon size="20" color="#F56C6C"><WarningFilled /></el-icon>
                    <div class="notice-text">{{ currentPet.dislikes }}</div>
                  </div>
                </el-card>
                <el-empty v-else description="无记录" :image-size="60" />
              </div>
            </div>
          </div>
        </el-drawer>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, User, Picture, SuccessFilled, WarningFilled } from '@element-plus/icons-vue'

// 状态定义
const loading = ref(false)
const petList = ref([])
const petDetailVisible = ref(false)
const currentPet = ref(null)
const tableKey = ref(0)

// 筛选条件
const filters = reactive({
  keyword: '',
  owner: '',
  gender: ''
})

// 分页配置
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

// 映射字典
const typeMap = {
  dog: '狗',
  cat: '猫',
  bird: '鸟',
  other: '其他'
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取宠物列表
const fetchPetList = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...filters
    }

    const response = await axios.get('/api/pet/admin/list', { params })

    if (response.data?.data && Array.isArray(response.data.data)) {
      pagination.total = response.data.total
      petList.value = response.data.data
    } else {
      pagination.total = 0
      petList.value = []
      if (!response.data) { 
        ElMessage.warning('获取的宠物列表为空或格式不正确')
      }
    }
  } catch (err) {
    console.error('获取宠物列表失败:', err)
    ElMessage.error(err.response?.data?.message || '获取宠物列表失败')
    pagination.total = 0
    petList.value = []
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchPetList()
}

// 重置筛选
const resetFilters = () => {
  Object.keys(filters).forEach(key => filters[key] = '')
  handleSearch()
}

// 分页处理
const handleSizeChange = async (val) => {
  pagination.limit = val
  pagination.page = 1
  await fetchPetList()
}

const handlePageChange = async (val) => {
  pagination.page = val
  await fetchPetList()
}

// 查看宠物详情
const viewPetDetail = async (pet) => {
  try {
    const response = await axios.get(`/api/pet/admin/${pet.id}`)
    if (response.data.success) {
      currentPet.value = response.data.data
      petDetailVisible.value = true
    } else {
      throw new Error(response.data.message)
    }
  } catch (err) {
    console.error('查看宠物详情失败:', err)
    ElMessage.error(err.response?.data?.message || '获取宠物详情失败')
  }
}


// 初始化
onMounted(() => {
  fetchPetList()
})
</script>

<style scoped>
.pets-view {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.filter-card {
  margin-bottom: 20px;
}

.filter-container {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.pet-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pet-details {
  display: flex;
  flex-direction: column;
}

.name {
  font-weight: 500;
}

.type {
  font-size: 12px;
  color: #909399;
}

.owner-info {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 4px;
}

.owner-name {
  font-size: 12px;
  color: #606266;
}

.owner-column {
  display: flex;
  align-items: center;
  gap: 10px;
}

.owner-info {
  display: flex;
  flex-direction: column;
}

.owner-name {
  font-size: 14px;
  color: #606266;
}

.owner-id {
  font-size: 12px;
  color: #909399;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.no-data {
  color: #909399;
  text-align: center;
  padding: 10px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.detail-section {
  margin-top: 20px;
}

.vaccine-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.vaccine-images .el-image {
  border: 1px solid #ebeef5;
  transition: all 0.3s;
}

.vaccine-images .el-image:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.no-vaccine {
  color: #909399;
  font-size: 14px;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
}

.preference-card,
.notice-card {
  margin-top: 10px;
}

.preference-content,
.notice-content {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
}

.preference-text,
.notice-text {
  flex: 1;
  font-size: 14px;
  line-height: 1.5;
}

.preference-card {
  background-color: #f0f9eb;
  border-color: #e1f3d8;
}

.notice-card {
  background-color: #fef0f0;
  border-color: #fde2e2;
}
</style>
