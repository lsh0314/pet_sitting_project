<template>
  <div class="order-detail-view">
    <div class="page-header">
      <h2 class="page-title">订单详情</h2>
      <el-button type="primary" @click="goBack">返回</el-button>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const order = ref({})
const loading = ref(false)

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
</style>
