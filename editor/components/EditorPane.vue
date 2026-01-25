<template>
  <div>
    <div class="tabs">
      <button 
        :class="{ active: activeTab === 'edit' }"
        @click="switchTab('edit')"
      >Edit</button>
      <button 
        :class="{ active: activeTab === 'preview' }"
        @click="switchTab('preview')"
      >Preview</button>
    </div>
    <div v-if="activeTab === 'edit'">
      <slot name="edit" />
    </div>
    <div v-if="activeTab === 'preview'">
      <slot name="preview" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const activeTab = ref('edit');

function switchTab(tab) {
  activeTab.value = tab;
}
</script>

<style scoped>
.tabs {
  display: flex;
  margin-bottom: 1rem;
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
</style>
