<template>
  <div class="admin-layout">
    <el-container>
      <!-- 侧边栏 -->
      <el-aside width="240px">
        <div class="logo-container">
          <img src="@/assets/images/logo.png" alt="宠物派" class="logo-image">
          <h1 class="logo-text">宠物派管理后台</h1>
        </div>
        
        <el-menu
          router
          :default-active="activeMenu"
          class="sidebar-menu"
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
        >
          <el-menu-item index="/">
            <el-icon><el-icon-odometer /></el-icon>
            <span>仪表盘</span>
          </el-menu-item>
          
          <el-menu-item index="/orders">
            <el-icon><el-icon-tickets /></el-icon>
            <span>订单管理</span>
          </el-menu-item>
          
          <el-menu-item index="/sitters">
            <el-icon><el-icon-user /></el-icon>
            <span>帮溜员管理</span>
          </el-menu-item>
          
          <el-menu-item index="/users">
            <el-icon><el-icon-user-filled /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          
          <el-menu-item index="/pets">
            <el-icon><el-icon-present /></el-icon>
            <span>宠物管理</span>
          </el-menu-item>
          
          <el-menu-item index="/settings">
            <el-icon><el-icon-setting /></el-icon>
            <span>系统设置</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      
      <el-container>
        <!-- 顶部导航 -->
        <el-header>
          <div class="header-left">
            <el-icon class="menu-toggle" @click="toggleSidebar">
              <el-icon-fold v-if="!collapsed" />
              <el-icon-expand v-else />
            </el-icon>
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
              <el-breadcrumb-item v-if="$route.meta.title">{{ $route.meta.title }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          
          <div class="header-right">
            <el-dropdown @command="handleCommand">
              <span class="user-dropdown">
                {{ userName }}
                <el-icon class="el-icon--right"><el-icon-arrow-down /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                  <el-dropdown-item command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>
        
        <!-- 内容区域 -->
        <el-main>
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </el-main>
        
        <!-- 页脚 -->
        <el-footer>
          <div class="footer-content">
            <p>© {{ currentYear }} 宠物派 版权所有</p>
          </div>
        </el-footer>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  Odometer as ElIconOdometer,
  Tickets as ElIconTickets,
  User as ElIconUser,
  UserFilled as ElIconUserFilled,
  Present as ElIconPresent,
  Setting as ElIconSetting,
  Fold as ElIconFold,
  Expand as ElIconExpand,
  ArrowDown as ElIconArrowDown
} from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 状态
const collapsed = ref(false)

// 计算属性
const activeMenu = computed(() => route.path)
const userName = computed(() => authStore.user?.username || '管理员')
const currentYear = computed(() => new Date().getFullYear())

// 方法
const toggleSidebar = () => {
  collapsed.value = !collapsed.value
}

const handleCommand = (command) => {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      authStore.logout()
      router.push({ name: 'login' })
    }).catch(() => {})
  } else if (command === 'profile') {
    // 跳转到个人资料页面
  }
}

// 生命周期钩子
onMounted(() => {
  // 检查认证状态
  if (!authStore.isAuthenticated) {
    router.push({ name: 'login' })
    return
  }
  
  // 获取用户信息
  if (!authStore.user) {
    authStore.getProfile().catch(() => {
      router.push({ name: 'login' })
    })
  }
})
</script>

<style scoped lang="scss">
.admin-layout {
  height: 100vh;
  
  .el-container {
    height: 100%;
  }
  
  .el-aside {
    background-color: #304156;
    transition: width 0.3s;
    overflow-x: hidden;
    
    &.collapsed {
      width: 64px;
    }
  }
  
  .logo-container {
    height: 60px;
    display: flex;
    align-items: center;
    padding: 0 20px;
    background-color: #2b3649;
    
    .logo-image {
      width: 30px;
      height: 30px;
      margin-right: 10px;
    }
    
    .logo-text {
      color: #fff;
      font-size: 16px;
      margin: 0;
      white-space: nowrap;
    }
  }
  
  .sidebar-menu {
    border-right: none;
    
    &.el-menu--collapse {
      .el-menu-item span {
        display: none;
      }
    }
  }
  
  .el-header {
    background-color: #fff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 60px;
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
    padding: 0 20px;
    
    .header-left {
      display: flex;
      align-items: center;
      
      .menu-toggle {
        font-size: 20px;
        cursor: pointer;
        margin-right: 20px;
      }
    }
    
    .header-right {
      .user-dropdown {
        cursor: pointer;
        color: #606266;
        
        .el-icon {
          margin-left: 5px;
        }
      }
    }
  }
  
  .el-main {
    background-color: #f0f2f5;
    padding: 20px;
    overflow-y: auto;
  }
  
  .el-footer {
    background-color: #fff;
    text-align: center;
    padding: 15px 20px;
    font-size: 14px;
    color: #909399;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> 