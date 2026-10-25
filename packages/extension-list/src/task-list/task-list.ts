import { mergeAttributes, Node, parseIndentedBlocks } from '@tiptap/core'

import { bulletFromMarker } from '../helpers/bulletFromMarker.js'

// A line that starts a block ends the item's text: a list item, heading, fence, quote, HTML, rule or heading underline
const BLOCK_START_REGEX =
  /^\s*(?:[-+*](?:\s|$)|\d{1,9}[.)](?:\s|$)|#{1,6}(?:\s|$)|`{3,}|~{3,}|>|<|\$\$|[-=]+\s*$|(?:\*[ \t]*){3,}$|(?:_[ \t]*){3,}$)/

export interface TaskListOptions {
  /**
   * The node type name for a task item.
   * @default 'taskItem'
   * @example 'myCustomTaskItem'
   */
  itemTypeName: string

  /**
   * The HTML attributes for a task list node.
   * @default {}
   * @example { class: 'foo' }
   */
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    taskList: {
      /**
       * Toggle a task list
       * @example editor.commands.toggleTaskList()
       */
      toggleTaskList: () => ReturnType
    }
  }
}

/**
 * This extension allows you to create task lists.
 * @see https://www.tiptap.dev/api/nodes/task-list
 */
export const TaskList = Node.create<TaskListOptions>({
  name: 'taskList',

  addOptions() {
    return {
      itemTypeName: 'taskItem',
      HTMLAttributes: {},
    }
  },

  group: 'block list',

  content() {
    return `${this.options.itemTypeName}+`
  },

  parseHTML() {
    return [
      {
        tag: `ul[data-type="${this.name}"]`,
        priority: 51,
      },
    ]
  },

  addAttributes() {
    return {
      // Keep the `*` or `+` marker from Markdown. `null` saves as `-`.
      bullet: {
        default: null,
        parseHTML: element => bulletFromMarker(element.getAttribute('data-bullet') ?? ''),
        renderHTML: attributes => (attributes.bullet ? { 'data-bullet': attributes.bullet } : {}),
      },
    }
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'ul',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-type': this.name }),
      0,
    ]
  },

  parseMarkdown: (token, h) => {
    const bullet = bulletFromMarker(token.raw?.trimStart().charAt(0) ?? '')
    return h.createNode('taskList', bullet ? { bullet } : {}, h.parseChildren(token.items || []))
  },

  renderMarkdown: (node, h) => {
    if (!node.content) {
      return ''
    }

    return h.renderChildren(node.content, '\n')
  },

  markdownTokenizer: {
    name: 'taskList',
    level: 'block',
    start(src) {
      // Look for the start of a task list item
      const index = src.match(/^\s*[-+*]\s+\[([ xX])\]\s+/)?.index
      return index !== undefined ? index : -1
    },
    tokenize(src, tokens, lexer) {
      // Helper function to recursively parse task lists
      const parseTaskListContent = (content: string): any[] | undefined => {
        const nestedResult = parseIndentedBlocks(
          content,
          {
            itemPattern: /^(\s*)([-+*])\s+\[([ xX])\]\s+(.*)$/,
            extractItemData: match => ({
              indentLevel: match[1].length,
              mainContent: match[4],
              checked: match[3].toLowerCase() === 'x',
              checkedMark: match[3],
            }),
            createToken: (data, nestedTokens) => ({
              type: 'taskItem',
              raw: '',
              mainContent: data.mainContent,
              indentLevel: data.indentLevel,
              checked: data.checked,
              checkedMark: data.checkedMark,
              text: data.mainContent,
              tokens: lexer.inlineTokens(data.mainContent),
              nestedTokens,
            }),
            // Allow recursive nesting
            customNestedParser: parseTaskListContent,
            isTextContinuation: line => !BLOCK_START_REGEX.test(line),
          },
          lexer,
        )

        if (nestedResult) {
          const taskListToken = {
            type: 'taskList',
            raw: nestedResult.raw,
            items: nestedResult.items,
          }

          // parseIndentedBlocks only consumes checkbox items.
          // Parse any remaining indented content, such as plain bullets,
          // and keep it as sibling tokens.
          const remainder = content.slice(nestedResult.raw.length)
          if (remainder.trim()) {
            return [taskListToken, ...lexer.blockTokens(remainder)]
          }

          return [taskListToken]
        }

        // Fall back to regular markdown parsing if not a task list
        return lexer.blockTokens(content)
      }

      const result = parseIndentedBlocks(
        src,
        {
          itemPattern: /^(\s*)([-+*])\s+\[([ xX])\]\s+(.*)$/,
          extractItemData: match => ({
            indentLevel: match[1].length,
            mainContent: match[4],
            checked: match[3].toLowerCase() === 'x',
            checkedMark: match[3],
          }),
          createToken: (data, nestedTokens) => ({
            type: 'taskItem',
            raw: '',
            mainContent: data.mainContent,
            indentLevel: data.indentLevel,
            checked: data.checked,
            checkedMark: data.checkedMark,
            text: data.mainContent,
            tokens: lexer.inlineTokens(data.mainContent),
            nestedTokens,
          }),
          // Use the recursive parser for nested content
          customNestedParser: parseTaskListContent,
          isTextContinuation: line => !BLOCK_START_REGEX.test(line),
        },
        lexer,
      )

      if (!result) {
        return undefined
      }

      return {
        type: 'taskList',
        raw: result.raw,
        items: result.items,
      }
    },
  },

  markdownOptions: {
    indentsContent: true,
  },

  addCommands() {
    return {
      toggleTaskList:
        () =>
        ({ commands }) => {
          return commands.toggleList(this.name, this.options.itemTypeName)
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-9': () => this.editor.commands.toggleTaskList(),
    }
  },
})
