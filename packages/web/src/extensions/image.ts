import { mergeAttributes } from '@tiptap/core'
import { Image, type ImageOptions } from '@tiptap/extension-image'
import { resolveImageUrl } from '@/lib/images'

interface ImagePreviewOptions extends Partial<ImageOptions> {
  /** Origin that actually serves the blog images (e.g. the blog preview dev server). */
  baseUrl?: string
}

/**
 * Image node that renders blog-relative image paths against the blog origin so
 * they are visible inside the editor (markdown keeps the original relative path).
 */
export const ImagePreview = Image.extend<ImagePreviewOptions>({
  addOptions() {
    return {
      ...this.parent?.(),
      baseUrl: undefined,
    }
  },

  renderHTML({ node, HTMLAttributes }) {
    const src = node.attrs.src
    if (typeof src === 'string') {
      HTMLAttributes = { ...HTMLAttributes, src: resolveImageUrl(src, this.options.baseUrl) }
    }
    return ['img', mergeAttributes(this.options.HTMLAttributes ?? {}, HTMLAttributes)]
  },
})
