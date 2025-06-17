<!--
  OrderDetailView.vue
  功能：后台管理系统的订单详情页面。
  - 展示单个订单的详细信息（用户、宠物、服务、支付、报告等）
  - 支持后续扩展操作（如退款、审核等）
-->


<template>
  <div class="order-detail-view">
    <h2>订单详情</h2>
    <el-card>
      <p>这里显示订单详细信息（如订单号、用户、宠物、服务、支付、报告、轨迹等）。</p>
    </el-card>
  </div>
</template>

<script setup>
// 预留：后续可通过route参数获取订单ID并请求详情
</script>

<style scoped>
.order-detail-view { padding: 24px; }
</style>

