<!--
  WithdrawalsView.vue
  功能：后台管理系统的提现审核页面。
  - 展示所有待处理的提现申请
  - 支持审核通过/驳回操作
  - 支持查看详情、筛选、分页等功能
-->

<template>
  <div class="withdrawals-view">
    <el-container>
      <el-main>
        <h2>提现审核</h2>
        
        <!-- 搜索和筛选 -->
        <el-card class="filter-card">
          <div class="filter-container">
            <el-input
              v-model="searchForm.keyword"
              placeholder="输入用户ID或昵称搜索"
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
              v-model="searchForm.status" 
              placeholder="审核状态" 
              clearable 
              @change="handleSearch"
              style="width: 160px"
            >
              <el-option label="全部状态" value="" />
              <el-option label="待审核" value="processing" />
              <el-option label="已通过" value="approved" />
              <el-option label="已拒绝" value="rejected" />
            </el-select>

            <el-button type="primary" @click="handleSearch">筛选</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </div>
        </el-card>

        <!-- 提现列表 -->
        <el-card v-loading="loading">
          <div class="table-container">
            <el-table 
              :data="withdrawals" 
              border 
              style="width: 100%"
              v-if="withdrawals.length > 0"
            >
              <el-table-column prop="id" label="ID" min-width="80" />
              <el-table-column label="用户信息" min-width="200">
                <template #default="scope">
                  <div class="user-info">
                    <el-avatar :size="32" :src="scope.row.avatar_url">
                      {{ scope.row.nickname ? scope.row.nickname.charAt(0) : 'U' }}
                    </el-avatar>
                    <span class="nickname">{{ scope.row.nickname }}</span>
                  </div>
                </template>
              </el-table-column>              <el-table-column prop="amount" label="金额" min-width="120">
                <template #default="scope">
                  ¥{{ Number(scope.row.amount).toFixed(2) }}
                </template>
              </el-table-column>
              <el-table-column prop="method" label="提现方式" min-width="120" />
              <el-table-column prop="status" label="状态" min-width="100">
                <template #default="scope">
                  <el-tag :type="getStatusType(scope.row.status)">
                    {{ formatStatus(scope.row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="created_at" label="申请时间" min-width="180">
                <template #default="scope">
                  {{ formatDate(scope.row.created_at) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" min-width="120">
                <template #default="scope">
                  <el-button 
                    size="small" 
                    type="primary"
                    @click="handleView(scope.row)"
                  >查看详情</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 分页 -->
          <div class="pagination-container">
            <el-pagination
              :current-page="currentPage"
              :page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="total"
              layout="total, sizes, prev, pager, next"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>

        <!-- 详情抽屉 -->
        <el-drawer
          v-model="detailDrawer"
          :title="'提现详情 #' + (currentWithdrawal && currentWithdrawal.id || '')"
          direction="rtl"
          size="50%"
        >
          <el-descriptions v-if="currentWithdrawal" class="margin-top" :column="1" border>
            <el-descriptions-item label="用户信息">
              <div class="user-detail-info">
                <el-avatar :size="64" :src="currentWithdrawal.avatar_url" />
                <div class="user-text-info">
                  <div class="nickname">{{ currentWithdrawal.nickname }}</div>
                  <div class="wechat">微信: {{ currentWithdrawal.wechat_openid }}</div>
                </div>
              </div>
            </el-descriptions-item>
            
            <el-descriptions-item label="提现金额">
              ¥{{ currentWithdrawal.amount.toFixed(2) }}
            </el-descriptions-item>
            
            <el-descriptions-item label="提现方式">
              {{ currentWithdrawal.method }}
            </el-descriptions-item>

            <el-descriptions-item label="申请时间">
              {{ formatDate(currentWithdrawal.created_at) }}
            </el-descriptions-item>
            
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusType(currentWithdrawal.status)">
                {{ formatStatus(currentWithdrawal.status) }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>

          <div v-if="currentWithdrawal && currentWithdrawal.status === 'processing'" class="drawer-footer">
            <el-button type="success" @click="handleApprove(currentWithdrawal)">通过审核</el-button>
            <el-button type="danger" @click="handleReject(currentWithdrawal)">拒绝审核</el-button>
          </div>
        </el-drawer>

        <!-- 拒绝原因对话框 -->
        <el-dialog
          v-model="rejectDialogVisible"
          title="驳回提现"
          width="500px"
          @close="resetRejectDialog"
          :close-on-click-modal="false"
          :close-on-press-escape="false"
        >
          <el-form 
            ref="rejectFormRef"
            :model="rejectForm"
            :rules="{
              reason: [
                { required: true, message: '请输入驳回原因', trigger: 'blur' },
                { min: 2, message: '原因至少需要2个字符', trigger: 'blur' }
              ]
            }"
          >
            <el-form-item prop="reason" label="驳回原因">
              <el-input
                v-model="rejectForm.reason"
                type="textarea"
                :rows="4"
                placeholder="请输入驳回原因，将会通知给申请用户"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
          </el-form>
          
          <template #footer>
            <div class="dialog-footer">
              <el-button @click="resetRejectDialog">取消</el-button>
              <el-button type="danger" @click="submitReject" :loading="submitting">确认驳回</el-button>
            </div>
          </template>
        </el-dialog>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

// 状态变量
const loading = ref(false)
const submitting = ref(false)
const withdrawals = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const detailDrawer = ref(false)
const currentWithdrawal = ref(null)
const rejectDialogVisible = ref(false)
const rejectFormRef = ref(null)

// 搜索表单
const searchForm = reactive({
  keyword: '',
  status: ''
})

// 拒绝表单
const rejectForm = reactive({
  id: null,
  reason: ''
})

// 格式化状态
const formatStatus = (status) => {
  const statuses = {
    processing: '处理中',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return statuses[status] || status
}

const getStatusType = (status) => {
  const types = {
    processing: 'info',
    approved: 'success',
    rejected: 'danger'
  }
  return types[status] || 'info'
}

const formatDate = (dateString) => {
  if (!dateString) return '暂无'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取提现列表
const fetchWithdrawals = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      ...searchForm
    }
    
    // TODO: 替换为实际API
    const response = await axios.get('/api/withdrawals/admin/list', { params })
    console.log('API响应数据:', response.data)
    if (response.data.success) {
      const items = response.data.data.items || []
      withdrawals.value = items.map(item => ({
        ...item,
        created_at: new Date(item.created_at).toISOString(),
        amount: item.amount || '0.00'
      }))
      total.value = response.data.data.total || 0
      console.log('处理后数据:', withdrawals.value)
    } else {
      ElMessage.error(response.data.message || '获取提现列表失败')
    }
  } catch (error) {
    console.error('获取提现列表失败:', error)
    ElMessage.error('获取提现列表失败')
  } finally {
    loading.value = false
  }
}

// 处理页码变化
const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchWithdrawals()
}

// 处理每页条数变化
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  fetchWithdrawals()
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchWithdrawals()
}

// 重置搜索条件
const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  handleSearch()
}

// 查看详情
const handleView = async (row) => {
  try {
    loading.value = true
    // TODO: 替换为实际API
    const response = await axios.get(`/api/withdrawals/admin/${row.id}`)
    if (response.data.success) {
      currentWithdrawal.value = response.data.data
      detailDrawer.value = true
    } else {
      ElMessage.error(response.data.message || '获取详情失败')
    }
  } catch (error) {
    console.error('获取提现详情失败:', error)
    ElMessage.error('获取详情失败: ' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

// 审核相关方法
const handleApprove = async (withdrawal) => {
  try {
    await ElMessageBox.confirm('确认通过该提现申请吗？', '确认操作', {
      confirmButtonText: '确定通过',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    submitting.value = true
    // TODO: 替换为实际API
    const response = await axios.post(`/api/withdrawals/admin/${withdrawal.id}/review`, {
      action: 'approve'
    })
    
    if (response.data.success) {
      ElMessage.success('审核通过成功')
      detailDrawer.value = false
      fetchWithdrawals()
    } else {
      ElMessage.error(response.data.message || '审核操作失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('审核操作失败:', error)
      ElMessage.error(error.response?.data?.message || '审核操作失败')
    }
  } finally {
    submitting.value = false
  }
}

const handleReject = async (withdrawal) => {
  currentWithdrawal.value = withdrawal
  rejectDialogVisible.value = true
}

const resetRejectDialog = () => {
  rejectDialogVisible.value = false
  rejectForm.reason = ''
  if (rejectFormRef.value) {
    rejectFormRef.value.resetFields()
  }
}

const submitReject = async () => {
  if (!currentWithdrawal.value) return

  try {
    // 表单验证
    await rejectFormRef.value.validate()
    
    submitting.value = true
    // TODO: 替换为实际API
    await axios.post(`/api/withdrawals/admin/${currentWithdrawal.value.id}/review`, {
      action: 'reject',
      reason: rejectForm.reason.trim()
    })

    ElMessage.success('审核驳回成功')
    rejectDialogVisible.value = false
    detailDrawer.value = false
    resetRejectDialog()
    fetchWithdrawals()
  } catch (error) {
    if (error?.message) {
      ElMessage.error('操作失败: ' + (error.response?.data?.message || error.message))
    }
  } finally {
    submitting.value = false
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchWithdrawals()
})
</script>

<style scoped>
.withdrawals-view {
  background-color: #f5f7fa;
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.el-container {
  flex: 1;
  min-height: 0;
  width: 100%;
}

.el-main {
  padding: 20px;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
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

.table-container {
  flex: 1;
  width: 100%;
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

/* 详情抽屉样式 */
.user-detail-info {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.user-text-info .nickname {
  font-size: 1.1em;
  font-weight: bold;
  margin-bottom: 0.5em;
}

.user-text-info .wechat {
  color: #666;
  font-size: 0.9em;
  line-height: 1.5;
}

.drawer-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  background: #fff;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info .nickname {
  font-size: 14px;
  color: #333;
}

.user-info :deep(.el-avatar) {
  flex-shrink: 0;
}
</style>
