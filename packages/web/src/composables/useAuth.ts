import { computed, ref } from 'vue'
import { api, getStoredPassword, setStoredPassword } from '@/lib/api'

const password = ref<string | null>(getStoredPassword())

export function useAuth() {
  const isAuthenticated = computed(() => password.value !== null)

  async function authenticate(inputPassword: string): Promise<boolean> {
    try {
      await api<{ success: boolean }>('/auth', {
        method: 'POST',
        body: { password: inputPassword },
        password: null, // auth endpoint is public
      })
      password.value = inputPassword
      setStoredPassword(inputPassword)
      return true
    } catch (error) {
      console.error('Authentication error:', error)
      return false
    }
  }

  function logout(): void {
    password.value = null
    setStoredPassword(null)
  }

  function getPassword(): string | null {
    return password.value
  }

  return {
    isAuthenticated,
    password,
    authenticate,
    logout,
    getPassword,
  }
}
