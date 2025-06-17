<!--
  OrdersView.vue
  功能：后台管理系统的订单管理页面。
  - 展示所有订单列表
  - 支持订单筛选、查看详情、操作等（后续可扩展）
  - 通过表格组件展示订单核心信息
-->
<template>
  <div class="orders-container">
    <div class="page-header">
      <h2 class="page-title">订单管理</h2>
      <div class="page-actions">
        <el-button type="primary" @click="exportOrders">导出订单</el-button>
      </div>
    </div>
    
    <!-- 搜索过滤 -->
    <el-card>
      <el-form :model="searchForm" inline @submit.prevent="handleSearch">
        <el-form-item label="订单号">
          <el-input v-model="searchForm.orderId" placeholder="请输入订单号" clearable />
        </el-form-item>
        
        <el-form-item label="用户">
          <el-input v-model="searchForm.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        
        <el-form-item label="服务类型">
          <el-select v-model="searchForm.serviceType" placeholder="所有类型" clearable>
            <el-option label="遛狗" value="walk" />
            <el-option label="喂食" value="feed" />
            <el-option label="寄养" value="care" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="订单状态">
          <el-select v-model="searchForm.status" placeholder="所有状态" clearable>
            <el-option label="待支付" value="pending" />
            <el-option label="已支付" value="paid" />
            <el-option label="服务中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
            <el-option label="已退款" value="refunded" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="下单时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 订单表格 -->
    <el-card>
      <div v-loading="loading" ref="tableContainer">
        <el-table 
          :data="orders" 
          style="width: 100%" 
          border
          ref="orderTable"
          @hook:mounted="onTableMounted"
        >
          <el-table-column prop="id" label="订单号" width="80" />
          <el-table-column label="用户信息" width="120">
            <template #default="scope">
              <el-tooltip :content="scope.row.ownerName || '未知用户'" placement="top">
                <span>{{ scope.row.ownerName || '未知用户' }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="宠物信息" width="120">
            <template #default="scope">
              <el-tooltip :content="scope.row.petName || '未知宠物'" placement="top">
                <span>{{ scope.row.petName || '未知宠物' }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column prop="serviceType" label="服务类型" width="100">
            <template #default="scope">
              {{ formatServiceType(scope.row.serviceType) }}
            </template>
          </el-table-column>
          <el-table-column label="服务时间" width="200">
            <template #default="scope">
              {{ formatDate(scope.row.serviceDate) }}
            </template>
          </el-table-column>
          <el-table-column label="金额" width="100">
            <template #default="scope">
              ¥{{ parseFloat(scope.row.price).toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag 
                :class="`${scope.row.status}-tag`"
              >
                {{ formatOrderStatus(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="180">
            <template #default="scope">
              {{ formatDate(scope.row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="scope">
              <el-button size="small" @click="viewOrderDetail(scope.row.id)">
                查看
              </el-button>
              <el-button 
                size="small" 
                type="warning" 
                v-if="scope.row.status === 'paid'"
                @click="updateOrderStatus(scope.row.id, 'in_progress')"
              >
                开始服务
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 分页 -->
        <el-pagination
          v-if="total > 0"
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
        
        <!-- 空状态 -->
        <el-empty
          v-if="!loading && orders.length === 0"
          description="暂无订单数据"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'

// 数据
const orders = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const orderTable = ref(null)
const tableContainer = ref(null)
const router = useRouter()

// 搜索表单
const searchForm = reactive({
  orderId: '',
  username: '',
  serviceType: '',
  status: '',
  dateRange: null
})

// 方法
const formatServiceType = (type) => {
  const typeMap = {
    'walk': '遛狗',
    'feed': '喂食',
    'care': '寄养'
  }
  return typeMap[type] || type
}

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

const getOrderStatusType = (status) => {
  // 全部使用自定义class
  return status || 'default-status'
}

const formatOrderStatus = (status) => {
  const statusMap = {
    'pending': '待支付',
    'paid': '已支付',
    'ongoing': '服务中',
    'completed': '已完成',
    'cancelled': '已取消',
    'refunded': '已退款',
    'accepted': '已接受',
    'confirmed': '已确认'
  }
  return statusMap[status] || status
}

const handleSizeChange = (val) => {
  pageSize.value = val
  fetchOrders()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchOrders()
}

const handleSearch = () => {
  currentPage.value = 1
  fetchOrders()
}

const resetSearch = () => {
  searchForm.orderId = ''
  searchForm.username = ''
  searchForm.serviceType = ''
  searchForm.status = ''
  searchForm.dateRange = null
  handleSearch()
}

const exportOrders = async () => {
  try {
    ElMessage.info('正在导出订单数据...')
    const params = {
      orderId: searchForm.orderId,
      username: searchForm.username,
      serviceType: searchForm.serviceType,
      status: searchForm.status
    }
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
    }
    
    const response = await axios.get('/api/order/admin/export', {
      params,
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `orders_${new Date().getTime()}.xlsx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('订单导出成功')
  } catch (error) {
    ElMessage.error('导出失败: ' + error.message)
    console.error('导出错误:', error)
  }
}

const fetchOrders = async () => {
  try {
    loading.value = true
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      orderId: searchForm.orderId,
      username: searchForm.username,
      serviceType: searchForm.serviceType,
      status: searchForm.status
    }
    
    // 添加日期范围条件
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
    }
    
    console.log('请求参数:', params)
    const response = await axios.get('/api/order/admin/list', { params })
    console.log('完整API响应:', response)
    
    if (response.data.success) {
      const items = response.data.data?.items || response.data.items || []
      console.log('原始数据:', items)
      
      // 确保数据格式正确
      orders.value = items.map(item => ({
        id: item.id || '',
        ownerName: item.ownerName || item.owner_name || '未知用户',
        petName: item.petName || item.pet_name || '未知宠物',
        serviceType: item.serviceType || item.service_type || '',
        serviceDate: item.serviceDate || item.service_date || '',
        price: item.price || 0,
        status: item.status || '',
        createdAt: item.createdAt || item.created_at || ''
      }))
      
      total.value = response.data.data?.total || response.data.total || 0
      console.log('处理后的订单数据:', orders.value)
      
      // 强制重新渲染表格
      nextTick(() => {
        if (orderTable.value) {
          console.log('强制刷新表格')
          orderTable.value.doLayout()
          console.log('表格数据:', orderTable.value.data)
        }
      })
    } else {
      console.error('API返回失败:', response.data)
      ElMessage.error(response.data.message || '获取订单失败')
    }
  } catch (error) {
    console.error('获取订单失败:', error)
    if (error.response) {
      console.error('错误响应:', error.response.data)
    }
    ElMessage.error('获取订单失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

// 其他方法保持不变...

onMounted(() => {
  fetchOrders()
})

const onTableMounted = () => {
  console.log('表格已挂载，行数:', orderTable.value?.data?.length)
}

const viewOrderDetail = (orderId) => {
  router.push({ name: 'order-detail', params: { id: orderId } })
}
</script>

<style scoped>
/* 自定义状态标签颜色 */
.el-tag.pending-tag {
  background-color: #FFA500; /* 橙色-待支付 */
  color: white;
  border-color: #FFA500;
}
.el-tag.paid-tag {
  background-color: #1E90FF; /* 蓝色-已支付 */
  color: white;
  border-color: #1E90FF;
}
.el-tag.in_progress-tag {
  background-color: #20B2AA; /* 青色-服务中 */
  color: white;
  border-color: #20B2AA;
}
.el-tag.completed-tag {
  background-color: #32CD32; /* 绿色-已完成 */
  color: white;
  border-color: #32CD32;
}
.el-tag.cancelled-tag {
  background-color: #FF4500; /* 红色-已取消 */
  color: white;
  border-color: #FF4500;
}
.el-tag.refunded-tag {
  background-color: #FF1493; /* 粉红-已退款 */
  color: white;
  border-color: #FF1493;
}
.el-tag.accepted-tag {
  background-color: #8A2BE2; /* 紫色-已接受 */
  color: white;
  border-color: #8A2BE2;
}
.el-tag.confirmed-tag {
  background-color: #228B22; /* 深绿-已确认 */
  color: white;
  border-color: #228B22;
}

.orders-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.page-header {
  margin-bottom: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.el-table {
  margin-top: 20px;
  height: calc(100vh - 300px);
}

.el-table :deep(.el-table__cell) {
  padding: 12px 0;
}

.el-table :deep(.el-table__header th) {
  background-color: #f8f8f9;
  font-weight: 600;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  background: white;
  padding: 15px;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}
</style>
