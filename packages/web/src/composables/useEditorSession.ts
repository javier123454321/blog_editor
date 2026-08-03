import { computed, ref } from 'vue'
import { api } from '@/lib/api'
import { parseFrontmatter, stringifyFrontmatter } from '@/lib/frontmatter'

export interface FileInfo {
  path: string
  name: string
}

const files = ref<FileInfo[]>([])
const filesLoading = ref(false)
const filesError = ref<string | null>(null)

const currentPath = ref('')
const frontmatter = ref('')
const body = ref('')
const originalContent = ref('')
const saveState = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
const saveError = ref<string | null>(null)

/** Content of the current file on origin's base branch (normalized); null when it doesn't exist remotely */
const remoteContent = ref<string | null>(null)
const remoteChecking = ref(false)
const discarding = ref(false)

const content = computed({
  get: () => stringifyFrontmatter(frontmatter.value, body.value),
  set: (value: string) => {
    const parsed = parseFrontmatter(value)
    frontmatter.value = parsed.frontmatter
    body.value = parsed.body
  },
})

const dirty = computed(() => {
  if (!currentPath.value) return false
  return content.value !== originalContent.value
})

/** True when the current file exists on the remote base branch and its content differs */
const differsFromRemote = computed(() => {
  if (!currentPath.value || remoteContent.value === null) return false
  return content.value !== remoteContent.value
})

export function useEditorSession() {
  async function refreshFiles() {
    filesLoading.value = true
    filesError.value = null
    try {
      const data = await api<{ files: FileInfo[] }>('/files')
      files.value = data.files || []
    } catch (error) {
      filesError.value = error instanceof Error ? error.message : 'Failed to load files'
      console.error(error)
    } finally {
      filesLoading.value = false
    }
  }

  async function loadFile(path: string) {
    const data = await api<{ content: string; path: string }>(
      `/file?path=${encodeURIComponent(path)}`,
    )
    const parsed = parseFrontmatter(data.content)
    frontmatter.value = parsed.frontmatter
    body.value = parsed.body
    currentPath.value = data.path
    // Baseline on the parsed/stringified form so an unmodified file is not
    // flagged as dirty (parsing normalizes whitespace around the fence).
    originalContent.value = content.value
    saveState.value = 'idle'
    saveError.value = null
    await refreshRemoteStatus()
  }

  async function refreshRemoteStatus() {
    if (!currentPath.value) {
      remoteContent.value = null
      return
    }
    remoteChecking.value = true
    try {
      const data = await api<{ exists: boolean; content: string | null }>(
        `/file/remote?path=${encodeURIComponent(currentPath.value)}`,
      )
      if (data.exists && typeof data.content === 'string') {
        const parsed = parseFrontmatter(data.content)
        remoteContent.value = stringifyFrontmatter(parsed.frontmatter, parsed.body)
      } else {
        remoteContent.value = null
      }
    } catch (error) {
      console.error('Failed to check remote status:', error)
      remoteContent.value = null
    } finally {
      remoteChecking.value = false
    }
  }

  async function discardChanges() {
    if (!currentPath.value) return

    discarding.value = true
    try {
      await api('/file/discard', {
        method: 'POST',
        body: { path: currentPath.value },
      })
      await loadFile(currentPath.value)
      await refreshRemoteStatus()
    } finally {
      discarding.value = false
    }
  }

  async function saveFile() {
    if (!currentPath.value) return

    saveState.value = 'saving'
    saveError.value = null
    try {
      const payload = content.value
      await api(`/file?path=${encodeURIComponent(currentPath.value)}`, {
        method: 'POST',
        body: { content: payload },
      })
      originalContent.value = payload
      saveState.value = 'saved'
      setTimeout(() => {
        if (saveState.value === 'saved') saveState.value = 'idle'
      }, 2500)
    } catch (error) {
      saveState.value = 'error'
      saveError.value = error instanceof Error ? error.message : 'Failed to save'
      throw error
    }
  }

  async function createFile(path: string, initialContent: string) {
    await api(`/file?path=${encodeURIComponent(path)}`, {
      method: 'POST',
      body: { content: initialContent },
    })
    await refreshFiles()
    await loadFile(path)
  }

  function clearFile() {
    currentPath.value = ''
    frontmatter.value = ''
    body.value = ''
    originalContent.value = ''
    saveState.value = 'idle'
    saveError.value = null
    remoteContent.value = null
  }

  function setBody(value: string) {
    body.value = value
  }

  function setFrontmatter(value: string) {
    frontmatter.value = value
  }

  return {
    files,
    filesLoading,
    filesError,
    currentPath,
    frontmatter,
    body,
    content,
    dirty,
    saveState,
    saveError,
    differsFromRemote,
    remoteChecking,
    discarding,
    refreshFiles,
    loadFile,
    saveFile,
    createFile,
    clearFile,
    discardChanges,
    setBody,
    setFrontmatter,
  }
}
