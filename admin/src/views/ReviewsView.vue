<!--
  ReviewsView.vue
  功能：后台管理系统的评价管理页面。
  - 展示所有用户评价内容
  - 支持内容审核、隐藏/恢复等操作
-->

<template>
  <div class="reviews-view">
     <h2>评价管理</h2>
    <!-- 搜索和筛选 -->
    <el-card class="filter-card">
      <div class="filter-container">
        <el-input
          v-model="filters.keyword"
          placeholder="输入评价内容或用户昵称搜索"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
          style="width: 220px"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-select 
          v-model="filters.min_rating" 
          placeholder="最低评分" 
          clearable 
          @change="handleSearch"
          style="width: 120px"
        >
          <el-option label="全部" value="" />
          <el-option
            v-for="i in 5"
            :key="i"
            :label="`${i}星`"
            :value="i"
          />
        </el-select>
        
      <el-select 
        v-model="filters.max_rating" 
        placeholder="最高评分" 
        clearable 
        @change="handleSearch"
        style="width: 120px"
      >
        <el-option label="全部" value="" />
        <el-option
          v-for="i in 5"
          :key="i"
          :label="`${i}星`"
          :value="i"
        />
      </el-select>

      <el-select 
        v-model="filters.is_anonymous" 
        placeholder="评价状态" 
        clearable 
        @change="handleSearch"
        style="width: 120px"
      >
        <el-option label="全部" value="" />
        <el-option label="显示中" value="false" />
        <el-option label="已隐藏" value="true" />
      </el-select>
        
        <el-button type="primary" @click="handleSearch">筛选</el-button>
        <el-button @click="resetFilters">重置</el-button>
       <!-- <el-button type="success" @click="handleExport">导出数据</el-button> -->
      </div>
    </el-card>

    <!-- 评价列表卡片 -->
    <el-card v-loading="loading">
      <!-- 评价列表 -->
      <el-table
        :data="reviewList"
        :key="tableKey"
        border
        style="width: 100%"
        :row-class-name="({row}) => row.is_anonymous ? 'hidden-row' : ''"
      >
        <template #empty>
          <div class="empty-table">
            暂无数据
          </div>
        </template>
        <el-table-column type="index" width="50" label="#" :key="'index'" />
        
        <el-table-column prop="id" label="评价ID" width="100" :key="'id'" />
        
        <el-table-column label="评价内容" min-width="200" :key="'content'">
          <template #default="{ row }">
            <div class="review-content">
              <div class="rating">
                <el-rate
                  v-model="row.rating"
                  disabled
                  show-score
                  text-color="#ff9900"
                  score-template="{value} 星"
                />
              </div>
              <div class="comment">{{ row.comment }}</div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="用户信息" width="180">
          <template #default="{ row }">
            <div class="user-info">
                <el-avatar 
                  :size="40" 
                  :src="row.user && row.user.avatar_url"
                  shape="circle"
                  style="flex-shrink: 0"
                >
                  {{ (row.user && row.user.nickname && row.user.nickname.charAt(0)) || 'U' }}
                </el-avatar>
                <div class="user-details">
                  <div class="nickname" @click="handleUserClick(row.user)" style="cursor: pointer; color: #409EFF">
                    {{ (row.user && row.user.nickname) || '未知用户' }}
                  </div>
                  <div class="time">评价时间: {{ formatDate(row.created_at) }}</div>
                </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="帮溜员" width="180">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar 
                :size="40" 
                :src="row.sitter && row.sitter.avatar_url"
                shape="circle"
                style="flex-shrink: 0"
              >
                {{ (row.sitter && row.sitter.nickname && row.sitter.nickname.charAt(0)) || 'S' }}
              </el-avatar>
              <div class="user-details">
                  <div class="nickname" @click="handleSitterClick(row.sitter)" style="cursor: pointer; color: #409EFF">
                  {{ (row.sitter && row.sitter.nickname) || '未知帮溜员' }}
                </div>
                <div class="order">订单号: 
                  <span @click="goToOrderDetail(row.order && row.order.order_no)" style="cursor: pointer; color: #409EFF">
                    {{ (row.order && row.order.order_no) || '未知' }}
                  </span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button
              link
              type="primary"
              size="small"
              @click="viewReviewDetail(scope.row)"
            >
              详情
            </el-button>
            
            <el-button
              link
              type="danger"
              size="small"
              @click="handleDeleteReview(scope.row)"
            >
              删除
            </el-button>
            
            <el-button
              link
              :type="scope.row.is_anonymous ? 'success' : 'info'"
              size="small"
              @click="handleToggleVisibility(scope.row)"
            >
              {{ scope.row.is_anonymous ? '显示' : '隐藏' }}
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

    <!-- 评价详情抽屉 -->
    <el-drawer
      v-model="reviewDetailVisible"
      :title="'评价详情 - ID: ' + (currentReview ? currentReview.id : '')"
      size="500px"
      destroy-on-close
    >
      <div v-if="currentReview" class="review-detail">
        <div class="detail-section">
          <h3>评价内容</h3>
          <div class="rating">
            <el-rate
              v-model="currentReview.rating"
              disabled
              show-score
              text-color="#ff9900"
              score-template="{value} 星"
            />
          </div>
          <div class="comment">{{ currentReview.comment }}</div>
          <div class="time">评价时间: {{ formatDate(currentReview.created_at) }}</div>
        </div>
        
        <div class="detail-section">
          <h3>用户信息</h3>
          <div class="user-info">
            <el-avatar 
              :size="60" 
              :src="currentReview.user && currentReview.user.avatar_url"
              shape="circle"
              style="flex-shrink: 0"
            >
              {{ (currentReview.user && currentReview.user.nickname && currentReview.user.nickname.charAt(0)) || 'U' }}
            </el-avatar>
            <div class="user-details">
              <div class="nickname">{{ (currentReview.user && currentReview.user.nickname) || '未知用户' }}</div>
              <div class="id">用户ID: {{ (currentReview.user && currentReview.user.id) || '未知' }}</div>
            </div>
          </div>
        </div>
        
        <div class="detail-section">
          <h3>帮溜员信息</h3>
          <div class="user-info">
            <el-avatar 
              :size="60" 
              :src="currentReview.sitter && currentReview.sitter.avatar_url"
              shape="circle"
              style="flex-shrink: 0"
            >
              {{ (currentReview.sitter && currentReview.sitter.nickname && currentReview.sitter.nickname.charAt(0)) || 'S' }}
            </el-avatar>
            <div class="user-details">
              <div class="nickname">{{ (currentReview.sitter && currentReview.sitter.nickname) || '未知帮溜员' }}</div>
              <div class="id">帮溜员ID: {{ (currentReview.sitter && currentReview.sitter.id) || '未知' }}</div>
            </div>
          </div>
        </div>
        
        <div class="detail-section">
          <h3>订单信息</h3>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="订单号">{{ currentReview && currentReview.order ? currentReview.order.order_no : '未知' }}</el-descriptions-item>
            <el-descriptions-item label="服务时间">{{ currentReview && currentReview.order && currentReview.order.service_date ? formatDate(currentReview.order.service_date) : '未知' }}</el-descriptions-item>
          </el-descriptions>
        </div>
        
        <div class="detail-section">
          <h3>编辑评价内容</h3>
          <el-input
            v-model="replyForm.content"
            type="textarea"
            :rows="4"
            placeholder="请输入内容"
          />
          <div class="action-buttons">
            <el-button type="primary" @click="submitReply">保存修改</el-button>
          </div>
          
          <div v-if="currentReview.comment" class="existing-reply">
            <h4>当前评价内容</h4>
            <div class="reply-content">{{ currentReview.comment }}</div>
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- 用户详情抽屉 -->
    <el-drawer
      v-model="userDetailVisible"
      :title="userDetailTitle"
      size="500px"
      destroy-on-close
    >
      <div v-if="currentUserDetail" class="user-detail">
        <div class="detail-section">
          <h3>基本信息</h3>
          <div class="user-info">
            <el-avatar 
              :size="80" 
              :src="currentUserDetail.avatar_url"
              shape="circle"
            />
            <div class="user-details">
              <div class="nickname">{{ currentUserDetail.nickname }}</div>
              <div class="id">用户ID: {{ currentUserDetail.id }}</div>
              <div class="role">角色: {{ currentUserDetail.role === 'pet_owner' ? '宠物主人' : '帮溜员' }}</div>
              <div class="status">状态: {{ currentUserDetail.status === 'active' ? '活跃' : '禁用' }}</div>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h3>详细信息</h3>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="注册时间">{{ formatDate(currentUserDetail.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="性别">{{ currentUserDetail.gender === 'male' ? '男' : currentUserDetail.gender === 'female' ? '女' : '未知' }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ currentUserDetail.phone || '未绑定' }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div v-if="currentUserDetail.role === 'sitter'" class="detail-section">
          <h3>帮溜员信息</h3>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="服务区域">{{ currentUserDetail.service_area || '未设置' }}</el-descriptions-item>
            <el-descriptions-item label="服务次数">{{ currentUserDetail.service_count || 0 }}</el-descriptions-item>
            <el-descriptions-item label="评分">
              <el-rate
                v-model="currentUserDetail.rating"
                disabled
                show-score
                text-color="#ff9900"
                score-template="{value} 星"
              />
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
// <script> 部分未做修改，保持原样
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

const router = useRouter()

// 状态定义
const loading = ref(false)
const reviewList = ref([])
const reviewDetailVisible = ref(false)
const currentReview = ref(null)
const tableKey = ref(0)

// 用户详情抽屉
const userDetailVisible = ref(false)
const currentUserId = ref(null)
const currentUserDetail = ref(null)

// 筛选条件
const filters = reactive({
  keyword: '',
  min_rating: '',
  max_rating: '',
  is_anonymous: ''
})

// 分页配置
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

// 回复表单
const replyForm = reactive({
  content: ''
})

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

// 获取评价列表
const fetchReviewList = async () => {
  try {
    loading.value = true

    const params = {
      page: pagination.page,
      limit: pagination.limit
    }
    
    if (filters.keyword && filters.keyword.trim() !== '') {
      params.keyword = filters.keyword.trim()
    }
    if (filters.min_rating !== '') {
      params.min_rating = filters.min_rating
    }
    if (filters.max_rating !== '') {
      params.max_rating = filters.max_rating
    }
    if (filters.is_anonymous !== '') {
      params.is_anonymous = filters.is_anonymous === 'true'
    }

    const useSearchAPI = filters.keyword || filters.min_rating || filters.max_rating || filters.is_anonymous;
    const url = useSearchAPI ? '/api/review/admin/search' : '/api/review/admin/list';
    const response = await axios.get(url, { params })

    if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
      pagination.total = response.data.data.total
      reviewList.value = response.data.data.data
    } else {
      pagination.total = 0
      reviewList.value = []
      ElMessage.warning('获取的评价列表为空')
    }
  } catch (err) {
    console.error('获取评价列表失败:', err)
    ElMessage.error(err.response?.data?.message || '获取评价列表失败')
    pagination.total = 0
    reviewList.value = []
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchReviewList()
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
  await fetchReviewList()
}

const handlePageChange = async (val) => {
  pagination.page = val
  await fetchReviewList()
}

// 删除评价
const handleDeleteReview = (review) => {
  ElMessageBox.confirm(
    `确定要删除用户 "${review.user?.nickname || '未知用户'}" 的评价吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await axios.delete(`/api/review/admin/${review.id}`)
      ElMessage.success('删除成功')
      fetchReviewList()
    } catch (err) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

// 导出数据
const handleExport = async () => {
  try {
    const params = {
      min_rating: filters.min_rating,
      max_rating: filters.max_rating
    }
    
    const response = await axios.get('/api/review/admin/export', {
      params,
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `reviews_export_${new Date().toISOString().slice(0,10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('导出成功')
  } catch (err) {
    console.error('导出失败:', err)
    ElMessage.error('导出失败')
  }
}

// 查看评价详情
const viewReviewDetail = async (review) => {
  try {
    const response = await axios.get(`/api/review/admin/${review.id}/detail`)
    if (response.data.success) {
      currentReview.value = response.data.data
      replyForm.content = currentReview.value.comment || ''
      reviewDetailVisible.value = true
    } else {
      throw new Error(response.data.message)
    }
  } catch (err) {
    console.error('查看评价详情失败:', err)
    ElMessage.error('查看评价详情失败')
  }
}

// 切换评价显示/隐藏状态
const handleToggleVisibility = async (review) => {
  try {
    loading.value = true
    const response = await axios.post(`/api/review/admin/${review.id}/toggle-visibility`)
    if (response.data.success) {
      const index = reviewList.value.findIndex(r => r.id === review.id)
      if (index !== -1) {
        reviewList.value[index].is_anonymous = !reviewList.value[index].is_anonymous
        ElMessage.success(reviewList.value[index].is_anonymous ? '评价已隐藏' : '评价已显示')
      }
    }
  } catch (err) {
    console.error('切换显示状态失败:', err)
    ElMessage.error('操作失败')
  } finally {
    loading.value = false
  }
}

// 提交回复
const submitReply = async () => {
  try {
    if (!replyForm.content) {
      return ElMessage.warning('评价内容不能为空')
    }

    await axios.post(`/api/review/admin/${currentReview.value.id}/update`, {
      comment: replyForm.content
    })

    ElMessage.success('修改已保存')
    fetchReviewList()
    reviewDetailVisible.value = false
  } catch (err) {
    console.error('回复失败:', err)
    ElMessage.error('保存失败')
  }
}

// 打开用户详情抽屉
const userDetailTitle = computed(() => {
  return `用户详情 - ${currentUserDetail.value?.nickname || ''}`
})

const openUserDetail = async (userId) => {
  if (!userId) {
    ElMessage.warning('无效的用户ID')
    return
  }
  
  try {
    loading.value = true
    currentUserId.value = userId
    
    const response = await axios.get(`/api/user/admin/${userId}/detail`)
    
    if (response.data && response.data.data) {
      currentUserDetail.value = response.data.data
      userDetailVisible.value = true
    } else {
      throw new Error(response.data?.message || '无效的响应数据')
    }
  } catch (err) {
    console.error('获取用户详情失败:', err)
    ElMessage.error(`获取用户详情失败: ${err.response?.data?.message || err.message}`)
  } finally {
    loading.value = false
  }
}

// 跳转到订单详情
const handleUserClick = (user) => {
  if (!user || !user.id) {
    ElMessage.warning('用户ID为空')
    return
  }
  openUserDetail(user.id)
}

const handleSitterClick = (sitter) => {
  if (!sitter || !sitter.id) {
    ElMessage.warning('帮溜员ID为空')
    return
  }
  openUserDetail(sitter.id)
}

const goToOrderDetail = (orderNo) => {
  if (orderNo) {
    router.push(`/orders/${orderNo}`)
  }
}

// 初始化
onMounted(() => {
  fetchReviewList()
})
</script>

<style scoped>
.reviews-view {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.el-table {
  /* 移除固定高度和上边距 */
}

/* 新增：统一样式，设置表头背景色和字体 */
.el-table :deep(.el-table__header th) {
  background-color: #f8f8f9;
  font-weight: 600;
  color: #303133;
}

.empty-table {
  padding: 20px;
  text-align: center;
  color: #909399;
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

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.nickname {
  font-weight: 500;
}

.time, .order, .id {
  font-size: 12px;
  color: #909399;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  /* 简化样式，因为父级卡片提供了背景和边框 */
}

.no-data {
  color: #909399;
  text-align: center;
  padding: 10px;
}

.detail-section {
  margin-bottom: 20px;
}

.review-content {
  padding: 5px 0;
}

.review-content .rating {
  margin-bottom: 5px;
}

.review-content .comment {
  margin: 10px 0;
  line-height: 1.5;
}

.review-content .reply-content {
  margin-top: 10px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  line-height: 1.5;
}

.review-content .reply-label {
  font-weight: 500;
  color: #409eff;
}

.existing-reply {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.existing-reply h4 {
  margin-top: 0;
  margin-bottom: 10px;
}

.action-buttons {
  margin-top: 15px;
  text-align: right;
}

.el-drawer__header {
  margin-bottom: 0;
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
}

.el-drawer__body {
  padding: 20px;
}

.el-descriptions {
  margin-top: 10px;
}

.hidden-row {
  /* 定义隐藏行的样式，例如淡灰色背景 */
  background-color: #fdf6ec !important; 
}
.hidden-row:hover > td {
  background-color: #faecd8 !important;
}
</style>