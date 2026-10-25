import type { JSONContent } from '@tiptap/core'

/**
 * @fileoverview Utility functions for rendering nested content in markdown.
 *
 * This module provides reusable utilities for extensions that need to render
 * content with a prefix on the main line and properly indented nested content.
 */

/**
 * Utility function for rendering content with a main line prefix and nested indented content.
 *
 * This function handles the common pattern of rendering content with:
 * 1. A main line with a prefix (like "- " for lists, "> " for blockquotes, etc.)
 * 2. Nested content that gets indented properly
 *
 * @param node - The ProseMirror node representing the content
 * @param h - The markdown renderer helper
 * @param prefixOrGenerator - Either a string prefix or a function that generates the prefix from context
 * @param ctx - Optional context object (used when prefixOrGenerator is a function)
 * @param options - Optional rendering options
 * @param options.alignNestedToPrefix - Indent nested content to the width of the prefix
 * instead of the configured indent size, when the configured one is narrower
 * @returns The rendered markdown string
 *
 * @example
 * ```ts
 * // For a bullet list item with static prefix
 * return renderNestedMarkdownContent(node, h, '- ')
 *
 * // For a task item with static prefix
 * const prefix = `- [${node.attrs?.checked ? 'x' : ' '}] `
 * return renderNestedMarkdownContent(node, h, prefix)
 *
 * // For an ordered list item, where the nested block has to line up with the marker
 * return renderNestedMarkdownContent(node, h, '10. ', ctx, { alignNestedToPrefix: true })
 *
 * // For a blockquote with static prefix
 * return renderNestedMarkdownContent(node, h, '> ')
 *
 * // For content with dynamic prefix based on context
 * return renderNestedMarkdownContent(node, h, ctx => {
 *   if (ctx.parentType === 'orderedList') {
 *     return `${ctx.index + 1}. `
 *   }
 *   return '- '
 * }, ctx)
 *
 * // Custom extension example
 * const CustomContainer = Node.create({
 *   name: 'customContainer',
 *   // ... other config
 *   markdown: {
 *     render: (node, h) => {
 *       const type = node.attrs?.type || 'info'
 *       return renderNestedMarkdownContent(node, h, `[${type}] `)
 *     }
 *   }
 * })
 * ```
 */
const TAB_STOP = 4

/** Width of indentation in Markdown columns, where a tab runs to the next tab stop. */
function columnWidth(text: string): number {
  let width = 0

  for (const character of text) {
    width = character === '\t' ? width + TAB_STOP - (width % TAB_STOP) : width + 1
  }

  return width
}

export function renderNestedMarkdownContent(
  node: JSONContent,
  h: {
    renderChildren: (nodes: JSONContent[]) => string
    renderChild?: (node: JSONContent, index: number) => string
    indent: (text: string) => string
  },
  prefixOrGenerator: string | ((ctx: any) => string),
  ctx?: any,
  options?: {
    /** See the `@param` note above. */
    alignNestedToPrefix?: boolean
    /** Put a blank line before each nested block but a list, like the file did. */
    blankLineBeforeBlocks?: boolean
    /** Indent nested content this many spaces, like the file did. Used only when it still nests. */
    indentWidth?: number | null
    /** Indent the main content's later lines too, like the wrapped lines of a list item's text. */
    indentMainContent?: boolean
    /** Start the main content on the line under the prefix, like the file did. */
    mainContentBelowPrefix?: boolean
  },
): string {
  if (!node || !Array.isArray(node.content)) {
    return ''
  }

  // Determine the prefix based on the input
  const prefix =
    typeof prefixOrGenerator === 'function' ? prefixOrGenerator(ctx) : prefixOrGenerator

  const [content, ...children] = node.content

  const indentLine = (line: string, indentWidth = options?.indentWidth ?? 0) => {
    // 4 or more extra spaces would make an indented code block
    if (indentWidth >= columnWidth(prefix) && indentWidth < columnWidth(prefix) + 4) {
      return ' '.repeat(indentWidth) + line
    }

    if (!options?.alignNestedToPrefix) {
      return h.indent(line)
    }

    // Keep the configured indentation when it already reaches the
    // content column, so `Markdown.indentation` still applies. A tab
    // runs to the next tab stop, so it is wider than its one character.
    const configured = h.indent('')
    const prefixWidth = columnWidth(prefix)

    return (columnWidth(configured) >= prefixWidth ? configured : ' '.repeat(prefixWidth)) + line
  }
  // Leave empty lines empty, so a blank line in a code block gets no trailing spaces
  const indentLines = (text: string) =>
    text
      .split('\n')
      .map(line => (line ? indentLine(line) : ''))
      .join('\n')

  // Render the main content (typically a paragraph). Its later lines start where nested blocks
  // start, because the reader counts their own spaces from there. The kept indent of a nested
  // list does not apply to them.
  const mainContent = h.renderChildren([content])
  const mainLines = mainContent.split('\n')
  let output = `${prefix}${mainContent}`
  if (options?.mainContentBelowPrefix) {
    output = `${prefix.trimEnd()}\n${mainLines.map(line => (line ? indentLine(line, 0) : line)).join('\n')}`
  } else if (options?.indentMainContent) {
    output = `${prefix}${mainLines
      .map((line, index) => (index > 0 && line ? indentLine(line, 0) : line))
      .join('\n')}`
  }

  // Handle nested children with proper indentation
  if (children && children.length > 0) {
    children.forEach((child, index) => {
      const childContent = h.renderChild?.(child, index + 1) ?? h.renderChildren([child])
      if (childContent !== undefined && childContent !== null) {
        const indentedChild = indentLines(childContent)
        const previous = index === 0 ? content : children[index - 1]
        const tight = child.attrs?.markdownTight === true
        // Text right under a heading, rule or fence still reads as its own paragraph
        const paragraphFitsBelow =
          tight && ['heading', 'horizontalRule', 'codeBlock'].includes(previous?.type ?? '')

        const blankLine =
          (child.type === 'paragraph' && !paragraphFitsBelow) ||
          (options?.blankLineBeforeBlocks && !tight && !/List$/.test(child.type ?? '')) ||
          // A line of only `-` right under the text above turns it into a heading
          /^-+[ \t]*(?:\n|$)/.test(childContent)
        output += blankLine ? `\n\n${indentedChild}` : `\n${indentedChild}`
      }
    })
  }

  return output
}
