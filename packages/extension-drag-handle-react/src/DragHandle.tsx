import {
  type DragHandlePluginProps,
  defaultComputePositionConfig,
  DragHandlePlugin,
  dragHandlePluginDefaultKey,
} from '@tiptap/extension-drag-handle'
import type { Node } from '@tiptap/pm/model'
import type { Plugin } from '@tiptap/pm/state'
import type { Editor } from '@tiptap/react'
import { type ReactNode, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>

export type DragHandleProps = Omit<Optional<DragHandlePluginProps, 'pluginKey'>, 'element'> & {
  className?: string
  onNodeChange?: (data: { node: Node | null; editor: Editor; pos: number }) => void
  children: ReactNode
}

export const DragHandle = (props: DragHandleProps) => {
  const {
    className = 'drag-handle',
    children,
    editor,
    pluginKey = dragHandlePluginDefaultKey,
    onNodeChange,
    onElementDragStart,
    onElementDragEnd,
    computePositionConfig = defaultComputePositionConfig,
  } = props
  // The plugin moves this element into a wrapper of its own inside the editor DOM. If React
  // rendered the element, React would still expect it under the parent node it rendered it in.
  // Removing this component then fails with "removeChild: the node to be removed is not a child
  // of this node" and the whole editor crashes. So the element is created here, outside the React
  // tree, and only its children are rendered into it. BubbleMenu does the same.
  const elementRef = useRef<HTMLDivElement | null>(null)
  if (!elementRef.current) {
    elementRef.current = document.createElement('div')
    elementRef.current.style.visibility = 'hidden'
    elementRef.current.style.position = 'absolute'
  }
  const element = elementRef.current

  const plugin = useRef<Plugin | null>(null)

  useEffect(() => {
    element.className = className
  }, [className, element])

  useEffect(() => {
    let initPlugin: {
      plugin: Plugin
      unbind: () => void
    } | null = null

    if (editor.isDestroyed) {
      return () => {
        plugin.current = null
      }
    }

    if (!plugin.current) {
      initPlugin = DragHandlePlugin({
        editor,
        element,
        pluginKey,
        computePositionConfig: {
          ...defaultComputePositionConfig,
          ...computePositionConfig,
        },
        onElementDragStart,
        onElementDragEnd,
        onNodeChange,
      })
      plugin.current = initPlugin.plugin

      editor.registerPlugin(plugin.current)
    }

    return () => {
      editor.unregisterPlugin(pluginKey)
      plugin.current = null
      if (initPlugin) {
        initPlugin.unbind()
        initPlugin = null
      }
    }
  }, [element, editor, onNodeChange, pluginKey, computePositionConfig, onElementDragStart, onElementDragEnd])

  return createPortal(children, element)
}
