<template>
  <div class="dashboard-container">
    <!-- 数据卡片区 -->
    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
        <el-card class="data-card">
          <div class="data-card-content">
            <div class="data-card-value">{{ statistics.totalUsers || 0 }}</div>
            <div class="data-card-title">注册用户</div>
          </div>
          <div class="data-card-icon user-icon">
            <el-icon><el-icon-user /></el-icon>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
        <el-card class="data-card">
          <div class="data-card-content">
            <div class="data-card-value">{{ statistics.totalOrders || 0 }}</div>
            <div class="data-card-title">总订单数</div>
          </div>
          <div class="data-card-icon order-icon">
            <el-icon><el-icon-tickets /></el-icon>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
        <el-card class="data-card">
          <div class="data-card-content">
            <div class="data-card-value">{{ statistics.totalSitters || 0 }}</div>
            <div class="data-card-title">帮溜员数量</div>
          </div>
          <div class="data-card-icon sitter-icon">
            <el-icon><el-icon-user-filled /></el-icon>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
        <el-card class="data-card">
          <div class="data-card-content">
            <div class="data-card-value">{{ formatRevenue(statistics.totalRevenue) }}</div>
            <div class="data-card-title">总收入</div>
          </div>
          <div class="data-card-icon revenue-icon">
            <el-icon><el-icon-money /></el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>订单趋势</span>
              <el-select v-model="orderChartTimeRange" size="small" @change="loadOrderChart">
                <el-option label="最近7天" value="7days" />
                <el-option label="最近30天" value="30days" />
                <el-option label="最近90天" value="90days" />
              </el-select>
            </div>
          </template>
          <div class="chart-container" v-loading="loading.orderChart">
            <!-- 订单趋势图表将在这里渲染 -->
            <div ref="orderChartRef" class="chart"></div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>服务类型分布</span>
            </div>
          </template>
          <div class="chart-container" v-loading="loading.serviceChart">
            <!-- 服务类型分布图表将在这里渲染 -->
            <div ref="serviceChartRef" class="chart"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 最新订单 -->
    <el-card class="table-card">
      <template #header>
        <div class="table-header">
          <span>最新订单</span>
          <el-button size="small" type="primary" @click="navigateToOrders">查看全部</el-button>
        </div>
      </template>
      <div v-loading="loading.recentOrders">
        <el-table :data="recentOrders" style="width: 100%" v-if="recentOrders.length > 0">
          <el-table-column prop="id" label="订单ID" width="80" />
          <el-table-column prop="user.username" label="用户" />
          <el-table-column prop="service_type" label="服务类型">
            <template #default="scope">
              {{ formatServiceType(scope.row.service_type) }}
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="金额">
            <template #default="scope">
              ¥{{ scope.row.amount.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态">
            <template #default="scope">
              <el-tag :type="getOrderStatusType(scope.row.status)">
                {{ formatOrderStatus(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间">
            <template #default="scope">
              {{ formatDate(scope.row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button size="small" @click="viewOrderDetail(scope.row.id)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="empty-data" v-else>
          <el-empty description="暂无订单数据" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import {
  User as ElIconUser,
  UserFilled as ElIconUserFilled,
  Tickets as ElIconTickets,
  Money as ElIconMoney
} from '@element-plus/icons-vue'

const router = useRouter()

// 数据
const statistics = reactive({
  totalUsers: 0,
  totalOrders: 0,
  totalSitters: 0,
  totalRevenue: 0
})

const recentOrders = ref([])
const orderChartTimeRange = ref('7days')

// 图表引用
const orderChartRef = ref(null)
const serviceChartRef = ref(null)

// 加载状态
const loading = reactive({
  statistics: false,
  recentOrders: false,
  orderChart: false,
  serviceChart: false
})

// 方法
const loadStatistics = async () => {
  try {
    loading.statistics = true
    const response = await axios.get('/api/admin/dashboard/statistics')
    Object.assign(statistics, response.data)
  } catch (error) {
    ElMessage.error('加载统计数据失败')
    console.error(error)
  } finally {
    loading.statistics = false
  }
}

const loadRecentOrders = async () => {
  try {
    loading.recentOrders = true
    const response = await axios.get('/api/admin/dashboard/recent-orders')
    recentOrders.value = response.data
  } catch (error) {
    ElMessage.error('加载最近订单失败')
    console.error(error)
  } finally {
    loading.recentOrders = false
  }
}

const loadOrderChart = async () => {
  try {
    loading.orderChart = true
    const response = await axios.get(`/api/admin/dashboard/order-trend?timeRange=${orderChartTimeRange.value}`)
    // 图表渲染逻辑 (这里需要使用图表库如 ECharts)
    // renderOrderChart(response.data)
  } catch (error) {
    ElMessage.error('加载订单趋势数据失败')
    console.error(error)
  } finally {
    loading.orderChart = false
  }
}

const loadServiceChart = async () => {
  try {
    loading.serviceChart = true
    const response = await axios.get('/api/admin/dashboard/service-distribution')
    // 图表渲染逻辑 (这里需要使用图表库如 ECharts)
    // renderServiceChart(response.data)
  } catch (error) {
    ElMessage.error('加载服务分布数据失败')
    console.error(error)
  } finally {
    loading.serviceChart = false
  }
}

// 格式化函数
const formatRevenue = (value) => {
  return `¥${(value || 0).toFixed(2)}`
}

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

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 导航
const navigateToOrders = () => {
  router.push({ name: 'orders' })
}

const viewOrderDetail = (orderId) => {
  router.push({ name: 'orders', query: { id: orderId } })
}

// 生命周期钩子
onMounted(() => {
  loadStatistics()
  loadRecentOrders()
  loadOrderChart()
  loadServiceChart()
})
</script>

<style scoped lang="scss">
.dashboard-container {
  .data-card {
    height: 120px;
    margin-bottom: 20px;
    position: relative;
    overflow: hidden;
    
    .data-card-content {
      position: relative;
      z-index: 1;
    }
    
    .data-card-value {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    
    .data-card-title {
      font-size: 16px;
      color: #606266;
    }
    
    .data-card-icon {
      position: absolute;
      right: 20px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 48px;
      opacity: 0.2;
      
      &.user-icon {
        color: #409EFF;
      }
      
      &.order-icon {
        color: #67C23A;
      }
      
      &.sitter-icon {
        color: #E6A23C;
      }
      
      &.revenue-icon {
        color: #F56C6C;
      }
    }
  }
  
  .chart-row {
    margin-bottom: 20px;
  }
  
  .chart-card {
    margin-bottom: 20px;
    
    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .chart-container {
      height: 300px;
      
      .chart {
        width: 100%;
        height: 100%;
      }
    }
  }
  
  .table-card {
    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .empty-data {
      padding: 30px 0;
    }
  }
}

@media (max-width: 768px) {
  .data-card {
    margin-bottom: 15px;
  }
}
</style>
</rewritten_file>