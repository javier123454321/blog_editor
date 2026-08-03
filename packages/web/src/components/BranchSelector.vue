<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useToast } from '@nuxt/ui/composables'
import { api } from '@/lib/api'

interface Branch {
  name: string
  current: boolean
}

const emit = defineEmits<{
  branchChanged: []
}>()

const toast = useToast()
const branches = ref<Branch[]>([])
const loading = ref(true)
const switching = ref(false)
const createOpen = ref(false)
const newBranchName = ref('')
const creating = ref(false)

const currentBranch = computed(
  () => branches.value.find((b) => b.current)?.name ?? 'No branch',
)

const items = computed(() => {
  const branchItems = branches.value.map((b) => ({
    label: b.name,
    icon: b.current ? 'i-lucide-check' : 'i-lucide-git-branch',
    disabled: b.current || switching.value,
    onSelect: () => selectBranch(b.name),
  }))

  return [
    branchItems,
    [
      {
        label: 'Create new branch…',
        icon: 'i-lucide-plus',
        onSelect: () => {
          createOpen.value = true
        },
      },
    ],
  ]
})

async function fetchBranches() {
  loading.value = true
  try {
    const data = await api<{ branches: Branch[] }>('/branches')
    branches.value = data.branches || []
  } catch (error) {
    toast.add({
      title: 'Failed to load branches',
      description: error instanceof Error ? error.message : undefined,
      color: 'error',
    })
  } finally {
    loading.value = false
  }
}

async function selectBranch(name: string) {
  switching.value = true
  try {
    await api('/checkout', { method: 'POST', body: { branch: name } })
    await fetchBranches()
    emit('branchChanged')
    toast.add({ title: `Switched to ${name}`, color: 'success' })
  } catch (error) {
    toast.add({
      title: 'Checkout failed',
      description: error instanceof Error ? error.message : undefined,
      color: 'error',
    })
  } finally {
    switching.value = false
  }
}

async function createBranch() {
  const name = newBranchName.value.trim()
  if (!name) return

  creating.value = true
  try {
    await api('/branch/create', { method: 'POST', body: { name } })
    createOpen.value = false
    newBranchName.value = ''
    await fetchBranches()
    emit('branchChanged')
    toast.add({ title: `Created branch ${name}`, color: 'success' })
  } catch (error) {
    toast.add({
      title: 'Could not create branch',
      description: error instanceof Error ? error.message : undefined,
      color: 'error',
    })
  } finally {
    creating.value = false
  }
}

onMounted(fetchBranches)
</script>

<template>
  <div class="flex items-center gap-2">
    <UDropdownMenu :items="items">
      <UButton
        color="neutral"
        variant="outline"
        :loading="loading || switching"
        icon="i-lucide-git-branch"
        :label="currentBranch"
        trailing-icon="i-lucide-chevron-down"
      />
    </UDropdownMenu>

    <UModal v-model:open="createOpen" title="Create branch">
      <template #body>
        <form class="space-y-4" @submit.prevent="createBranch">
          <UFormField label="Branch name" name="branch">
            <UInput
              v-model="newBranchName"
              placeholder="feature/my-post"
              autofocus
              class="w-full"
              :disabled="creating"
            />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              label="Cancel"
              :disabled="creating"
              @click="createOpen = false"
            />
            <UButton
              type="submit"
              label="Create"
              :loading="creating"
              :disabled="!newBranchName.trim()"
            />
          </div>
        </form>
      </template>
    </UModal>
  </div>
</template>
