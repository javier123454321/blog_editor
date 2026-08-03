<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FileInfo } from '@/composables/useEditorSession'

const props = defineProps<{
  files: FileInfo[]
  loading?: boolean
  error?: string | null
  currentPath?: string
}>()

const emit = defineEmits<{
  select: [path: string]
  create: []
  refresh: []
}>()

const filter = ref('')
const collapsed = ref(new Set<string>())

function toggleGroup(prefix: string) {
  const next = new Set(collapsed.value)
  if (next.has(prefix)) {
    next.delete(prefix)
  } else {
    next.add(prefix)
  }
  collapsed.value = next
}

const filtered = computed(() => {
  const q = filter.value.trim().toLowerCase()
  if (!q) return props.files
  return props.files.filter(
    (f) => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q),
  )
})

interface FileGroup {
  prefix: string
  files: FileInfo[]
}

const groups = computed<FileGroup[]>(() => {
  const map = new Map<string, FileInfo[]>()
  for (const file of filtered.value) {
    const idx = file.path.indexOf('/')
    const prefix = idx === -1 ? '/' : `/${file.path.slice(0, idx)}`
    if (!map.has(prefix)) map.set(prefix, [])
    map.get(prefix)!.push(file)
  }
  return [...map.entries()]
    .sort((a, b) => {
      if (a[0] === '/') return -1
      if (b[0] === '/') return 1
      return a[0].localeCompare(b[0])
    })
    .map(([prefix, files]) => ({ prefix, files }))
})
</script>

<template>
  <div class="flex h-full flex-col gap-3">
    <div class="flex items-center justify-between gap-2">
      <h2 class="text-sm font-semibold text-highlighted">
        Files
      </h2>
      <div class="flex items-center gap-1">
        <UButton
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="ghost"
          size="xs"
          :loading="loading"
          aria-label="Refresh files"
          @click="emit('refresh')"
        />
        <UButton
          icon="i-lucide-plus"
          size="xs"
          label="New"
          @click="emit('create')"
        />
      </div>
    </div>

    <UInput
      v-model="filter"
      icon="i-lucide-search"
      placeholder="Filter…"
      size="sm"
    />

    <div v-if="loading && !files.length" class="text-sm text-muted py-4 text-center">
      Loading files…
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      variant="subtle"
      :title="error"
      class="text-sm"
    >
      <template #actions>
        <UButton size="xs" label="Retry" @click="emit('refresh')" />
      </template>
    </UAlert>

    <p v-else-if="filtered.length === 0" class="text-sm text-muted py-4 text-center">
      No markdown files found
    </p>

    <ul v-else class="flex-1 overflow-y-auto space-y-2 -mx-1">
      <li v-for="group in groups" :key="group.prefix">
        <div class="flex items-center gap-1 px-1 pb-1 pt-2">
          <UButton
            :icon="
              filter.trim() || !collapsed.has(group.prefix)
                ? 'i-lucide-chevron-down'
                : 'i-lucide-chevron-right'
            "
            color="neutral"
            variant="ghost"
            size="xs"
            class="size-5"
            aria-label="Toggle section"
            @click="toggleGroup(group.prefix)"
          />
          <p
            class="text-xs font-medium uppercase tracking-wide text-muted"
            role="button"
            :tabindex="0"
            @click="toggleGroup(group.prefix)"
            @keydown.enter.prevent="toggleGroup(group.prefix)"
            @keydown.space.prevent="toggleGroup(group.prefix)"
          >
            {{ group.prefix }}
          </p>
        </div>
        <ul v-if="filter.trim() || !collapsed.has(group.prefix)" class="space-y-0.5">
          <li v-for="file in group.files" :key="file.path">
            <button
              type="button"
              class="w-full text-left rounded-md px-2 py-1.5 text-sm truncate transition-colors"
              :class="
                file.path === currentPath
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-default hover:bg-elevated'
              "
              :title="file.path"
              @click="emit('select', file.path)"
            >
              <span class="inline-flex items-center gap-2 min-w-0">
                <UIcon name="i-lucide-file-text" class="size-4 shrink-0 opacity-70" />
                <span class="truncate">{{ file.name }}</span>
              </span>
            </button>
          </li>
        </ul>
      </li>
    </ul>
  </div>
</template>
