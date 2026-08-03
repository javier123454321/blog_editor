<script setup lang="ts">
import { ref, watch } from 'vue'
import { defaultNewPost } from '@/lib/frontmatter'

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  created: [path: string, content: string]
}>()

const fileName = ref('')
const title = ref('Your Post Title')
const loading = ref(false)
const error = ref('')

watch(open, (isOpen) => {
  if (isOpen) {
    fileName.value = ''
    title.value = 'Your Post Title'
    error.value = ''
    loading.value = false
  }
})

function normalizeName(name: string): string {
  let n = name.trim()
  if (!n) return ''
  if (!n.endsWith('.md')) n = `${n}.md`
  return n.replace(/^\/+/, '')
}

async function submit() {
  error.value = ''
  const path = normalizeName(fileName.value)
  if (!path) {
    error.value = 'File name is required'
    return
  }
  if (path.includes('..')) {
    error.value = 'Invalid file name'
    return
  }

  loading.value = true
  try {
    const content = defaultNewPost(title.value.trim() || 'Your Post Title')
    emit('created', path, content)
    open.value = false
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to create file'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Create new file">
    <template #body>
      <form class="space-y-4" @submit.prevent="submit">
        <UFormField label="File name" name="filename" hint="Include path segments if needed">
          <UInput
            v-model="fileName"
            placeholder="my-new-post.md"
            autofocus
            class="w-full"
            :disabled="loading"
          />
        </UFormField>

        <UFormField label="Title" name="title">
          <UInput
            v-model="title"
            placeholder="Post title"
            class="w-full"
            :disabled="loading"
          />
        </UFormField>

        <UAlert
          v-if="error"
          color="error"
          variant="subtle"
          :title="error"
        />

        <div class="flex justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            label="Cancel"
            :disabled="loading"
            @click="open = false"
          />
          <UButton type="submit" label="Create" :loading="loading" />
        </div>
      </form>
    </template>
  </UModal>
</template>
