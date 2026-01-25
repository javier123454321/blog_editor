import { mount } from '@vue/test-utils';
import EditorPane from './EditorPane.vue';
import FileTree from '../../src/components/FileTree.vue';
globalThis.fetch = vi.fn();

describe('EditorPane.vue', () => {
  beforeEach(() => {
    (globalThis.fetch as jest.Mock).mockClear();
  });

  it('fetches file list on mount', async () => {
    (globalThis.fetch as jest.Mock).mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        files: [{ path: 'file1.md', name: 'File 1' }],
      }),
    }));

    const wrapper = mount(EditorPane);

    await new Promise(setImmediate);

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/files');
    expect(wrapper.findComponent(FileTree).props('files')).toEqual([{ path: 'file1.md', name: 'File 1' }]);
  });

  it('fetches file content on selection', async () => {
    (globalThis.fetch as jest.Mock).mockImplementationOnce(
      JSON.stringify({ files: [ { path: 'file1.md', name: 'File 1' } ] }),
      JSON.stringify({ content: 'Hello World' })
    );

    const wrapper = mount(EditorPane);
    await new Promise(setImmediate);

    const fileTree = wrapper.findComponent({name: 'FileTree'});
    fileTree.vm.$emit('select', 'file1.md');
    await new Promise(setImmediate);

    expect(fetchMock).toHaveBeenCalledWith('/api/file/file1.md');
    expect(wrapper.find('.markdown-editor').text()).toContain('Hello World');
  });
  it('renders tabs and content slots properly', async () => {
    const wrapper = mount(EditorPane, {
      slots: {
        edit: '<div class="edit-content">Edit Content</div>',
        preview: '<div class="preview-content">Preview Content</div>',
      },
    });

    expect(wrapper.find('.tabs button.active').text()).toBe('Edit');
    expect(wrapper.find('.edit-content').exists()).toBe(true);

    await wrapper.find('.tabs button:nth-child(2)').trigger('click');

    expect(wrapper.find('.tabs button.active').text()).toBe('Preview');
    expect(wrapper.find('.preview-content').exists()).toBe(true);
  });
});