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
        
        <el-button type="primary" @click="handleSearch">筛选</el-button>
        <el-button @click="resetFilters">重置</el-button>
        <el-button type="success" @click="handleExport">导出数据</el-button>
      </div>
    </el-card>
    <!-- 评价列表 -->
    <el-table
      v-loading="loading"
      :data="reviewList"
      :key="tableKey"
      border
      stripe
      style="width: 100%"
    >
      <template #empty>
        <div v-if="reviewList.length === 0 && !loading" class="empty-table">
          {{ loading ? '加载中...' : '暂无数据' }}
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
                <div class="nickname">{{ (row.user && row.user.nickname) || '未知用户' }}</div>
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
              <div class="nickname">{{ (row.sitter && row.sitter.nickname) || '未知帮溜员' }}</div>
              <div class="order">订单号: {{ (row.order && row.order.order_no) || '未知' }}</div>
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
            type="warning"
            size="small"
            @click="handleReplyReview(scope.row)"
          >
            修改
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

// 状态定义
const loading = ref(false)
const reviewList = ref([])
const reviewDetailVisible = ref(false)
const currentReview = ref(null)
const tableKey = ref(0)

// 筛选条件
const filters = reactive({
  keyword: '',
  min_rating: '',
  max_rating: ''
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

    // 构建参数对象，过滤掉空值参数
    const params = {
      page: pagination.page,
      limit: pagination.limit
    }
    
    // 只添加非空的筛选条件
    if (filters.keyword && filters.keyword.trim() !== '') {
      params.keyword = filters.keyword.trim()
    }
    if (filters.min_rating !== '') {
      params.min_rating = filters.min_rating
    }
    if (filters.max_rating !== '') {
      params.max_rating = filters.max_rating
    }

    // 如果有搜索关键词，使用搜索接口，否则使用列表接口
    const useSearchAPI = filters.keyword || filters.min_rating || filters.max_rating;
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

// 回复评价
const handleReplyReview = (review) => {
  currentReview.value = review
  replyForm.content = review.comment || ''
  reviewDetailVisible.value = true
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
  margin-top: 20px;
  height: calc(100vh - 300px);
  overflow-y: auto;
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
  background: white;
  padding: 15px;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
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

.review-content .content {
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
</style>
