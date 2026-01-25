<template>
  <div id="app" class="app">
    <LoginView v-if="!isAuthenticated" />
    <EditorLayout v-else>
      <template #sidebar>
        <p class="sidebar-placeholder">File tree will go here</p>
      </template>
      <div class="editor-placeholder">
        <p>Welcome to the Blog Editor. Start editing your blog posts.</p>
      </div>
    </EditorLayout>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from './composables/useAuth';
import LoginView from './views/LoginView.vue';
import EditorLayout from './layouts/EditorLayout.vue';

const { isAuthenticated } = useAuth();
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  width: 100%;
  height: 100%;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #333;
}
</style>

<style scoped>
.app {
  width: 100%;
  height: 100%;
}

.sidebar-placeholder {
  color: #999;
  font-size: 0.9rem;
}

.editor-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}

.editor-placeholder p {
  font-size: 1.1rem;
  color: #666;
}
</style>
