<template>
  <div class="editor-pane">
    <div class="toolbar">
      <div class="tabs">
        <button 
          :class="{ active: activeTab === 'edit' }"
          @click="switchTab('edit')"
        >Edit</button>
        <button 
          :class="{ active: activeTab === 'wysiwyg' }"
          @click="switchTab('wysiwyg')"
        >Visual</button>
        <button 
          :class="{ active: activeTab === 'preview' }"
          @click="switchTab('preview')"
        >Preview</button>
      </div>
      <button class="save-button" @click="$emit('save')">Save</button>
    </div>
    <div v-if="activeTab === 'edit'" class="editor-content">
      <slot name="edit" />
    </div>
    <div v-if="activeTab === 'wysiwyg'" class="editor-content">
      <slot name="wysiwyg" />
    </div>
    <div v-if="activeTab === 'preview'" class="editor-content">
      <slot name="preview" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineEmits(['save']);

const activeTab = ref('edit');

function switchTab(tab: string) {
  activeTab.value = tab;
}
</script>

<style scoped>
.editor-pane {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border);
  padding: 0.5rem;
  flex-shrink: 0;
}

.tabs {
  display: flex;
}

button {
  padding: 0.5rem 1rem;
  border: none;
  cursor: pointer;
  background: none;
  color: var(--text);
}

button.active {
  font-weight: bold;
  text-decoration: underline;
}

.save-button {
  background-color: var(--primary);
  color: white;
  border-radius: 4px;
  font-weight: 500;
}

.save-button:hover {
  background-color: var(--primary-700);
}

.editor-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>
