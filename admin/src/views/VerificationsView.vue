<!--
  VerificationsView.vue
  功能：后台管理系统的认证审核页面。
  - 展示所有待审核的实名认证/证书认证项
  - 支持审核通过/驳回操作
-->

<template>
  <div class="verifications-view">
    <h2>认证审核</h2>
    <el-table :data="[]">
      <el-table-column prop="userId" label="用户ID" />
      <el-table-column prop="nickname" label="昵称" />
      <el-table-column prop="type" label="类型" />
      <el-table-column prop="submittedAt" label="提交时间" />
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
.verifications-view { padding: 24px; }
</style>
