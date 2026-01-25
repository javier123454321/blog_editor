import { mount } from '@vue/test-utils';
import MarkdownEditor from '../src/components/MarkdownEditor.vue';

describe('MarkdownEditor.vue', () => {
  it('renders the content passed as a prop', () => {
    const wrapper = mount(MarkdownEditor, {
      props: { modelValue: 'Test content' },
    });
    expect(wrapper.find('textarea').element.value).toBe('Test content');
  });

  it('emits update event on input', async () => {
    const wrapper = mount(MarkdownEditor, {
      props: { modelValue: '' },
    });
    const textarea = wrapper.find('textarea');
    await textarea.setValue('New content');
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['New content']);
  });
});