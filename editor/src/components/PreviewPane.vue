<template>
  <div class="preview-pane" v-html="parsedContent"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { marked } from 'marked';

const props = defineProps<{
  content: string;
}>();

const parsedContent = computed(() => {
  return marked(props.content || '');
});
</script>

<style scoped>
.preview-pane {
  padding: 1rem;
  overflow-y: auto;
  height: 100%;
}
</style>