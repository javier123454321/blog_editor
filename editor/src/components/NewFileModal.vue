<template>
  <div v-if="isOpen" class="modal-overlay" @click="close">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Create New File</h3>
        <button class="close-button" @click="close" aria-label="Close modal">×</button>
      </div>
      <form @submit.prevent="createFile" class="modal-form">
        <div class="form-group">
          <label for="filename">File Name</label>
          <input
            id="filename"
            ref="fileNameInput"
            v-model="fileName"
            type="text"
            placeholder="my-new-post.md"
            :disabled="isLoading"
            class="file-input"
          />
          <p class="hint">Include .md extension in the filename</p>
        </div>
        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
        <div class="modal-actions">
          <button type="button" @click="close" class="cancel-button" :disabled="isLoading">
            Cancel
          </button>
          <button type="submit" class="create-button" :disabled="isLoading">
            {{ isLoading ? 'Creating...' : 'Create' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { useAuth } from '../composables/useAuth';

interface Props {
  isOpen: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  created: [path: string];
}>();

const { getPassword } = useAuth();
const fileName = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const fileNameInput = ref<HTMLInputElement | null>(null);

const DEFAULT_FRONTMATTER = `---
title: "Your Post Title"
date: ${new Date().toISOString().split('T')[0]}
tags:
  - tag1
  - tag2
---

# Your Post Title

Start writing your blog post here...
`;

watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    // Reset form state when modal opens
    fileName.value = '';
    errorMessage.value = '';
    
    // Focus input field
    await nextTick();
    fileNameInput.value?.focus();
  }
});

const close = () => {
  if (!isLoading.value) {
    emit('close');
  }
};

const createFile = async () => {
  // Validate input
  const trimmedName = fileName.value.trim();
  if (!trimmedName) {
    errorMessage.value = 'File name is required';
    return;
  }

  if (!trimmedName.endsWith('.md')) {
    errorMessage.value = 'File name must end with .md';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  try {
    const password = getPassword();
    if (!password) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`/api/file/${encodeURIComponent(trimmedName)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Password': password,
      },
      body: JSON.stringify({ content: DEFAULT_FRONTMATTER }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to create file');
    }

    // Emit success
    emit('created', trimmedName);
    emit('close');
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to create file';
    console.error('Error creating file:', err);
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.75rem;
  color: #666;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.close-button:hover {
  background-color: #f0f0f0;
}

.modal-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
}

.file-input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.95rem;
  transition: border-color 0.2s ease;
}

.file-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.file-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.hint {
  margin-top: 0.4rem;
  font-size: 0.85rem;
  color: #666;
}

.error-message {
  padding: 0.75rem;
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.cancel-button,
.create-button {
  padding: 0.6rem 1.25rem;
  border: none;
  border-radius: 4px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.cancel-button {
  background-color: #f0f0f0;
  color: #333;
}

.cancel-button:hover:not(:disabled) {
  background-color: #e0e0e0;
}

.create-button {
  background-color: #007bff;
  color: white;
}

.create-button:hover:not(:disabled) {
  background-color: #0056b3;
}

.cancel-button:disabled,
.create-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
