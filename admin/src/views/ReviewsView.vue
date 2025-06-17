<!--
  ReviewsView.vue
  功能：后台管理系统的评价管理页面。
  - 展示所有用户评价内容
  - 支持内容审核、隐藏/恢复等操作
-->

<template>
  <div class="reviews-view">
    <h2>评价管理</h2>
    <el-table :data="[]">
      <el-table-column prop="id" label="评价ID" />
      <el-table-column prop="userId" label="用户ID" />
      <el-table-column prop="content" label="内容" />
      <el-table-column prop="status" label="状态" />
      <el-table-column label="操作">
        <template #default>
          <el-button size="small">审核</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
<script setup>
// 预留：后续对接接口
</script>
<style scoped>
.reviews-view { padding: 24px; }
</style>
