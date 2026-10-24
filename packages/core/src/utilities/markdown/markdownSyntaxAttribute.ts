/**
 * A mark attribute that keeps how Markdown wrote the mark, like `__` or `<b>`.
 * Read it with `getMarkDelimiters` when the mark renders Markdown.
 * @returns The attribute spec for `addAttributes`.
 * @example
 * addAttributes() {
 *   return { markdownSyntax: markdownSyntaxAttribute() }
 * }
 */
export function markdownSyntaxAttribute() {
  return {
    default: null,
    parseHTML: (element: HTMLElement) => element.getAttribute('data-markdown-syntax'),
    renderHTML: (attributes: Record<string, any>) =>
      attributes.markdownSyntax ? { 'data-markdown-syntax': attributes.markdownSyntax } : {},
  }
}
