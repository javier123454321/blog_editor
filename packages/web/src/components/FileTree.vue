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

const filtered = computed(() => {
  const q = filter.value.trim().toLowerCase()
  if (!q) return props.files
  return props.files.filter(
    (f) => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q),
  )
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

    <ul v-else class="flex-1 overflow-y-auto space-y-0.5 -mx-1">
      <li v-for="file in filtered" :key="file.path">
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
  </div>
</template>
