/** @jsxImportSource @tiptap/core */
import { mergeAttributes, Node, wrappingInputRule } from '@tiptap/core'

import { handleBackspace } from './handleBackspace.js'

export interface BlockquoteOptions {
  /**
   * HTML attributes to add to the blockquote element
   * @default {}
   * @example { class: 'foo' }
   */
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    blockQuote: {
      /**
       * Set a blockquote node
       */
      setBlockquote: () => ReturnType
      /**
       * Toggle a blockquote node
       */
      toggleBlockquote: () => ReturnType
      /**
       * Unset a blockquote node
       */
      unsetBlockquote: () => ReturnType
    }
  }
}

/**
 * Matches a blockquote to a `>` as input.
 */
export const inputRegex = /^\s*>\s$/

/**
 * Tell if the Markdown quote put no space after `>` on its text lines, like `>a`, and on its
 * lines that start a nested quote, like `>> b`.
 */
function readSpacelessMarkers(raw: string) {
  const markerLines = raw
    .split('\n')
    .map(line => /^ {0,3}>( ?)(\S)/.exec(line))
    .filter(match => match !== null)
  const spaceless = (lines: RegExpExecArray[]) =>
    lines.length > 0 && lines.every(match => match[1] === '')

  return {
    text: spaceless(markerLines.filter(match => match[2] !== '>')),
    nested: spaceless(markerLines.filter(match => match[2] === '>')),
  }
}

/**
 * This extension allows you to create blockquotes.
 * @see https://tiptap.dev/api/nodes/blockquote
 */
export const Blockquote = Node.create<BlockquoteOptions>({
  name: 'blockquote',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  content: 'block+',

  group: 'block',

  defining: true,

  addAttributes() {
    return {
      // `>` when the Markdown file put no space after the marker before text, like `>a`
      markdownTextMarker: {
        default: null,
        parseHTML: element => element.getAttribute('data-markdown-text-marker'),
        renderHTML: attributes =>
          attributes.markdownTextMarker
            ? { 'data-markdown-text-marker': attributes.markdownTextMarker }
            : {},
      },
      // `>` when the Markdown file put no space before a nested quote, like `>> b`
      markdownNestedMarker: {
        default: null,
        parseHTML: element => element.getAttribute('data-markdown-nested-marker'),
        renderHTML: attributes =>
          attributes.markdownNestedMarker
            ? { 'data-markdown-nested-marker': attributes.markdownNestedMarker }
            : {},
      },
    }
  },

  parseHTML() {
    return [{ tag: 'blockquote' }]
  },

  renderHTML({ HTMLAttributes }) {
    return (
      <blockquote {...mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)}>
        <slot />
      </blockquote>
    )
  },

  parseMarkdown: (token, helpers) => {
    const parseBlockChildren = helpers.parseBlockChildren ?? helpers.parseChildren
    const spaceless = readSpacelessMarkers(token.raw ?? '')

    return helpers.createNode(
      'blockquote',
      {
        ...(spaceless.text ? { markdownTextMarker: '>' } : {}),
        ...(spaceless.nested ? { markdownNestedMarker: '>' } : {}),
      },
      parseBlockChildren(token.tokens || []),
    )
  },

  renderMarkdown: (node, h) => {
    if (!node.content) {
      return ''
    }

    // Use a single '>' prefix regardless of nesting level
    // Nested blockquotes will add their own '>' prefix recursively
    const prefix = '>'
    const textPrefix = node.attrs?.markdownTextMarker === '>' ? prefix : `${prefix} `
    const nestedPrefix = node.attrs?.markdownNestedMarker === '>' ? prefix : `${prefix} `

    // Join the children like the document does, so a block can stay right under the one before it
    return h
      .renderChildren(node.content, '\n\n')
      .split('\n')
      .map(line => {
        if (line.trim() === '') {
          return prefix
        }
        if (line.startsWith('>')) {
          return `${nestedPrefix}${line}`
        }
        // A line that starts with a space needs the space after `>`, which the reader drops
        return /^\S/.test(line) ? `${textPrefix}${line}` : `${prefix} ${line}`
      })
      .join('\n')
  },

  addCommands() {
    return {
      setBlockquote:
        () =>
        ({ commands }) => {
          return commands.wrapIn(this.name)
        },
      toggleBlockquote:
        () =>
        ({ commands }) => {
          return commands.toggleWrap(this.name)
        },
      unsetBlockquote:
        () =>
        ({ commands }) => {
          return commands.lift(this.name)
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-b': () => this.editor.commands.toggleBlockquote(),
      Backspace: () => handleBackspace(this.editor, this.type),
    }
  },

  addInputRules() {
    return [
      wrappingInputRule({
        find: inputRegex,
        type: this.type,
      }),
    ]
  },
})
