<!--
  VerificationsView.vue
  功能：后台管理系统的认证审核页面。
  - 展示所有待审核的实名认证/证书认证项
  - 支持审核通过/驳回操作
  - 支持查看详情、筛选、分页等功能
-->

<template>  <div class="verifications-view">
    <el-container>
      <el-main>
        <h2>认证审核</h2>
        <!-- 搜索和筛选 --><el-card class="filter-card">
      <div class="filter-container">
        <el-input
          v-model="searchForm.keyword"
          placeholder="输入用户昵称搜索"
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
          v-model="searchForm.type" 
          placeholder="认证类型" 
          clearable 
          @change="handleSearch"
          style="width: 160px"
        >
          <el-option label="全部类型" value="" />
          <el-option
            v-for="(label, value) in typeMap"
            :key="value"
            :label="label"
            :value="value"
          />
        </el-select>

        <el-select 
          v-model="searchForm.status" 
          placeholder="审核状态" 
          clearable 
          @change="handleSearch"
          style="width: 160px"
        >
          <el-option label="全部状态" value="" />
          <el-option
            v-for="(label, value) in statusMap"
            :key="value"
            :label="label"
            :value="value"
          />
        </el-select>

        <el-button type="primary" @click="handleSearch">筛选</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </div>
    </el-card>

    <el-card v-loading="loading">
      <div class="table-container">
        <el-table :data="verifications" border style="width: 100%">
          <el-table-column prop="id" label="ID" min-width="80" />
          <el-table-column label="用户信息" min-width="200">          <template #default="scope">
            <div class="user-info">
              <el-avatar :size="32" :src="scope.row.avatar_url">
                {{ scope.row.nickname ? scope.row.nickname.charAt(0) : 'U' }}
              </el-avatar>
              <span class="nickname">{{ scope.row.nickname }}</span>
            </div>
          </template>
          </el-table-column>
          <el-table-column prop="type" label="认证类型" min-width="120">
            <template #default="scope">
              <el-tag :type="getVerificationTypeTag(scope.row.type)">
                {{ formatVerificationType(scope.row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" min-width="100">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)">
                {{ formatStatus(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="提交时间" min-width="180">
            <template #default="scope">
              {{ formatDate(scope.row.created_at) }}
            </template>
          </el-table-column>        <el-table-column label="操作" min-width="120">
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
      :title="'认证详情 #' + (currentVerification && currentVerification.id || '')"
      direction="rtl"
      size="50%"
    >
      <el-descriptions v-if="currentVerification" class="margin-top" :column="1" border>
        <el-descriptions-item label="用户信息">
          <div class="user-detail-info">
            <el-avatar :size="64" :src="currentVerification.avatar_url" />
            <div class="user-text-info">
              <div class="nickname">{{ currentVerification.nickname }}</div>
              <div class="wechat">微信: {{ currentVerification.wechat_openid }}</div>
              <div class="role">角色: {{ formatRole(currentVerification.role) }}</div>
              <div class="gender">性别: {{ formatGender(currentVerification.gender) }}</div>
            </div>
          </div>
        </el-descriptions-item>
        
        <el-descriptions-item label="认证类型">
          <el-tag :type="getVerificationTypeTag(currentVerification.type)">
            {{ formatVerificationType(currentVerification.type) }}
          </el-tag>
        </el-descriptions-item>
        
        <el-descriptions-item label="认证材料">
          <div v-if="currentVerification.materials" class="materials-preview">
            <div v-for="(material, index) in parseMaterials(currentVerification.materials)" :key="index">
              <div class="material-item">
                <div class="material-title">{{ material.title }}</div>
                <div v-if="material.type === 'image'" class="material-images">
                  <el-image 
                    v-for="(img, imgIndex) in material.content" 
                    :key="imgIndex"
                    :src="img"
                    :preview-src-list="[img]"
                    fit="cover"
                    class="material-image"
                  />
                </div>
                <div v-else-if="material.type === 'text'" class="material-text">
                  {{ material.content }}
                </div>
              </div>
            </div>
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="提交时间">
          {{ formatDate(currentVerification.created_at) }}
        </el-descriptions-item>
        
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentVerification.status)">
            {{ formatStatus(currentVerification.status) }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <div v-if="currentVerification && currentVerification.status === 'pending'" class="drawer-footer">
        <el-button type="success" @click="handleApprove(currentVerification)">通过审核</el-button>
        <el-button type="danger" @click="handleReject(currentVerification)">拒绝审核</el-button>
      </div>
    </el-drawer>

    <!-- 拒绝原因对话框 -->
    <el-dialog
      v-model="rejectDialogVisible"
      title="驳回认证"
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
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 状态变量
const loading = ref(false)
const submitting = ref(false)
const verifications = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const detailDrawer = ref(false)
const currentVerification = ref(null)
const rejectDialogVisible = ref(false)
const rejectFormRef = ref(null)

// 搜索表单
const searchForm = reactive({
  keyword: '', // 搜索关键词
  type: '',    // 认证类型
  status: ''   // 认证状态
})

// 拒绝表单
const rejectForm = reactive({
  id: null,
  remarks: ''
})

// 认证类型搜索框状态
const showTypeSelect = ref(false)
const typeText = ref('')

// 表格高度
const tableHeight = ref(500)

// 处理认证类型选择
const handleTypeChange = (value) => {
  typeText.value = value ? typeMap[value] : ''
  showTypeSelect.value = false
}

// 处理认证类型选择框显示状态
const handleTypeSelectVisible = (visible) => {
  if (!visible) {
    setTimeout(() => {
      showTypeSelect.value = false
    }, 200)
  }
}

// 计算表格高度
const calculateTableHeight = () => {
  // 留出顶部和底部的空间
  const windowHeight = window.innerHeight
  const offset = 260 // 头部高度 + 筛选框高度 + 分页高度 + 边距
  tableHeight.value = windowHeight - offset
}

// 格式化函数
// 认证类型映射 (与数据库verifications表一致)
const typeMap = {
  identity: '实名认证',
  certificate: '证书认证'
}

// 认证类型对应的标签样式
const typeTagMap = {
  identity: 'primary',
  certificate: 'info'
}

const formatVerificationType = (type) => {
  return typeMap[type] || type
}

const getVerificationTypeTag = (type) => {
  return typeTagMap[type] || 'info'
}

// 状态映射
const statusMap = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝'
}

// 初始化搜索表单中的类型和状态
onMounted(() => {
  fetchVerifications()
  calculateTableHeight()
  window.addEventListener('resize', calculateTableHeight)
  
  // 确保下拉选择器有初始值
  searchForm.type = ''
  searchForm.status = ''
})

// 认证附加信息格式化
const formatVerificationInfo = (verification) => {
  if (!verification) return {}
  
  const info = {}
  try {
    // 解析JSON字段
    info.photos = verification.photos ? JSON.parse(verification.photos) : []
    info.materials = verification.materials ? JSON.parse(verification.materials) : []
    info.identity = verification.identity_info ? JSON.parse(verification.identity_info) : {}
    
    // 格式化性别
    info.gender = verification.gender === 'male' ? '男' : verification.gender === 'female' ? '女' : '未知'
    
    // 格式化角色
    info.role = verification.role === 'pet_owner' ? '宠物主' : verification.role === 'sitter' ? '帮溜员' : '未知'
    
  } catch (error) {
    console.error('解析认证信息失败:', error)
  }
  
  return info
}

const formatStatus = (status) => {
  const statuses = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return statuses[status] || status
}

const getStatusType = (status) => {
  const types = {
    pending: 'warning',
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

// 获取认证列表
const fetchVerifications = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      ...searchForm
    }
    
    const response = await axios.get('/api/verifications/admin/list', { params })
    if (response.data.success) {
      verifications.value = response.data.data.items
      total.value = response.data.data.total
    } else {
      ElMessage.error('获取认证列表失败')
    }
  } catch (error) {
    console.error('获取认证列表失败:', error)
    ElMessage.error('获取认证列表失败')
  } finally {
    loading.value = false
  }
}

// 处理页码变化
const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchVerifications()
}

// 处理每页条数变化
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  fetchVerifications()
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1 // 重置到第一页
  fetchVerifications()
}

// 重置搜索条件
const resetSearch = () => {
  searchForm.keyword = ''  // 清空搜索关键词
  searchForm.type = ''     // 清空认证类型
  searchForm.status = ''   // 清空状态
  handleSearch()
}

// 查看详情
const handleView = async (row) => {
  try {
    loading.value = true
    const response = await axios.get(`/api/verifications/admin/${row.id}`)
    if (response.data.success) {
      currentVerification.value = response.data.data
      // 确保有认证材料数据
      currentVerification.value.materials = currentVerification.value.submitted_data || []
      detailDrawer.value = true
    } else {
      ElMessage.error(response.data.message || '获取详情失败')
    }
  } catch (error) {
    console.error('获取认证详情失败:', error)
    ElMessage.error('获取详情失败: ' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

// 解析认证材料
const parseMaterials = (materials) => {
  if (!materials) return []
  
  try {
    const parsedMaterials = typeof materials === 'string' ? JSON.parse(materials) : materials
    return parsedMaterials.map(material => {
      return {
        title: material.title || '认证材料',
        type: material.type || 'text',
        content: material.content || ''
      }
    })
  } catch (error) {
    console.error('解析认证材料失败:', error)
    return []
  }
}

// 格式化性别
const formatGender = (gender) => {
  const genderMap = {
    male: '男',
    female: '女'
  }
  return genderMap[gender] || '未知'
}

// 格式化角色
const formatRole = (role) => {
  const roleMap = {
    pet_owner: '宠物主',
    sitter: '帮溜员'
  }
  return roleMap[role] || '未知'
}

// 审核相关方法
const handleApprove = async (verification) => {
  try {
    await ElMessageBox.confirm('确认通过该认证申请吗？', '确认操作', {
      confirmButtonText: '确定通过',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    submitting.value = true
    const response = await axios.post(`/api/verifications/admin/${verification.id}/review`, {
      status: 'approved',
      action: 'approve'
    })
    
    if (response.data.success) {
      ElMessage.success('审核通过成功')
      detailDrawer.value = false
      fetchVerifications()
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

const handleReject = async (verification) => {
  currentVerification.value = verification
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
  if (!currentVerification.value) return

  try {
    // 表单验证
    await rejectFormRef.value.validate()
    
    submitting.value = true
    await axios.post(`/api/verifications/admin/${currentVerification.value.id}/review`, {
      action: 'reject',
      reason: rejectForm.reason.trim()
    })

    ElMessage.success('审核驳回成功')
    rejectDialogVisible.value = false
    detailDrawer.value = false
    resetRejectDialog()
    fetchVerifications() // 刷新列表
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
  fetchVerifications()
  calculateTableHeight()
  window.addEventListener('resize', calculateTableHeight)
})

onUnmounted(() => {
  window.removeEventListener('resize', calculateTableHeight)
})
</script>

<style scoped>
.verifications-view {
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

.table-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.table-card :deep(.el-card__body) {
  height: 100%;
  padding: 0;
}

.el-table {
  flex: 1;
  width: 100%;
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

.user-text-info .wechat,
.user-text_info .role,
.user-text-info .gender {
  color: #666;
  font-size: 0.9em;
  line-height: 1.5;
}

.materials-preview {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.material-item {
  margin-bottom: 1rem;
}

.material-title {
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #333;
}

.material-images {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.material-image {
  width: 120px;
  height: 120px;
  border-radius: 4px;
  object-fit: cover;
}

.material-text {
  background: #f5f7fa;
  padding: 1rem;
  border-radius: 4px;
  color: #666;
}

.status-remarks {
  margin-top: 0.5rem;
  color: #666;
  font-size: 0.9em;
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

/* 设置表格内容溢出处理 */
.el-table :deep(.el-table__body-wrapper) {
  overflow-x: hidden;
}

.el-table :deep(td) {
  padding: 8px 0;
}

.el-table :deep(.el-table__cell) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
