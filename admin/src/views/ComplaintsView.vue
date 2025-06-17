<!--
  ComplaintsView.vue
  功能：后台管理系统的投诉管理页面。
  - 展示所有用户申诉/售后工单
  - 支持查看详情、处理工单等
-->
<template>
  <div class="complaints-view">
    <h2>投诉管理</h2>
    <el-table :data="[]">
      <el-table-column prop="id" label="工单ID" />
      <el-table-column prop="userId" label="用户ID" />
      <el-table-column prop="status" label="状态" />
      <el-table-column prop="createdAt" label="提交时间" />
      <el-table-column label="操作">
        <template #default>
          <el-button size="small">详情</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
// 预留：后续对接接口
</script>

<style scoped>
.complaints-view { padding: 24px; }
</style>


