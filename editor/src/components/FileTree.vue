<template>
  <div class="file-tree">
    <div class="file-tree-header">
      <h2>Files</h2>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading files...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <button @click="fetchFiles" class="retry-button">Retry</button>
    </div>

    <div v-else-if="files.length === 0" class="empty-state">
      <p>No markdown files found</p>
    </div>

    <ul v-else class="file-list">
      <li v-for="file in files" :key="file.path" class="file-item">
        <button
          class="file-button"
          @click="selectFile(file.path)"
          :title="file.path"
        >
          📄 {{ file.name }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuth } from '../composables/useAuth';

interface FileInfo {
  path: string;
  name: string;
}

const files = ref<FileInfo[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const { getPassword } = useAuth();

const emit = defineEmits<{
  select: [path: string];
}>();

const fetchFiles = async () => {
  loading.value = true;
  error.value = null;

  try {
    const password = getPassword();
    if (!password) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('/api/files', {
      method: 'GET',
      headers: {
        'X-Auth-Password': password,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch files: ${response.statusText}`);
    }

    const data = await response.json();
    files.value = data.files || [];
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error fetching files:', err);
  } finally {
    loading.value = false;
  }
};

const selectFile = (path: string) => {
  emit('select', path);
};

onMounted(() => {
  fetchFiles();
});
</script>

<style scoped>
.file-tree {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.file-tree-header {
  padding: 0.75rem 0;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 0.5rem;
}

.file-tree-header h2 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #333;
}

.loading-state,
.error-state,
.empty-state {
  padding: 1rem;
  text-align: center;
  color: #666;
  font-size: 0.9rem;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0.5rem auto;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-message {
  color: #d32f2f;
  margin: 0 0 0.5rem 0;
}

.retry-button {
  padding: 0.4rem 0.8rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}

.retry-button:hover {
  background-color: #0056b3;
}

.file-list {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
  overflow-y: auto;
}

.file-item {
  margin: 0;
  padding: 0;
}

.file-button {
  width: 100%;
  padding: 0.6rem 0.5rem;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  color: #333;
  font-size: 0.9rem;
  transition: background-color 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-button:hover {
  background-color: #f0f0f0;
}

.file-button:active {
  background-color: #e8e8e8;
}
</style>
