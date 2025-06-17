<!--
  UsersView.vue
  功能：后台管理系统的用户管理页面。
  - 展示所有用户列表
  - 支持用户筛选、封禁/解封、查看详情等
-->

<template>
  <div class="users-view">
    <h2>用户管理</h2>
    <el-table :data="[]">
      <el-table-column prop="id" label="用户ID" />
      <el-table-column prop="nickname" label="昵称" />
      <el-table-column prop="role" label="角色" />
      <el-table-column prop="createdAt" label="注册时间" />
      <el-table-column prop="status" label="状态" />
      <el-table-column label="操作">
        <template #default>
          <el-button size="small">封禁/解封</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
<script setup>
// 预留：后续对接接口
</script>
<style scoped>
.users-view { padding: 24px; }
</style>
