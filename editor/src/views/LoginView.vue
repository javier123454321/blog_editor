<template>
  <div class="login-container">
    <div class="login-box">
      <h1>Blog Editor</h1>
      <p class="subtitle">Enter your password to access the editor</p>

      <form @submit.prevent="handleSubmit" class="login-form">
        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="inputPassword"
            type="password"
            placeholder="Enter your password"
            :disabled="isLoading"
            @keyup.enter="handleSubmit"
            autofocus
          />
        </div>

        <button type="submit" :disabled="isLoading" class="submit-button">
          {{ isLoading ? 'Authenticating...' : 'Login' }}
        </button>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '../composables/useAuth';

const { authenticate } = useAuth();

const inputPassword = ref('');
const isLoading = ref(false);
const errorMessage = ref('');

const handleSubmit = async () => {
  if (!inputPassword.value) {
    errorMessage.value = 'Please enter a password';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  const success = await authenticate(inputPassword.value);

  if (!success) {
    errorMessage.value = 'Invalid password. Please try again.';
    inputPassword.value = '';
  }

  isLoading.value = false;
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
}

.login-box {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
}

h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  color: #333;
  text-align: center;
}

.subtitle {
  text-align: center;
  color: #666;
  margin: 0 0 1.5rem 0;
  font-size: 0.95rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.submit-button {
  padding: 0.75rem;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 0.5rem;
}

.submit-button:hover:not(:disabled) {
  background-color: #5568d3;
}

.submit-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.error-message {
  color: #d32f2f;
  font-size: 0.9rem;
  text-align: center;
  padding: 0.5rem;
  background-color: #ffebee;
  border-radius: 4px;
  margin-top: 0.5rem;
}
</style>
