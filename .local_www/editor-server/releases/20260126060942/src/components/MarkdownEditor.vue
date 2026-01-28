<template>
  <textarea
    v-model="content"
    @input="updateContent"
    class="markdown-editor"
    placeholder="Write your markdown here..."
  />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

export default defineComponent({
  name: 'MarkdownEditor',
  props: {
    content: {
      type: String as PropType<string>,
      required: true
    },
  },
  emits: ['update'],
  setup(props, { emit }) {
    const updateContent = (event: Event) => {
      const target = event.target as HTMLTextAreaElement;
      emit('update', target.value);
    };
    return {
      updateContent
    };
  }
});
</script>

<style scoped>
.markdown-editor {
  width: 100%;
  height: 100%;
  font-family: monospace;
  font-size: 16px;
  line-height: 1.5;
  resize: none;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}
</style>
