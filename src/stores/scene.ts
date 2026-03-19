import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { SceneId } from '@/mock'

export const useSceneStore = defineStore('scene', () => {
  const currentScene    = ref<SceneId>('metallurgy')
  const currentDeviceId = ref<string | null>(null)
  const activeService   = ref<string | null>(null)

  function setScene(id: SceneId)           { currentScene.value = id }
  function setDevice(id: string | null)    { currentDeviceId.value = id; activeService.value = null }
  function setService(name: string | null) { activeService.value = name }

  return { currentScene, currentDeviceId, activeService, setScene, setDevice, setService }
})
