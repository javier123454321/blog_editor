<template>
  <textarea
    ref="textarea"
    class="markdown-editor"
    :value="content"
    @input="handleInput"
  ></textarea>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';

export default defineComponent({
  name: 'MarkdownEditor',
  props: {
    modelValue: {
      type: String,
      required: true,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const localContent = ref(props.modelValue);

    watch(() => props.modelValue, (newVal) => {
      localContent.value = newVal;
    });

    const handleInput = (event: Event) => {
      const value = (event.target as HTMLTextAreaElement).value;
      localContent.value = value;
      emit('update:modelValue', value);
    };

    return {
      content: localContent,
      handleInput,
    };
  },
});
</script>

<style scoped>
.markdown-editor {
  width: 100%;
  height: 100%;
  min-height: 100%;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
  font-size: 14px;
  line-height: 1.6;
  padding: 1rem;
  border: none;
  border-radius: 0;
  resize: none;
  outline: none;
  background-color: var(--editor-bg);
  color: var(--text);
}

.markdown-editor:focus {
  background-color: var(--editor-focus-bg);
}
</style>
