<template>
  <div class="order-detail-view">
    <div class="page-header">
      <h2 class="page-title">订单详情</h2>
      <div class="header-buttons">
        <el-button type="info" @click="showReportDialog" :disabled="!hasReports">
          查看报告
        </el-button>
        <el-button type="primary" @click="goBack">返回</el-button>
      </div>
    </div>

    <el-card v-loading="loading">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订单号">{{ order.orderId }}</el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :class="`${order.status}-tag`">
            {{ order.statusText }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="用户">{{ order.owner ? order.owner.nickname : '' }}</el-descriptions-item>
        <el-descriptions-item label="宠物">{{ order.pet ? order.pet.name : '' }}</el-descriptions-item>
        <el-descriptions-item label="宠物照片">
          <el-image 
            v-if="order.pet && order.pet.photo"
            :src="order.pet.photo" 
            style="width: 100px; height: 100px"
            :preview-src-list="[order.pet.photo]"
          />
        </el-descriptions-item>
        <el-descriptions-item label="服务类型">{{ order.serviceTypeText || '' }}</el-descriptions-item>
        <el-descriptions-item label="服务时间">{{ formatDate(order.serviceDate) }}</el-descriptions-item>
        <el-descriptions-item label="服务时段">{{ order.timeRange || '' }}</el-descriptions-item>
        <el-descriptions-item label="服务地址">{{ order.address || '' }}</el-descriptions-item>
        <el-descriptions-item label="订单金额">¥{{ order.payment ? order.payment.price : '0.00' }}</el-descriptions-item>
        <el-descriptions-item label="支付状态">{{ order.payment ? (order.payment.isPaid ? '已支付' : '未支付') : '未支付' }}</el-descriptions-item>
        <el-descriptions-item label="帮溜员">{{ order.sitter ? order.sitter.nickname : '' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(order.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatDate(order.updatedAt) }}</el-descriptions-item>
      </el-descriptions>

      <el-divider />
      <h3>服务备注</h3>
      <el-input
        v-model="order.remarks"
        type="textarea"
        :rows="3"
        readonly
      />
    </el-card>

    <!-- 服务报告对话框 -->
    <el-dialog
      v-model="reportDialogVisible"
      title="服务报告"
      width="80%"
      :before-close="handleReportDialogClose"
    >
      <div v-loading="reportLoading" class="report-content">
        <div v-if="reports.length === 0" class="empty-state">
          <el-empty description="暂无服务记录" />
        </div>
        <div v-else>
          <div v-for="(report, index) in reports" :key="report.id" class="report-item">
            <div class="report-header">
              <h4>服务记录 {{ index + 1 }}</h4>
              <span class="report-time">{{ formatDate(report.timestamp) }}</span>
            </div>
            <div class="report-text" v-if="report.text">
              <p>{{ report.text }}</p>
            </div>
            
            <!-- 位置信息 -->
            <div v-if="report.location" class="location-info">
              <h5>
                <i class="el-icon-location"></i>
                {{ getLocationTypeText(report.location.type) }}位置信息
              </h5>
              <div class="location-details">
                <div v-if="report.location.address" class="location-item">
                  <span class="location-label">地址：</span>
                  <span class="location-value">{{ report.location.address }}</span>
                </div>
                <div v-if="report.location.distance" class="location-item">
                  <span class="location-label">距离：</span>
                  <span class="location-value">{{ report.location.distance }}米</span>
                </div>
                <div class="location-item">
                  <span class="location-label">坐标：</span>
                  <span class="location-value">{{ report.location.latitude }}, {{ report.location.longitude }}</span>
                </div>
              </div>
            </div>
            
            <div class="report-media">
              <!-- 照片展示 -->
              <div v-if="report.imageUrls && report.imageUrls.length > 0" class="image-gallery">
                <h5>照片：</h5>
                <div class="image-grid">
                  <el-image
                    v-for="(url, imgIndex) in report.imageUrls"
                    :key="imgIndex"
                    :src="getFullImageUrl(url)"
                    :preview-src-list="report.imageUrls.map(u => getFullImageUrl(u))"
                    class="report-image"
                    fit="cover"
                  />
                </div>
              </div>
              <!-- 视频展示 -->
              <div v-if="report.videoUrl" class="video-container">
                <h5>视频：</h5>
                <video :src="getFullImageUrl(report.videoUrl)" controls class="report-video"></video>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="handleReportDialogClose">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const order = ref({})
const loading = ref(false)
const reportDialogVisible = ref(false)
const reports = ref([])
const reportLoading = ref(false)

// 计算是否有报告数据
const hasReports = computed(() => {
  return ['in_progress', 'pending_confirm', 'pending_review', 'completed'].includes(order.value.status)
})

const fetchOrderDetail = async () => {
  try {
    loading.value = true
    const response = await axios.get(`/api/order/admin/${route.params.id}`)
    if (response.data.success) {
      order.value = response.data.data
    } else {
      ElMessage.error(response.data.message || '获取订单详情失败')
    }
  } catch (error) {
    ElMessage.error('获取订单详情失败: ' + error.message)
    console.error('获取订单详情失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchReports = async () => {
  try {
    console.log('开始获取服务报告...')
    // 清空现有数据，防止重复
    reports.value = []
    
    const response = await axios.get(`/api/order/admin/${route.params.id}/reports`)
    if (response.data.success) {
      console.log('获取到的报告数据:', response.data.data)
      console.log('报告数量:', response.data.data.length)
      reports.value = response.data.data
      console.log('设置后的reports数量:', reports.value.length)
    }
  } catch (error) {
    console.error('获取服务报告失败:', error)
  }
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

const goBack = () => {
  router.go(-1)
}

const showReportDialog = async () => {
  // 防止重复点击
  if (reportLoading.value) {
    console.log('正在加载中，忽略重复点击')
    return
  }
  
  reportDialogVisible.value = true
  reportLoading.value = true
  
  try {
    await fetchReports()
  } finally {
    reportLoading.value = false
  }
}

const handleReportDialogClose = () => {
  reportDialogVisible.value = false
}

const getFullImageUrl = (url) => {
  if (!url) return ''
  return url.startsWith('http') ? url : `http://localhost:3000/api/${url}`
}

const getLocationTypeText = (type) => {
  switch (type) {
    case 'start':
      return '开始服务'
    case 'end':
      return '完成服务'
    case 'waypoint':
      return '途经'
    default:
      return '服务'
  }
}

onMounted(() => {
  fetchOrderDetail()
})
</script>

<style scoped>
.order-detail-view {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
}

.header-buttons {
  display: flex;
  gap: 10px;
}

/* 状态标签样式 */
.el-tag.pending-tag {
  background-color: #FFA500;
  color: white;
}
.el-tag.paid-tag {
  background-color: #1E90FF;
  color: white;
}
.el-tag.in_progress-tag {
  background-color: #20B2AA;
  color: white;
}
.el-tag.completed-tag {
  background-color: #32CD32;
  color: white;
}
.el-tag.cancelled-tag {
  background-color: #FF4500;
  color: white;
}
.el-tag.refunded-tag {
  background-color: #FF1493;
  color: white;
}

/* 报告对话框样式 */
.report-content {
  min-height: 400px;
}

.empty-state {
  padding: 40px;
  text-align: center;
}

/* 服务报告样式 */
.report-item {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background-color: #fafafa;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.report-header h4 {
  margin: 0;
  color: #303133;
}

.report-time {
  color: #909399;
  font-size: 14px;
}

.report-text {
  margin-bottom: 15px;
}

.report-text p {
  margin: 0;
  line-height: 1.6;
  color: #606266;
}

.report-media h5 {
  margin: 10px 0;
  color: #303133;
  font-size: 14px;
}

.image-gallery {
  margin-bottom: 20px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.report-image {
  width: 120px;
  height: 120px;
  border-radius: 6px;
  cursor: pointer;
}

.video-container {
  margin-top: 15px;
}

.report-video {
  width: 100%;
  max-width: 400px;
  height: auto;
  border-radius: 6px;
}

.location-info {
  margin-bottom: 15px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #409eff;
}

.location-info h5 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.location-info h5 i {
  margin-right: 5px;
  color: #409eff;
}

.location-details {
  margin-top: 10px;
}

.location-item {
  margin-bottom: 5px;
  display: flex;
  align-items: center;
}

.location-label {
  font-weight: bold;
  color: #606266;
  min-width: 60px;
}

.location-value {
  margin-left: 10px;
  color: #303133;
  flex: 1;
}
</style>
