import { createRouter, createWebHistory } from 'vue-router'
import MainLayout  from '@/layouts/MainLayout.vue'
import ServiceMenuView from '@/views/service/ServiceMenuView.vue'
import SceneView   from '@/views/scene/SceneView.vue'
import DeviceView  from '@/views/device/DeviceView.vue'
import LoginView   from '@/views/login/LoginView.vue'
import OverviewView from '@/views/overview/OverviewView.vue'
import OverviewPlantView from '@/views/overview/OverviewPlantView.vue'
import OverviewDeviceView from '@/views/overview/OverviewDeviceView.vue'
import { landingLocation, useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
    {
      path: '/',
      component: MainLayout,
      children: [
        { path: '',              redirect: () => landingLocation() },
        {
          path: '/overview',
          component: OverviewView,
          children: [
            { path: '', name: 'overviewHome', redirect: () => landingLocation() },
            { path: 'plant', name: 'overviewPlant', component: OverviewPlantView },
            { path: 'device/:id', name: 'overviewDevice', component: OverviewDeviceView }
          ]
        },
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
    if (auth.isLoggedIn && to.name === 'login') return landingLocation()
    return true
  }
  if (!auth.isLoggedIn) return { path: '/login' }
  return true
})

export default router
