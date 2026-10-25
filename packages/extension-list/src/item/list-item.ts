import type { JSONContent, MarkdownParseHelpers, MarkdownToken } from '@tiptap/core'
import { mergeAttributes, Node, renderNestedMarkdownContent } from '@tiptap/core'

import { createBranchingListDeleteKeymap } from '../helpers/createBranchingListDeleteKeymap.js'
import { nestedIndentFromRaw } from '../helpers/nestedIndentFromRaw.js'

import { getListMarker } from '../ordered-list/roman.js'

export interface ListItemOptions {
  /**
   * The HTML attributes for a list item node.
   * @default {}
   * @example { class: 'foo' }
   */
  HTMLAttributes: Record<string, any>

  /**
   * The node type for bulletList nodes
   * @default 'bulletList'
   * @example 'myCustomBulletList'
   */
  bulletListTypeName: string

  /**
   * The node type for orderedList nodes
   * @default 'orderedList'
   * @example 'myCustomOrderedList'
   */
  orderedListTypeName: string
}

function isSameLineOrderedListToken(token: MarkdownToken): boolean {
  const nestedToken = token.tokens?.[0]

  return Boolean(
    token.text &&
    token.tokens?.length === 1 &&
    nestedToken?.type === 'list' &&
    nestedToken.ordered &&
    nestedToken.raw === token.text,
  )
}

function parseSameLineOrderedListText(text: string, helpers: MarkdownParseHelpers): JSONContent[] {
  if (helpers.tokenizeInline) {
    return helpers.parseInline(helpers.tokenizeInline(text))
  }

  return helpers.parseInline([
    {
      type: 'text',
      raw: text,
      text,
    },
  ])
}

/**
 * This extension allows you to create list items.
 * @see https://www.tiptap.dev/api/nodes/list-item
 */
export const ListItem = Node.create<ListItemOptions>({
  name: 'listItem',

  addOptions() {
    return {
      HTMLAttributes: {},
      bulletListTypeName: 'bulletList',
      orderedListTypeName: 'orderedList',
    }
  },

  content: 'paragraph block*',

  defining: true,

  addAttributes() {
    return {
      // The Markdown file puts blank lines between the blocks inside this item
      loose: {
        default: false,
        parseHTML: element => element.hasAttribute('data-loose'),
        renderHTML: attributes => (attributes.loose ? { 'data-loose': '' } : {}),
      },
      // How many spaces the file put before the nested blocks, like 4 under `- `
      indent: {
        default: null,
        parseHTML: element =>
          element.hasAttribute('data-indent') ? Number(element.getAttribute('data-indent')) : null,
        renderHTML: attributes =>
          attributes.indent ? { 'data-indent': String(attributes.indent) } : {},
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'li',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['li', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  markdownTokenName: 'list_item',

  parseMarkdown: (token, helpers) => {
    if (token.type !== 'list_item') {
      return []
    }

    const parseBlockChildren = helpers.parseBlockChildren ?? helpers.parseChildren
    let content: any[] = []

    if (token.tokens && token.tokens.length > 0) {
      if (isSameLineOrderedListToken(token)) {
        return {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: parseSameLineOrderedListText(token.text || '', helpers),
            },
          ],
        }
      }

      // Check if we have paragraph tokens (complex list items)
      const hasParagraphTokens = token.tokens.some(t => t.type === 'paragraph')

      if (hasParagraphTokens) {
        // If we have paragraph tokens, parse them as block elements
        content = parseBlockChildren(token.tokens)
      } else {
        // Check if the first token is a text token with nested inline tokens
        const firstToken = token.tokens[0]

        if (
          firstToken &&
          firstToken.type === 'text' &&
          firstToken.tokens &&
          firstToken.tokens.length > 0
        ) {
          // Parse the inline content from the text token
          const inlineContent = helpers.parseInline(firstToken.tokens)

          // Start with the paragraph containing the inline content
          content = [
            {
              type: 'paragraph',
              content: inlineContent,
            },
          ]

          // If there are additional tokens after the first text token (like nested lists),
          // parse them as block elements and add them
          if (token.tokens.length > 1) {
            const remainingTokens = token.tokens.slice(1)
            const additionalContent = parseBlockChildren(remainingTokens)
            content.push(...additionalContent)
          }
        } else {
          // Fallback: parse all tokens as block elements
          content = parseBlockChildren(token.tokens)
        }
      }
    }

    // Ensure we always have at least an empty paragraph
    if (content.length === 0) {
      content = [
        {
          type: 'paragraph',
          content: [],
        },
      ]
    }

    // Marked adds a space token for a blank line between the item's blocks
    const loose = token.tokens?.some(child => child.type === 'space')
    // A paragraph keeps its own extra spaces, so only a nested list takes the indent
    const indent = /List$/.test(content[1]?.type ?? '')
      ? nestedIndentFromRaw(token.raw ?? '')
      : null
    const attrs = { ...(loose ? { loose: true } : {}), ...(indent ? { indent } : {}) }

    return {
      type: 'listItem',
      ...(Object.keys(attrs).length > 0 ? { attrs } : {}),
      content,
    }
  },

  renderMarkdown: (node, h, ctx) => {
    const markdown = renderNestedMarkdownContent(
      node,
      h,
      (context: any) => {
        if (context.parentType === 'bulletList') {
          return `${context.meta?.parentAttrs?.bullet ?? '-'} `
        }
        if (context.parentType === 'orderedList') {
          const start = context.meta?.parentAttrs?.start || 1
          const type = context.meta?.parentAttrs?.type as string | undefined
          const index = start - 1 + (context.meta?.parentAttrs?.sameNumber ? 0 : context.index || 0)
          return getListMarker(type, index, `${context.meta?.parentAttrs?.delimiter ?? '.'} `)
        }
        // Fallback to bullet list for unknown parent types
        return '- '
      },
      ctx,
      {
        alignNestedToPrefix: ctx?.parentType === 'orderedList',
        blankLineBeforeBlocks: node.attrs?.loose === true,
        indentWidth: node.attrs?.indent,
      },
    )

    // An empty item is just its marker, with no space after it
    return markdown.replace(/^(\S+) (?=\n|$)/, '$1')
  },

  addExtensions() {
    return [
      createBranchingListDeleteKeymap(this.name, [
        this.options.bulletListTypeName,
        this.options.orderedListTypeName,
      ]),
    ]
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => this.editor.commands.splitListItem(this.name),
      Tab: () => this.editor.commands.sinkListItem(this.name),
      'Shift-Tab': () => this.editor.commands.liftListItem(this.name),
    }
  },
})
