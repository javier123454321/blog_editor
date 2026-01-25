<template>
  <div id="app" class="app">
    <LoginView v-if="!isAuthenticated" />
    <EditorLayout v-else>
      <template #sidebar>
        <FileTree :files="files" @select="loadContent" />
      </template>
      <div v-if="currentFile" class="editor-container">
        <div v-if="saveMessage" :class="['save-message', saveMessage.type]">
          {{ saveMessage.text }}
        </div>
        <EditorPane @save="saveFile">
          <template #edit>
            <MarkdownEditor :model-value="content" @update:model-value="updateContent" />
          </template>
          <template #preview>
            <PreviewPane :content="content" />
          </template>
        </EditorPane>
      </div>
      <div v-else class="editor-placeholder">
        <p>Select a file to start editing</p>
      </div>
    </EditorLayout>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuth } from './composables/useAuth';
import LoginView from './views/LoginView.vue';
import EditorLayout from './layouts/EditorLayout.vue';
import FileTree from './components/FileTree.vue';
import EditorPane from './components/EditorPane.vue';
import MarkdownEditor from './components/MarkdownEditor.vue';
import PreviewPane from './components/PreviewPane.vue';

const { isAuthenticated, password } = useAuth();
const files = ref<{ path: string; name: string }[]>([]);
const content = ref('');
const currentFile = ref('');
const saveMessage = ref<{ text: string; type: 'success' | 'error' } | null>(null);

const loadFiles = async () => {
  try {
    const res = await fetch('/api/files', {
      headers: {
        'X-Auth-Password': password.value || '',
      },
    });
    if (res.ok) {
      const data = await res.json();
      files.value = data.files;
    }
  } catch (e) {
    console.error('Failed to load files', e);
  }
};

const loadContent = async (path: string) => {
  try {
    const res = await fetch(`/api/file/${encodeURIComponent(path)}`, {
      headers: {
        'X-Auth-Password': password.value || '',
      },
    });
    if (res.ok) {
      const data = await res.json();
      content.value = data.content;
      currentFile.value = path;
    }
  } catch (e) {
    console.error('Failed to load file content', e);
  }
};

const updateContent = (newContent: string) => {
  content.value = newContent;
};

const saveFile = async () => {
  if (!currentFile.value) {
    return;
  }

  try {
    const res = await fetch(`/api/file/${encodeURIComponent(currentFile.value)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Password': password.value || '',
      },
      body: JSON.stringify({ content: content.value }),
    });

    if (res.ok) {
      saveMessage.value = { text: 'File saved successfully!', type: 'success' };
    } else {
      const data = await res.json();
      saveMessage.value = { text: data.error || 'Failed to save file', type: 'error' };
    }
  } catch (e) {
    console.error('Failed to save file', e);
    saveMessage.value = { text: 'Failed to save file', type: 'error' };
  }

  // Clear message after 3 seconds
  setTimeout(() => {
    saveMessage.value = null;
  }, 3000);
};

onMounted(() => {
  if (isAuthenticated.value) {
    loadFiles();
  }
});
</script>

<style>
/* Global styles remain same */
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

.editor-container {
  height: 100%;
  display: flex;
  flex-direction: column;
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

.save-message {
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  border-radius: 4px;
  font-weight: 500;
}

.save-message.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.save-message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
</style>
