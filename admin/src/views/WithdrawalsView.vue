<!--
  WithdrawalsView.vue
  功能：后台管理系统的提现审核页面。
  - 展示所有待处理的提现申请
  - 支持审核通过/驳回操作
-->

<template>
  <div class="withdrawals-view">
    <h2>提现审核</h2>
    <el-table :data="[]">
      <el-table-column prop="id" label="申请ID" />
      <el-table-column prop="userId" label="用户ID" />
      <el-table-column prop="amount" label="金额" />
      <el-table-column prop="method" label="方式" />
      <el-table-column prop="status" label="状态" />
      <el-table-column prop="requestedAt" label="申请时间" />
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
.withdrawals-view { padding: 24px; }
</style>
