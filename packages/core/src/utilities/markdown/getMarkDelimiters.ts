const HTML_TAG_SYNTAX_REGEX = /^<([a-zA-Z]+)>$/

/**
 * Picks the delimiters for a mark from its `markdownSyntax` attribute.
 * A tag like `<b>` always fits. `_` and `__` fit only when the text has no `_`
 * and no letter or digit touches them from outside. `~` fits only when the text has no `~`.
 * @param syntax The mark's `markdownSyntax` attribute.
 * @param fallback The delimiter to use when the syntax does not fit.
 * @param meta The render context meta from the Markdown serializer.
 * @returns The opening and closing delimiters.
 * @example
 * const { open, close } = getMarkDelimiters(node.attrs?.markdownSyntax, '**', ctx.meta)
 */
export function getMarkDelimiters(
  syntax: unknown,
  fallback: string,
  meta?: Record<string, any>,
): { open: string; close: string } {
  const tag = typeof syntax === 'string' ? HTML_TAG_SYNTAX_REGEX.exec(syntax) : null
  if (tag) {
    return { open: `<${tag[1]}>`, close: `</${tag[1]}>` }
  }

  const underscoresFit =
    typeof meta?.markText === 'string' &&
    !meta.markText.includes('_') &&
    meta.markWordBefore === false &&
    meta.markWordAfter === false
  if ((syntax === '_' || syntax === '__') && underscoresFit) {
    return { open: syntax, close: syntax }
  }

  if (syntax === '~' && typeof meta?.markText === 'string' && !meta.markText.includes('~')) {
    return { open: syntax, close: syntax }
  }

  return { open: fallback, close: fallback }
}
