import { createRouter, createWebHistory } from 'vue-router'
import MainLayout  from '@/layouts/MainLayout.vue'
import SceneView   from '@/views/scene/SceneView.vue'
import DeviceView  from '@/views/device/DeviceView.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        { path: '',              redirect: '/scene/metallurgy' },
        { path: '/scene/:id',    name: 'scene',  component: SceneView  },
        { path: '/device/:id',   name: 'device', component: DeviceView }
      ]
    }
  ]
})
