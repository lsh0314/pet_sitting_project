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
      <div v-loading="loading">
        <el-table :data="orders" style="width: 100%" border>
          <el-table-column prop="id" label="订单号" width="80" />
          <el-table-column prop="user.username" label="用户名" width="120" />
          <el-table-column prop="service_type" label="服务类型" width="100">
            <template #default="scope">
              {{ formatServiceType(scope.row.service_type) }}
            </template>
          </el-table-column>
          <el-table-column prop="service_date" label="服务日期" width="120" />
          <el-table-column prop="service_time" label="服务时间" width="160">
            <template #default="scope">
              {{ scope.row.start_time }} - {{ scope.row.end_time }}
            </template>
          </el-table-column>
          <el-table-column prop="address" label="服务地址" show-overflow-tooltip />
          <el-table-column prop="amount" label="金额" width="100">
            <template #default="scope">
              ¥{{ scope.row.amount.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="getOrderStatusType(scope.row.status)">
                {{ formatOrderStatus(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="180">
            <template #default="scope">
              {{ formatDate(scope.row.created_at) }}
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
              <el-button 
                size="small" 
                type="success" 
                v-if="scope.row.status === 'in_progress'"
                @click="updateOrderStatus(scope.row.id, 'completed')"
              >
                完成
              </el-button>
              <el-button 
                size="small" 
                type="danger" 
                v-if="['pending', 'paid'].includes(scope.row.status)"
                @click="cancelOrder(scope.row.id)"
              >
                取消
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
          @update:current-page="val => currentPage = val"
          @update:page-size="val => pageSize = val"
        />
        
        <!-- 空状态 -->
        <el-empty
          v-if="!loading && orders.length === 0"
          description="暂无订单数据"
        />
      </div>
    </el-card>
    
    <!-- 订单详情对话框 -->
    <el-dialog v-model="dialogVisible" title="订单详情" width="700px">
      <div v-loading="detailLoading">
        <template v-if="orderDetail">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单号">{{ orderDetail.id }}</el-descriptions-item>
            <el-descriptions-item label="订单状态">
              <el-tag :type="getOrderStatusType(orderDetail.status)">
                {{ formatOrderStatus(orderDetail.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="用户名">{{ orderDetail.user?.username }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ orderDetail.user?.phone }}</el-descriptions-item>
            <el-descriptions-item label="服务类型">{{ formatServiceType(orderDetail.service_type) }}</el-descriptions-item>
            <el-descriptions-item label="服务时间">{{ orderDetail.service_date }} {{ orderDetail.start_time }}-{{ orderDetail.end_time }}</el-descriptions-item>
            <el-descriptions-item label="服务地址" :span="2">{{ orderDetail.address }}</el-descriptions-item>
            <el-descriptions-item label="宠物信息">{{ orderDetail.pet?.name }} ({{ orderDetail.pet?.breed }})</el-descriptions-item>
            <el-descriptions-item label="帮溜员">{{ orderDetail.sitter?.username || '未分配' }}</el-descriptions-item>
            <el-descriptions-item label="订单金额">¥{{ orderDetail.amount?.toFixed(2) }}</el-descriptions-item>
            <el-descriptions-item label="支付方式">{{ formatPaymentMethod(orderDetail.payment_method) }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDate(orderDetail.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ formatDate(orderDetail.updated_at) }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ orderDetail.remark || '无' }}</el-descriptions-item>
          </el-descriptions>
          
          <!-- 操作历史 -->
          <div class="order-history">
            <h3>操作历史</h3>
            <el-timeline>
              <el-timeline-item
                v-for="(activity, index) in orderDetail.activities"
                :key="index"
                :timestamp="formatDate(activity.created_at)"
                :type="getActivityType(activity.action)"
              >
                {{ activity.description }}
              </el-timeline-item>
            </el-timeline>
          </div>
        </template>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="printOrder" :disabled="!orderDetail">
            打印订单
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

// 数据
const orders = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const dialogVisible = ref(false)
const detailLoading = ref(false)
const orderDetail = ref(null)

// 搜索表单
const searchForm = reactive({
  orderId: '',
  username: '',
  serviceType: '',
  status: '',
  dateRange: null
})

// 方法
const handleSearch = () => {
  currentPage.value = 1
  fetchOrders()
}

const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  searchForm.dateRange = null
  handleSearch()
}

const fetchOrders = async () => {
  try {
    loading.value = true
    
    // 构建查询参数
    const params = {
      page: currentPage.value,
      limit: pageSize.value
    }
    
    if (searchForm.orderId) params.orderId = searchForm.orderId
    if (searchForm.username) params.username = searchForm.username
    if (searchForm.serviceType) params.serviceType = searchForm.serviceType
    if (searchForm.status) params.status = searchForm.status
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
    }
    
    const response = await axios.get('/api/admin/orders', { params })
    
    orders.value = response.data.items
    total.value = response.data.total
  } catch (error) {
    ElMessage.error('获取订单列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleSizeChange = (val) => {
  pageSize.value = val
  fetchOrders()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchOrders()
}

const viewOrderDetail = async (orderId) => {
  try {
    dialogVisible.value = true
    detailLoading.value = true
    
    const response = await axios.get(`/api/admin/orders/${orderId}`)
    orderDetail.value = response.data
  } catch (error) {
    ElMessage.error('获取订单详情失败')
    console.error(error)
    dialogVisible.value = false
  } finally {
    detailLoading.value = false
  }
}

const updateOrderStatus = async (orderId, status) => {
  try {
    await ElMessageBox.confirm(
      `确定要将订单状态更改为"${formatOrderStatus(status)}"吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await axios.put(`/api/admin/orders/${orderId}/status`, { status })
    
    ElMessage.success('订单状态更新成功')
    fetchOrders()
    
    if (dialogVisible.value && orderDetail.value) {
      viewOrderDetail(orderId)
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('更新订单状态失败')
      console.error(error)
    }
  }
}

const cancelOrder = (orderId) => {
  updateOrderStatus(orderId, 'cancelled')
}

const exportOrders = async () => {
  try {
    ElMessage.info('正在导出订单数据，请稍候...')
    
    // 构建查询参数，与当前筛选条件相同
    const params = {}
    
    if (searchForm.orderId) params.orderId = searchForm.orderId
    if (searchForm.username) params.username = searchForm.username
    if (searchForm.serviceType) params.serviceType = searchForm.serviceType
    if (searchForm.status) params.status = searchForm.status
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
    }
    
    // 获取blob数据
    const response = await axios.get('/api/admin/orders/export', {
      params,
      responseType: 'blob'
    })
    
    // 创建下载链接
    const blob = new Blob([response.data], { type: 'application/vnd.ms-excel' })
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.download = `订单数据_${new Date().getTime()}.xlsx`
    link.click()
    window.URL.revokeObjectURL(link.href)
    
    ElMessage.success('订单导出成功')
  } catch (error) {
    ElMessage.error('订单导出失败')
    console.error(error)
  }
}

const printOrder = () => {
  ElMessage.info('打印功能开发中')
  // 实现打印逻辑
}

// 格式化函数
const formatServiceType = (type) => {
  const types = {
    walk: '遛狗',
    feed: '喂食',
    care: '寄养',
  }
  return types[type] || type
}

const formatOrderStatus = (status) => {
  const statuses = {
    pending: '待支付',
    paid: '已支付',
    in_progress: '服务中',
    completed: '已完成',
    cancelled: '已取消',
    refunded: '已退款'
  }
  return statuses[status] || status
}

const getOrderStatusType = (status) => {
  const types = {
    pending: 'warning',
    paid: '',
    in_progress: 'info',
    completed: 'success',
    cancelled: 'danger',
    refunded: 'danger'
  }
  return types[status] || ''
}

const formatPaymentMethod = (method) => {
  const methods = {
    wechat: '微信支付',
    alipay: '支付宝',
    balance: '余额支付'
  }
  return methods[method] || method
}

const formatDate = (dateString) => {
  if (!dateString) return '暂无'
  
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const getActivityType = (action) => {
  const types = {
    create: 'success',
    pay: 'primary',
    start: 'info',
    complete: 'success',
    cancel: 'danger',
    refund: 'warning'
  }
  return types[action] || ''
}

// 生命周期钩子
onMounted(() => {
  fetchOrders()
})
</script>

<style scoped lang="scss">
.orders-container {
  .order-history {
    margin-top: 20px;
    
    h3 {
      margin-bottom: 16px;
      font-size: 16px;
      font-weight: bold;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>