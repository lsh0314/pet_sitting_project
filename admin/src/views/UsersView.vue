<!--
  UsersView.vue
  功能：后台管理系统的用户管理页面。
  - 展示所有用户列表，支持分页
  - 按昵称/ID搜索用户
  - 按角色筛选（宠物主人/帮遛员）
  - 按状态筛选（正常/已封禁）
  - 支持封禁/解封操作
  - 支持查看用户详情
  - 支持导出用户数据
-->

<template>
  <div class="users-view">
    <h2>用户管理</h2>
    <!-- 搜索和筛选 -->
    <el-card class="filter-card">
      <div class="filter-container">
        <el-input
          v-model="filters.keyword"
          placeholder="输入用户昵称或ID搜索"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
          style="width: 220px"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-select v-model="filters.role" placeholder="用户角色" clearable @change="handleSearch">
          <el-option label="全部角色" value="" />
          <el-option
            v-for="(label, value) in roleMap"
            :key="value"
            :label="label"
            :value="value"
          />
        </el-select>
        
        <el-select v-model="filters.status" placeholder="用户状态" clearable @change="handleSearch">
          <el-option label="全部状态" value="" />
          <el-option
            v-for="(label, value) in statusMap"
            :key="value"
            :label="label"
            :value="value"
          />
        </el-select>
        
        <el-button type="primary" @click="handleSearch">筛选</el-button>
        <el-button @click="resetFilters">重置</el-button>
        <el-button type="success" @click="handleExport">导出数据</el-button>
      </div>
    </el-card>
    <!-- 用户列表 -->
    <el-table
      v-loading="loading"
      :data="userList"
      :key="tableKey"
      border
      stripe
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <template #empty>
        <div v-if="userList.length === 0 && !loading" class="empty-table">
          {{ loading ? '加载中...' : '暂无数据' }}
        </div>
      </template>
      <el-table-column type="index" width="50" label="#" :key="'index'" />
      
      <el-table-column prop="id" label="用户ID" width="80" :key="'id'" />
      
      <el-table-column label="用户信息" min-width="200" :key="'user-info'">
        <template #default="{ row }">
          <div v-if="!row.nickname">加载中...</div>
          <div class="user-info">
            <el-avatar :size="40" :src="row.avatar_url">
              {{ row.nickname ? row.nickname.charAt(0) : 'U' }}
            </el-avatar>
            <div class="user-details">
              <div class="nickname">{{ row.nickname }}</div>
              <div class="join-time">注册时间: {{ formatDate(row.created_at) }}</div>
            </div>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column prop="role" label="角色" width="120">
        <template #default="{ row }">
          <el-tag
            :type="row.role === 'sitter' ? 'success' : 'info'"
            effect="plain"
          >
            {{ roleMap[row.role] }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag
            :type="row.status === 'active' ? 'success' : 'danger'"
          >
            {{ statusMap[row.status] }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            size="small"
            @click="viewUserDetail(row)"
          >
            详情
          </el-button>
          
          <el-button
            link
            :type="row.status === 'active' ? 'danger' : 'success'"
            size="small"
            @click="handleToggleStatus(row)"
          >
            {{ row.status === 'active' ? '封禁' : '解封' }}
          </el-button>
          
          <el-button
            link
            type="warning"
            size="small"
            @click="handleChangeRole(row)"
          >
            变更角色
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
        @update:current-page="(val) => pagination.page = val"
        @update:page-size="(val) => pagination.limit = val"
      />
      <div v-else class="no-data">暂无数据</div>
    </div>
    
    <!-- 用户详情抽屉 -->
    <el-drawer
      v-model="userDetailVisible"
      :title="'用户详情 - ' + (currentUser && currentUser.nickname || '')"
      size="500px"
      destroy-on-close
    >
      <div v-if="currentUser" class="user-detail">
        <div class="detail-header">
          <el-avatar :size="80" :src="currentUser.avatar_url">
            {{ currentUser.nickname ? currentUser.nickname.charAt(0) : 'U' }}
          </el-avatar>
          <h3>{{ currentUser.nickname }}</h3>
        </div>
        
        <el-form :model="editForm" label-width="100px">
          <el-form-item label="用户ID">
            <el-input v-model="currentUser.id" disabled />
          </el-form-item>
          <el-form-item label="昵称">
            <el-input v-model="editForm.nickname" />
          </el-form-item>
          <el-form-item label="头像URL">
            <el-input v-model="editForm.avatar_url" />
          </el-form-item>
          <el-form-item label="性别">
            <el-select v-model="editForm.gender">
              <el-option label="男" value="male" />
              <el-option label="女" value="female" />
              <el-option label="未知" value="unknown" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSaveUserInfo">保存</el-button>
          </el-form-item>
        </el-form>        <el-descriptions :column="1" border>
          <el-descriptions-item label="用户角色">{{ roleMap[currentUser.role] }}</el-descriptions-item>
          <el-descriptions-item label="账号状态">
            <el-tag :type="currentUser.status === 'active' ? 'success' : 'danger'">
              {{ statusMap[currentUser.status] }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="性别">
            {{ genderMap[currentUser.gender || 'unknown'] }}
          </el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ formatDate(currentUser.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="最后更新">{{ formatDate(currentUser.updated_at) }}</el-descriptions-item>
        </el-descriptions>
        
        <template v-if="currentUser.role === 'sitter'">
          <div class="detail-section">
            <h4>帮溜员资质</h4>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="认证状态">
                <el-tag :type="currentUser.identity_status === 'verified' ? 'success' : 'warning'">
                  {{ identityStatusMap[currentUser.identity_status] }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="服务次数">{{ currentUser.service_count || 0 }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </template>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
//import api from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

// 状态定义
const loading = ref(false)
const userList = ref([])
const userDetailVisible = ref(false)
const currentUser = ref(null)
const tableKey = ref(0)

// 筛选条件
const filters = reactive({
  keyword: '',
  role: '',
  status: ''
})

// 分页配置
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

// 编辑表单
const editForm = ref({
  nickname: '',
  avatar_url: '',
  gender: 'unknown'
})

// 映射字典
const roleMap = {
  pet_owner: '宠物主人',
  sitter: '帮溜员'
}

const statusMap = {
  active: '正常',
  banned: '已封禁'
}

const genderMap = {
  male: '男',
  female: '女',
  unknown: '未知'
}

const identityStatusMap = {
  unsubmitted: '未申请',
  pending: '审核中',
  approved: '已认证',
  rejected: '未通过'
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

// 获取用户列表
const fetchUserList = async () => {
  console.log('开始获取用户列表，参数:', { page: pagination.page, limit: pagination.limit, filters }) // 详细的调试日志
  try {
    loading.value = true

    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...filters
    }

    // 如果有搜索关键词，使用搜索接口，否则使用列表接口
    const url = filters.keyword ? '/api/user/admin/search' : '/api/user/admin/list'
    const response = await axios.get(url, { params })

    console.log('API响应:', response.data) // 调试日志

    if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
      // 先更新total，再更新列表，避免UI不同步
      pagination.total = response.data.data.total
      userList.value = response.data.data.data
      console.log('更新后的分页信息:', { 
        page: pagination.page, 
        limit: pagination.limit, 
        total: pagination.total,
        listLength: userList.value.length 
      })
    } else {
      pagination.total = 0
      userList.value = []
      ElMessage.warning('获取的用户列表为空')
    }
  } catch (err) {
    console.error('获取用户列表失败:', err)
    console.error('错误详情:', err.response?.data)
    console.error('Token:', localStorage.getItem('token'))
    ElMessage.error(err.response?.data?.message || '获取用户列表失败')
    // 出错时重置数据
    pagination.total = 0
    userList.value = []
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchUserList()
}

// 重置筛选
const resetFilters = () => {
  Object.keys(filters).forEach(key => filters[key] = '')
  handleSearch()
}

// 分页处理
const handleSizeChange = async (val) => {
  console.log('切换每页显示条数:', { oldLimit: pagination.limit, newLimit: val })
  pagination.limit = val
  pagination.page = 1 // 切换每页条数时重置到第一页
  await fetchUserList()
  console.log('切换每页条数后的分页状态:', pagination)
}

const handlePageChange = async (val) => {
  console.log('切换页码:', { oldPage: pagination.page, newPage: val })
  pagination.page = val
  await fetchUserList()
  console.log('切换页码后的分页状态:', pagination)
}

// 封禁/解封
const handleToggleStatus = (user) => {
  const action = user.status === 'active' ? '封禁' : '解封'
  const newStatus = user.status === 'active' ? 'banned' : 'active'
  
  ElMessageBox.confirm(
    `确定要${action}用户 "${user.nickname}" 吗？`,
    '确认操作',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await axios.put(`/api/user/admin/${user.id}/status`, { status: newStatus })
      ElMessage.success(`${action}成功`)
      fetchUserList()
    } catch (err) {
      ElMessage.error(`${action}失败`)
    }
  }).catch(() => {})
}

// 变更角色
const handleChangeRole = (user) => {
  const currentRole = user.role
  const newRole = currentRole === 'pet_owner' ? 'sitter' : 'pet_owner'
  
  ElMessageBox.confirm(
    `确定要将用户 "${user.nickname}" 的角色从${roleMap[currentRole]}变更为${roleMap[newRole]}吗？`,
    '确认变更角色',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await axios.put(`/api/user/admin/${user.id}/role`, { role: newRole })
      ElMessage.success('角色变更成功')
      fetchUserList()
    } catch (err) {
      ElMessage.error('角色变更失败')
    }
  }).catch(() => {})
}

// 导出数据
const handleExport = async () => {
  try {
    const params = {
      role: filters.role,
      status: filters.status
    }
    
    const response = await axios.get('/api/user/admin/export', {
      params,
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `users_export_${new Date().toISOString().slice(0,10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('导出成功')
  } catch (err) {
    console.error('导出失败:', err)
    ElMessage.error('导出失败')
  }
}

// 保存用户信息
const handleSaveUserInfo = async () => {
  try {
    await axios.put(`/api/user/admin/${currentUser.value.id}/info`, editForm.value)
    ElMessage.success('保存成功')
    fetchUserList()
  } catch (err) {
    console.error('保存失败:', err)
    ElMessage.error('保存失败')
  }
}

// 选中用户列表
const selectedUsers = ref([])

// 表格多选
const handleSelectionChange = (val) => {
  selectedUsers.value = val
}

// 查看用户详情
const viewUserDetail = async (user) => {
  try {
    // 先获取完整的用户信息
    const response = await axios.get(`/api/user/admin/${user.id}/detail`)
    if (response.data.success) {
      currentUser.value = response.data.data
      userDetailVisible.value = true
      editForm.value = {
        nickname: response.data.data.nickname,
        avatar_url: response.data.data.avatar_url,
        gender: response.data.data.gender || 'unknown'
      }
      console.log('用户详情:', currentUser.value) // 调试日志
    } else {
      throw new Error(response.data.message)
    }
  } catch (err) {
    console.error('查看用户详情失败:', err)
    ElMessage.error('查看用户详情失败')
  }
}

// 初始化
onMounted(() => {
  console.log('组件挂载完成，开始获取用户列表') // 调试日志
  fetchUserList().catch(err => {
    console.error('获取用户列表失败:', err) // 调试日志
  })
})
</script>

<style scoped>
.users-view {
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

.join-time {
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

.detail-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.detail-section {
  margin-top: 20px;
}

.el-table {
  margin-top: 20px;
}

.el-table :deep(.el-table__cell) {
  padding: 12px 0;
}

.el-table :deep(.el-table__header th) {
  background-color: #f8f8f9;
  font-weight: 600;
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
  margin-top: 20px;
}
</style>
