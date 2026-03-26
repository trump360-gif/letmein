import { Node, mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

export interface ImageUploadOptions {
  onUpload: (file: File) => Promise<{ url: string; id: string }>
  allowedTypes: string[]
  maxSize: number
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageUpload: {
      uploadImage: (file: File) => ReturnType
    }
  }
}

export const ImageUpload = Node.create<ImageUploadOptions>({
  name: 'imageUpload',

  addOptions() {
    return {
      onUpload: async () => ({ url: '', id: '' }),
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      maxSize: 20 * 1024 * 1024,
    }
  },

  addProseMirrorPlugins() {
    const { onUpload, allowedTypes, maxSize } = this.options

    return [
      new Plugin({
        key: new PluginKey('imageUpload'),
        props: {
          handleDrop: (view, event) => {
            const files = event.dataTransfer?.files
            if (!files || files.length === 0) return false

            const imageFiles = Array.from(files).filter(
              (file) => allowedTypes.includes(file.type) && file.size <= maxSize,
            )

            if (imageFiles.length === 0) return false

            event.preventDefault()

            const coordinates = view.posAtCoords({
              left: event.clientX,
              top: event.clientY,
            })

            imageFiles.forEach(async (file) => {
              try {
                const result = await onUpload(file)
                const node = view.state.schema.nodes.image?.create({
                  src: result.url,
                  'data-media-id': result.id,
                })
                if (node && coordinates) {
                  const transaction = view.state.tr.insert(coordinates.pos, node)
                  view.dispatch(transaction)
                }
              } catch (err) {
                console.error('Image upload failed:', err)
              }
            })

            return true
          },
          handlePaste: (view, event) => {
            const files = event.clipboardData?.files
            if (!files || files.length === 0) return false

            const imageFiles = Array.from(files).filter(
              (file) => allowedTypes.includes(file.type) && file.size <= maxSize,
            )

            if (imageFiles.length === 0) return false

            event.preventDefault()

            imageFiles.forEach(async (file) => {
              try {
                const result = await onUpload(file)
                const node = view.state.schema.nodes.image?.create({
                  src: result.url,
                  'data-media-id': result.id,
                })
                if (node) {
                  const transaction = view.state.tr.replaceSelectionWith(node)
                  view.dispatch(transaction)
                }
              } catch (err) {
                console.error('Image upload failed:', err)
              }
            })

            return true
          },
        },
      }),
    ]
  },
})
