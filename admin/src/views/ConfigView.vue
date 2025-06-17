<!--
  ConfigView.vue
  功能：后台管理系统的平台配置页面。
  - 支持设置平台参数（如佣金比例、最低提现金额等）
-->
<template>
  <div class="config-view">
    <h2>平台配置</h2>
    <el-form label-width="120px">
      <el-form-item label="佣金比例">
        <el-input v-model="commissionRate" suffix="%" style="width: 200px" />
      </el-form-item>
      <el-form-item label="最低提现金额">
        <el-input v-model="minWithdrawal" style="width: 200px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary">保存</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>
<script setup>
import { ref } from 'vue'
const commissionRate = ref(10)
const minWithdrawal = ref(50)
// 预留：后续对接接口
</script>
<style scoped>
.config-view { padding: 24px; max-width: 500px; }
</style>
