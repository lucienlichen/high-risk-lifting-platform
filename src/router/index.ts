import { createRouter, createWebHistory } from 'vue-router'
import MainLayout  from '@/layouts/MainLayout.vue'
import ServiceMenuView from '@/views/service/ServiceMenuView.vue'
import SceneView   from '@/views/scene/SceneView.vue'
import DeviceView  from '@/views/device/DeviceView.vue'
import LoginView   from '@/views/login/LoginView.vue'
import OverviewView from '@/views/overview/OverviewView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
    {
      path: '/',
      component: MainLayout,
      children: [
        { path: '',              redirect: '/services' },
        { path: '/overview',     name: 'overview', component: OverviewView },
        { path: '/services',     name: 'serviceMenu', component: ServiceMenuView },
        { path: '/scene/:id',    name: 'scene',  component: SceneView  },
        { path: '/device/:id',   name: 'device', component: DeviceView }
      ]
    }
  ]
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.public) {
    // logged-in users skip the login page
    if (auth.isLoggedIn && to.name === 'login') return { path: '/services' }
    return true
  }
  if (!auth.isLoggedIn) return { path: '/login' }
  return true
})

export default router
