import { ref, computed } from 'vue';

// Reactive auth state
const password = ref<string | null>(localStorage.getItem('blog_editor_password'));

/**
 * Composable for managing authentication state
 */
export function useAuth() {
  const isAuthenticated = computed(() => password.value !== null);

  /**
   * Authenticate with the server by sending password
   */
  const authenticate = async (inputPassword: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: inputPassword }),
      });

      const data = await response.json();

      if (data.success) {
        // Store password in both state and localStorage
        password.value = inputPassword;
        localStorage.setItem('blog_editor_password', inputPassword);
        return true;
      } else {
        throw new Error(data.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  };

  /**
   * Get the stored password
   */
  const getPassword = (): string | null => {
    return password.value;
  };

  /**
   * Logout by clearing password
   */
  const logout = (): void => {
    password.value = null;
    localStorage.removeItem('blog_editor_password');
  };

  return {
    isAuthenticated,
    authenticate,
    getPassword,
    logout,
  };
}
