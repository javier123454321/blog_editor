import { mount } from '@vue/test-utils';
import EditorPane from './EditorPane.vue';

describe('EditorPane.vue', () => {
  it('renders tabs and content slots properly', async () => {
    const wrapper = mount(EditorPane, {
      slots: {
        edit: '<div class="edit-content">Edit Content</div>',
        wysiwyg: '<div class="wysiwyg-content">WYSIWYG Content</div>',
        preview: '<div class="preview-content">Preview Content</div>',
      },
    });

    expect(wrapper.find('.tabs button.active').text()).toBe('Edit');
    expect(wrapper.find('.edit-content').exists()).toBe(true);

    // Test Visual tab (2nd tab)
    await wrapper.find('.tabs button:nth-child(2)').trigger('click');
    expect(wrapper.find('.tabs button.active').text()).toBe('Visual');
    expect(wrapper.find('.wysiwyg-content').exists()).toBe(true);

    // Test Preview tab (3rd tab)
    await wrapper.find('.tabs button:nth-child(3)').trigger('click');
    expect(wrapper.find('.tabs button.active').text()).toBe('Preview');
    expect(wrapper.find('.preview-content').exists()).toBe(true);
  });
});
