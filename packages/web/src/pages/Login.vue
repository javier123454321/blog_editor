<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const { authenticate } = useAuth()
const router = useRouter()
const route = useRoute()

const password = ref('')
const loading = ref(false)
const error = ref('')

async function onSubmit() {
  if (!password.value) {
    error.value = 'Please enter a password'
    return
  }

  loading.value = true
  error.value = ''

  const ok = await authenticate(password.value)
  loading.value = false

  if (!ok) {
    error.value = 'Invalid password. Please try again.'
    password.value = ''
    return
  }

  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
  await router.replace(redirect)
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-default">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="space-y-1">
          <h1 class="text-xl font-semibold text-highlighted">
            Blog Editor
          </h1>
          <p class="text-sm text-muted">
            Enter your password to access the editor
          </p>
        </div>
      </template>

      <form class="space-y-4" @submit.prevent="onSubmit">
        <UFormField label="Password" name="password">
          <UInput
            v-model="password"
            type="password"
            placeholder="Password"
            autofocus
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

        <UButton
          type="submit"
          block
          :loading="loading"
          label="Login"
        />
      </form>
    </UCard>
  </div>
</template>
