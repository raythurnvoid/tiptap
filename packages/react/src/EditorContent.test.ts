import React from 'react'
import { render } from '@testing-library/react'
import { Editor } from '@tiptap/core'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import { describe, expect, it, vi } from 'vite-plus/test'

import { createContentComponent, EditorContent } from './EditorContent.js'
import type { ReactRenderer } from './ReactRenderer.js'

const createRenderer = (id: string) =>
  ({
    reactElement: React.createElement('span', null, id),
    element: document.createElement('div'),
  }) as ReactRenderer

describe('EditorContent', () => {
  it('keeps node views until remount instead of redrawing them on unmount', () => {
    const destroy = vi.fn()
    const createNodeView = vi.fn(() => {
      const dom = document.createElement('p')
      return { dom, contentDOM: dom, destroy }
    })
    const editor = new Editor({
      injectCSS: false,
      extensions: [Document, Paragraph.extend({ addNodeView: () => createNodeView }), Text],
      content: '<p>Kept content</p>',
    })
    const first = render(React.createElement(EditorContent, { editor }))
    createNodeView.mockClear()
    destroy.mockClear()

    first.unmount()
    expect(destroy).not.toHaveBeenCalled()
    expect(createNodeView).not.toHaveBeenCalled()

    const second = render(React.createElement(EditorContent, { editor }))
    expect(second.container.textContent).toBe('Kept content')
    second.unmount()
    editor.destroy()
    expect(destroy).toHaveBeenCalled()
  })
})

describe('createContentComponent', () => {
  it('batches synchronous renderer change notifications', async () => {
    const contentComponent = createContentComponent()
    const subscriber = vi.fn()

    contentComponent.subscribe(subscriber)

    contentComponent.setRenderer('first', createRenderer('first'))
    contentComponent.setRenderer('second', createRenderer('second'))

    expect(Object.keys(contentComponent.getSnapshot())).toEqual(['first', 'second'])
    expect(subscriber).not.toHaveBeenCalled()

    await Promise.resolve()

    expect(subscriber).toHaveBeenCalledTimes(1)

    contentComponent.removeRenderer('first')
    contentComponent.removeRenderer('second')

    expect(Object.keys(contentComponent.getSnapshot())).toEqual([])

    await Promise.resolve()

    expect(subscriber).toHaveBeenCalledTimes(2)
  })
})
