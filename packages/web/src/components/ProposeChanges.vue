<script setup lang="ts">
import { ref, watch } from 'vue'
import { useToast } from '@nuxt/ui/composables'
import { api } from '@/lib/api'

const open = ref(false)
const commitMessage = ref('')
const loading = ref(false)
const error = ref('')
const step = ref('')
const prUrl = ref('')

const toast = useToast()

watch(open, (isOpen) => {
  if (isOpen) {
    commitMessage.value = ''
    error.value = ''
    step.value = ''
    prUrl.value = ''
  }
})

async function submit() {
  if (!commitMessage.value.trim() || loading.value) return

  loading.value = true
  error.value = ''

  try {
    step.value = 'Committing changes…'
    await api('/commit', {
      method: 'POST',
      body: { message: commitMessage.value.trim() },
    })

    step.value = 'Pushing to remote…'
    await api('/push', { method: 'POST', body: {} })

    step.value = 'Creating pull request…'
    const msg = commitMessage.value.trim()
    const data = await api<{ url: string }>('/pr', {
      method: 'POST',
      body: {
        title: msg.split('\n')[0],
        body: msg,
      },
    })

    prUrl.value = data.url
    step.value = ''
    toast.add({ title: 'Pull request ready', color: 'success' })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to propose changes'
    step.value = ''
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UButton
    color="success"
    icon="i-lucide-git-pull-request"
    label="Propose Changes"
    @click="open = true"
  />

  <UModal v-model:open="open" title="Propose Changes" :dismissible="!loading">
    <template #body>
      <div v-if="prUrl" class="space-y-4 text-center py-2">
        <div class="mx-auto flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
          <UIcon name="i-lucide-check" class="size-7" />
        </div>
        <div>
          <h3 class="font-semibold text-highlighted">
            Pull Request Created
          </h3>
          <p class="text-sm text-muted mt-1">
            Your changes have been committed and pushed.
          </p>
        </div>
        <UButton
          :href="prUrl"
          target="_blank"
          icon="i-lucide-external-link"
          label="View Pull Request"
        />
        <div>
          <UButton color="neutral" variant="ghost" label="Done" @click="open = false" />
        </div>
      </div>

      <form v-else class="space-y-4" @submit.prevent="submit">
        <UFormField label="Commit message" name="message">
          <UTextarea
            v-model="commitMessage"
            :rows="4"
            autoresize
            placeholder="Describe your changes…"
            class="w-full"
            :disabled="loading"
            required
          />
        </UFormField>

        <div
          v-if="step"
          class="flex items-center gap-2 rounded-md bg-info/10 px-3 py-2 text-sm text-info"
        >
          <UIcon name="i-lucide-loader-circle" class="size-4 animate-spin" />
          {{ step }}
        </div>

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
          <UButton
            type="submit"
            label="Submit"
            :loading="loading"
            :disabled="!commitMessage.trim()"
          />
        </div>
      </form>
    </template>
  </UModal>
</template>
