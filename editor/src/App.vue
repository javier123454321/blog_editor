<template>
  <div id="app" class="app">
    <LoginView v-if="!isAuthenticated" />
    <div v-else class="editor-container">
      <h1>Blog Editor</h1>
      <p>Welcome to the Blog Editor. Start editing your blog posts.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from './composables/useAuth';
import LoginView from './views/LoginView.vue';

const { isAuthenticated } = useAuth();
</script>

<style scoped>
.app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #333;
}

.editor-container {
  text-align: center;
  padding: 2rem;
}

h1 {
  margin: 0 0 1rem 0;
  font-size: 2.5rem;
}

p {
  font-size: 1.1rem;
  color: #666;
}
</style>
