import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOverviewCard } from '@/mock/overviewDemo'
import { partsForDevice } from '@/mock/partsPoint'
import { overviewAccessOf, useAuthStore } from '@/stores/auth'
export function usePartsDevice() {
  const route = useRoute()
  const router = useRouter()
  const auth = useAuthStore()
  const card = computed(() => getOverviewCard(String(route.params.id || '')))
  const columns = computed(() => card.value ? partsForDevice(card.value) : [])
  const query = computed(() => Object.fromEntries(['enterprise', 'unit'].flatMap(key => typeof route.query[key] === 'string' ? [[key, route.query[key]]] : [])))
  const tone = computed(() => card.value?.lamp === 'red' ? 'alarm' : card.value?.lamp === 'yellow' ? 'warn' : card.value?.lamp === 'off' ? 'off' : 'ok')
  watch(card, current => {
    const access = overviewAccessOf(auth)
    if (!current || access.kind === 'super') return
    if (current.enterprise !== access.enterprise || (access.kind === 'factory' && current.unit !== access.unit)) {
      router.replace({ name: 'overviewPlant', query: { enterprise: access.enterprise || '', ...(access.unit ? { unit: access.unit } : {}) } })
    }
  }, { immediate: true })
  return { route, router, card, columns, query, tone }
}
