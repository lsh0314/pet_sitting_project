import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// 布局组件
import AdminLayout from '../layouts/AdminLayout.vue'

// 路由懒加载
const LoginView = () => import('../views/LoginView.vue').catch(() => import('../views/NotFoundView.vue'))
const DashboardView = () => import('../views/DashboardView.vue').catch(() => import('../views/NotFoundView.vue'))

const OrdersView = () => import('../views/OrdersView.vue').catch(() => import('../views/NotFoundView.vue'))
const OrderDetailView = () => import('../views/OrderDetailView.vue').catch(() => import('../views/NotFoundView.vue'))
const UsersView = () => import('../views/UsersView.vue').catch(() => import('../views/NotFoundView.vue'))
const VerificationsView = () => import('../views/VerificationsView.vue').catch(() => import('../views/NotFoundView.vue'))
const WithdrawalsView = () => import('../views/WithdrawalsView.vue').catch(() => import('../views/NotFoundView.vue'))
const ComplaintsView = () => import('../views/ComplaintsView.vue').catch(() => import('../views/NotFoundView.vue'))
const ComplaintDetailView = () => import('../views/ComplaintDetailView.vue').catch(() => import('../views/NotFoundView.vue'))
const ReviewsView = () => import('../views/ReviewsView.vue').catch(() => import('../views/NotFoundView.vue'))
const ConfigView = () => import('../views/ConfigView.vue').catch(() => import('../views/NotFoundView.vue'))
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
      children: [        {
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
          path: 'orders/:id',
          name: 'order-detail',
          component: OrderDetailView,
          meta: { title: '订单详情' }
        },
        {
          path: 'users',
          name: 'users',
          component: UsersView,
          meta: { title: '用户管理' }
        },
        {
          path: 'verifications',
          name: 'verifications',
          component: VerificationsView,
          meta: { title: '认证审核' }
        },
        {
          path: 'withdrawals',
          name: 'withdrawals',
          component: WithdrawalsView,
          meta: { title: '提现审核' }
        },
        {
          path: 'complaints',
          name: 'complaints',
          component: ComplaintsView,
          meta: { title: '投诉管理' }
        },
        {
          path: 'complaints/:id',
          name: 'complaint-detail',
          component: ComplaintDetailView,
          meta: { title: '投诉详情' }
        },
        {
          path: 'reviews',
          name: 'reviews',
          component: ReviewsView,
          meta: { title: '评价管理' }
        },
        {
          path: 'config',
          name: 'config',
          component: ConfigView,
          meta: { title: '平台配置' }
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
