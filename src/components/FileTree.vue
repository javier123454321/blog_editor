<template>
  <ul class="file-tree">
    <li v-for="file in files" :key="file.path" @click="selectFile(file.path)">
      {{ file.name }}
    </li>
  </ul>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'FileTree',
  props: {
    files: {
      type: Array as () => { path: string; name: string }[],
      required: true,
    },
  },
  emits: ['select'],
  setup(props, { emit }) {
    const selectFile = (filePath: string) => {
      emit('select', filePath);
    };

    return {
      selectFile,
    };
  },
});
</script>

<style scoped>
.file-tree {
  list-style: none;
  padding: 0;
}

.file-tree li {
  cursor: pointer;
  padding: 5px;
  border-bottom: 1px solid #eee;
}

.file-tree li:hover {
  background-color: #f9f9f9;
}
</style>
