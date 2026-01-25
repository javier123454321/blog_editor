<template>
  <textarea
    class="markdown-editor"
    :value="content"
    @input="$emit('update', $event.target.value)"
  ></textarea>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'MarkdownEditor',
  props: {
    content: {
      type: String,
      required: true,
    },
  },
});
</script>

<style scoped>
.markdown-editor {
  width: 100%;
  height: 100%;
  font-family: monospace;
  font-size: 14px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: none;
}
</style>