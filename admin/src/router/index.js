import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// 布局组件
import AdminLayout from '../layouts/AdminLayout.vue'

// 路由懒加载
const LoginView = () => import('../views/LoginView.vue')
const DashboardView = () => import('../views/DashboardView.vue')
const OrdersView = () => import('../views/OrdersView.vue')
const SittersView = () => import('../views/SittersView.vue')
const UsersView = () => import('../views/UsersView.vue')
const PetsView = () => import('../views/PetsView.vue')
const SettingsView = () => import('../views/SettingsView.vue')
const NotFoundView = () => import('../views/NotFoundView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      component: AdminLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: DashboardView,
          meta: { title: '仪表盘' }
        },
        {
          path: 'orders',
          name: 'orders',
          component: OrdersView,
          meta: { title: '订单管理' }
        },
        {
          path: 'sitters',
          name: 'sitters',
          component: SittersView,
          meta: { title: '帮溜员管理' }
        },
        {
          path: 'users',
          name: 'users',
          component: UsersView,
          meta: { title: '用户管理' }
        },
        {
          path: 'pets',
          name: 'pets',
          component: PetsView,
          meta: { title: '宠物管理' }
        },
        {
          path: 'settings',
          name: 'settings',
          component: SettingsView,
          meta: { title: '系统设置' }
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView
    }
  ]
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 宠物派管理后台`
  } else {
    document.title = '宠物派管理后台'
  }

  // 权限验证
  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router 