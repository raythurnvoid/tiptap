import { mergeAttributes, Node, wrappingInputRule } from '@tiptap/core'

import { bulletFromMarker } from '../helpers/bulletFromMarker.js'

const ListItemName = 'listItem'
const TextStyleName = 'textStyle'

export interface BulletListOptions {
  /**
   * The node name for the list items
   * @default 'listItem'
   * @example 'paragraph'
   */
  itemTypeName: string

  /**
   * HTML attributes to add to the bullet list element
   * @default {}
   * @example { class: 'foo' }
   */
  HTMLAttributes: Record<string, any>

  /**
   * Keep the marks when splitting the list
   * @default false
   * @example true
   */
  keepMarks: boolean

  /**
   * Keep the attributes when splitting the list
   * @default false
   * @example true
   */
  keepAttributes: boolean
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    bulletList: {
      /**
       * Toggle a bullet list
       */
      toggleBulletList: () => ReturnType
    }
  }
}

/**
 * Matches a bullet list to a dash or asterisk.
 */
export const bulletListInputRegex = /^\s*([-+*])\s$/

/**
 * This extension allows you to create bullet lists.
 * This requires the ListItem extension
 * @see https://tiptap.dev/api/nodes/bullet-list
 * @see https://tiptap.dev/api/nodes/list-item.
 */
export const BulletList = Node.create<BulletListOptions>({
  name: 'bulletList',

  addOptions() {
    return {
      itemTypeName: 'listItem',
      HTMLAttributes: {},
      keepMarks: false,
      keepAttributes: false,
    }
  },

  group: 'block list',

  content() {
    return `${this.options.itemTypeName}+`
  },

  addAttributes() {
    return {
      // Keep the `*` or `+` marker from Markdown. `null` saves as `-`.
      bullet: {
        default: null,
        parseHTML: element => bulletFromMarker(element.getAttribute('data-bullet') ?? ''),
        renderHTML: attributes => (attributes.bullet ? { 'data-bullet': attributes.bullet } : {}),
      },
      // Keep the blank lines between the items from Markdown
      loose: {
        default: false,
        parseHTML: element => element.hasAttribute('data-loose'),
        renderHTML: attributes => (attributes.loose ? { 'data-loose': '' } : {}),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'ul' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['ul', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  markdownTokenName: 'list',

  parseMarkdown: (token, helpers) => {
    if (token.type !== 'list' || (token as any).ordered) {
      return []
    }

    const bullet = bulletFromMarker(token.raw?.trimStart().charAt(0) ?? '')

    return {
      type: 'bulletList',
      ...(bullet ? { attrs: { bullet } } : {}),
      content: token.items ? helpers.parseChildren(token.items) : [],
    }
  },

  renderMarkdown: (node, h) => {
    if (!node.content) {
      return ''
    }

    return h.renderChildren(node.content, node.attrs?.loose ? '\n\n' : '\n')
  },

  markdownOptions: {
    indentsContent: true,
  },

  addCommands() {
    return {
      toggleBulletList:
        () =>
        ({ commands, chain }) => {
          if (this.options.keepAttributes) {
            return chain()
              .toggleList(this.name, this.options.itemTypeName, this.options.keepMarks)
              .updateAttributes(ListItemName, this.editor.getAttributes(TextStyleName))
              .run()
          }
          return commands.toggleList(this.name, this.options.itemTypeName, this.options.keepMarks)
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-8': () => this.editor.commands.toggleBulletList(),
    }
  },

  addInputRules() {
    let inputRule = wrappingInputRule({
      find: bulletListInputRegex,
      type: this.type,
    })

    if (this.options.keepMarks || this.options.keepAttributes) {
      inputRule = wrappingInputRule({
        find: bulletListInputRegex,
        type: this.type,
        keepMarks: this.options.keepMarks,
        keepAttributes: this.options.keepAttributes,
        getAttributes: () => {
          return this.editor.getAttributes(TextStyleName)
        },
        editor: this.editor,
      })
    }
    return [inputRule]
  },
})
