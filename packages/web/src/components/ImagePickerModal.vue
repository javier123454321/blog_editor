<script setup lang="ts">
import { ref, watch } from 'vue'
import { useToast } from '@nuxt/ui/composables'
import { api } from '@/lib/api'
import { resolveImageUrl } from '@/lib/images'

const open = defineModel<boolean>('open', { default: false })

const props = withDefaults(
  defineProps<{
    title?: string
    accept?: string
  }>(),
  {
    title: 'Insert image',
    accept: 'image/*,.pdf',
  },
)

const emit = defineEmits<{
  select: [url: string]
}>()

function isPdf(url: string): boolean {
  return /\.pdf(?:$|\?)/i.test(url)
}

interface ImageInfo {
  url: string
  name: string
}

const previewBase = import.meta.env.VITE_BLOG_PREVIEW_URL || 'http://localhost:5178'

const images = ref<ImageInfo[]>([])
const loading = ref(false)
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const toast = useToast()

watch(open, (isOpen) => {
  if (isOpen) {
    void load()
  }
})

async function load() {
  loading.value = true
  try {
    const data = await api<{ images: ImageInfo[] }>('/images')
    images.value = data.images || []
  } catch (error) {
    toast.add({
      title: 'Failed to load images',
      description: error instanceof Error ? error.message : undefined,
      color: 'error',
    })
  } finally {
    loading.value = false
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

async function onUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  uploading.value = true
  try {
    const base64 = await fileToBase64(file)
    const { url } = await api<{ url: string }>('/upload', {
      method: 'POST',
      body: { name: file.name, base64 },
    })
    toast.add({ title: 'File uploaded', color: 'success' })
    await load()
    select(url)
  } catch (error) {
    toast.add({
      title: 'Upload failed',
      description: error instanceof Error ? error.message : undefined,
      color: 'error',
    })
  } finally {
    uploading.value = false
  }
}

function select(url: string) {
  emit('select', url)
  open.value = false
}
</script>

<template>
  <UModal v-model:open="open" :title="props.title" :ui="{ content: 'max-w-3xl' }">
    <template #body>
      <div class="space-y-4">
        <div class="flex items-center justify-between gap-2">
          <p class="text-sm text-muted">
            {{ images.length }} {{ images.length === 1 ? 'image' : 'images' }}
          </p>
          <UButton
            icon="i-lucide-upload"
            label="Upload file"
            :loading="uploading"
            @click="fileInput?.click()"
          />
        </div>

        <div v-if="loading" class="flex justify-center py-16">
          <ULoader />
        </div>
        <p v-else-if="images.length === 0" class="py-16 text-center text-muted">
          No files yet — upload one.
        </p>
        <div
          v-else
          class="grid max-h-96 grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4 md:grid-cols-5"
        >
          <button
            v-for="img in images"
            :key="img.url"
            class="group relative flex aspect-square flex-col items-center justify-center gap-1 overflow-hidden rounded-md border border-default bg-elevated"
            :title="img.name"
            @click="select(img.url)"
          >
            <img
              v-if="!isPdf(img.url)"
              :src="resolveImageUrl(img.url, previewBase)"
              :alt="img.name"
              class="h-full w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
            <UIcon v-else name="i-lucide-file-text" class="size-10 text-muted" />
            <span
              class="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 py-0.5 text-xs text-white"
            >
              {{ img.name }}
            </span>
          </button>
        </div>

        <input
          ref="fileInput"
          type="file"
          :accept="props.accept"
          class="hidden"
          @change="onUpload"
        />
      </div>
    </template>
  </UModal>
</template>
