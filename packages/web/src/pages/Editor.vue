<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useColorMode } from '@vueuse/core'
import { useToast } from '@nuxt/ui/composables'
import { useAuth } from '@/composables/useAuth'
import { useEditorSession } from '@/composables/useEditorSession'
import FileTree from '@/components/FileTree.vue'
import BranchSelector from '@/components/BranchSelector.vue'
import ProposeChanges from '@/components/ProposeChanges.vue'
import NewFileModal from '@/components/NewFileModal.vue'
import MarkdownVisualEditor from '@/components/MarkdownVisualEditor.vue'

const router = useRouter()
const { logout } = useAuth()
const toast = useToast()
const colorMode = useColorMode()

const {
  files,
  filesLoading,
  filesError,
  currentPath,
  frontmatter,
  body,
  dirty,
  saveState,
  refreshFiles,
  loadFile,
  saveFile,
  createFile,
  clearFile,
} = useEditorSession()

const sidebarOpen = ref(false)
const newFileOpen = ref(false)
const showFrontmatter = ref(true)
const mode = ref<'visual' | 'raw'>('visual')

async function openFile(path: string) {
  try {
    await loadFile(path)
    sidebarOpen.value = false
  } catch (error) {
    toast.add({
      title: 'Failed to open file',
      description: error instanceof Error ? error.message : undefined,
      color: 'error',
    })
  }
}

async function onSave() {
  try {
    await saveFile()
    toast.add({ title: 'File saved', color: 'success' })
  } catch (error) {
    toast.add({
      title: 'Save failed',
      description: error instanceof Error ? error.message : undefined,
      color: 'error',
    })
  }
}

async function onCreate(path: string, content: string) {
  try {
    await createFile(path, content)
    toast.add({ title: `Created ${path}`, color: 'success' })
  } catch (error) {
    toast.add({
      title: 'Create failed',
      description: error instanceof Error ? error.message : undefined,
      color: 'error',
    })
  }
}

function onBranchChanged() {
  clearFile()
  void refreshFiles()
}

function onLogout() {
  logout()
  void router.push({ name: 'login' })
}

function onKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault()
    if (currentPath.value) void onSave()
  }
}

onMounted(() => {
  void refreshFiles()
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="flex h-screen flex-col bg-default text-default">
    <header class="flex h-14 shrink-0 items-center gap-3 border-b border-default px-3 sm:px-4">
      <UButton
        class="lg:hidden"
        icon="i-lucide-menu"
        color="neutral"
        variant="ghost"
        aria-label="Toggle sidebar"
        @click="sidebarOpen = !sidebarOpen"
      />

      <h1 class="text-base font-semibold text-highlighted shrink-0">
        Blog Editor
      </h1>

      <div class="hidden sm:block text-muted">
        <UIcon name="i-lucide-chevron-right" class="size-4" />
      </div>

      <p
        v-if="currentPath"
        class="hidden sm:block min-w-0 truncate text-sm text-muted"
        :title="currentPath"
      >
        {{ currentPath }}
        <UBadge v-if="dirty" color="warning" variant="subtle" size="sm" class="ml-2">
          Unsaved
        </UBadge>
      </p>

      <div class="ml-auto flex items-center gap-2">
        <BranchSelector @branch-changed="onBranchChanged" />
        <ProposeChanges />
        <UButton
          :icon="colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'"
          color="neutral"
          variant="ghost"
          aria-label="Toggle theme"
          @click="colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'"
        />
        <UButton
          icon="i-lucide-log-out"
          color="neutral"
          variant="ghost"
          aria-label="Log out"
          @click="onLogout"
        />
      </div>
    </header>

    <div class="flex min-h-0 flex-1">
      <aside class="hidden w-72 shrink-0 border-r border-default lg:flex lg:flex-col p-3">
        <FileTree
          :files="files"
          :loading="filesLoading"
          :error="filesError"
          :current-path="currentPath"
          @select="openFile"
          @create="newFileOpen = true"
          @refresh="refreshFiles"
        />
      </aside>

      <USlideover v-model:open="sidebarOpen" title="Files">
        <template #body>
          <FileTree
            :files="files"
            :loading="filesLoading"
            :error="filesError"
            :current-path="currentPath"
            @select="openFile"
            @create="newFileOpen = true"
            @refresh="refreshFiles"
          />
        </template>
      </USlideover>

      <main class="flex min-w-0 flex-1 flex-col min-h-0">
        <template v-if="currentPath">
          <div class="flex flex-wrap items-center gap-2 border-b border-default px-3 py-2">
            <div class="inline-flex items-center gap-1">
              <UButton
                size="sm"
                label="Visual"
                :color="mode === 'visual' ? 'primary' : 'neutral'"
                :variant="mode === 'visual' ? 'solid' : 'outline'"
                @click="mode = 'visual'"
              />
              <UButton
                size="sm"
                label="Raw"
                :color="mode === 'raw' ? 'primary' : 'neutral'"
                :variant="mode === 'raw' ? 'solid' : 'outline'"
                @click="mode = 'raw'"
              />
            </div>

            <UButton
              size="sm"
              color="neutral"
              variant="ghost"
              :icon="showFrontmatter ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
              :label="showFrontmatter ? 'Hide frontmatter' : 'Show frontmatter'"
              @click="showFrontmatter = !showFrontmatter"
            />

            <div class="ml-auto flex items-center gap-2">
              <span v-if="saveState === 'saved'" class="text-xs text-success">Saved</span>
              <UButton
                size="sm"
                icon="i-lucide-save"
                label="Save"
                :loading="saveState === 'saving'"
                :disabled="!dirty && saveState !== 'error'"
                @click="onSave"
              />
            </div>
          </div>

          <div v-if="showFrontmatter" class="border-b border-default px-3 py-2 space-y-1">
            <label class="text-xs font-medium text-muted">YAML frontmatter</label>
            <UTextarea
              v-model="frontmatter"
              :rows="Math.min(8, Math.max(3, frontmatter.split('\n').length))"
              autoresize
              class="w-full font-mono text-sm"
              placeholder='title: "…"'
            />
          </div>

          <div class="min-h-0 flex-1 p-3">
            <MarkdownVisualEditor v-if="mode === 'visual'" v-model="body" class="h-full" />
            <UTextarea
              v-else
              v-model="body"
              class="h-full w-full font-mono text-sm"
              :ui="{ base: 'h-full' }"
              placeholder="Markdown body…"
            />
          </div>
        </template>

        <div
          v-else
          class="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center"
        >
          <UIcon name="i-lucide-file-pen-line" class="size-12 text-muted" />
          <p class="text-muted">
            Select a file to start editing
          </p>
          <UButton label="Create new file" icon="i-lucide-plus" @click="newFileOpen = true" />
        </div>
      </main>
    </div>

    <NewFileModal v-model:open="newFileOpen" @created="onCreate" />
  </div>
</template>
