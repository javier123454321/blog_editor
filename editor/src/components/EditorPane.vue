<template>
  <div>
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
    <div v-if="activeTab === 'edit'">
      <slot name="edit" />
    </div>
    <div v-if="activeTab === 'wysiwyg'">
      <slot name="wysiwyg" />
    </div>
    <div v-if="activeTab === 'preview'">
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
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  border-bottom: 1px solid #ddd;
  padding-bottom: 0.5rem;
}

.tabs {
  display: flex;
}

button {
  padding: 0.5rem 1rem;
  border: none;
  cursor: pointer;
  background: none;
}

button.active {
  font-weight: bold;
  text-decoration: underline;
}

.save-button {
  background-color: #007bff;
  color: white;
  border-radius: 4px;
  font-weight: 500;
}

.save-button:hover {
  background-color: #0056b3;
}
</style>
