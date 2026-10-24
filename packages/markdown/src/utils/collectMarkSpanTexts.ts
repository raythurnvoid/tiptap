import type { JSONContent } from '@tiptap/core'

/**
 * `wordBefore` and `wordAfter` are true when a letter, a digit or another node touches the run from
 * outside. Then `_` delimiters would not parse.
 */
export type MarkSpan = { text: string; textNodes: number; wordBefore: boolean; wordAfter: boolean }

const touchesWord = (node: JSONContent | undefined, edge: 'start' | 'end') => {
  if (!node) {
    return false
  }
  if (node.type !== 'text') {
    return true
  }
  const text = node.text || ''
  return /[\p{L}\p{N}]/u.test(edge === 'end' ? text.slice(-1) : text.slice(0, 1))
}

// Gives each node the full text of its mark run, so a delimiter can fit the whole span
export function collectMarkSpanTexts(
  nodes: JSONContent[],
  isInlineText: (node: JSONContent) => boolean = node => node.type === 'text',
): Map<string, MarkSpan>[] {
  const spanTexts: Map<string, MarkSpan>[] = nodes.map(() => new Map())
  const openRuns = new Map<string, { indexes: number[]; text: string; textNodes: number }>()

  const flush = (markType: string) => {
    const run = openRuns.get(markType)
    if (!run) {
      return
    }
    const first = nodes[run.indexes[0]]
    const last = nodes[run.indexes[run.indexes.length - 1]]
    // Save moves edge spaces outside the delimiters
    const span = {
      text: run.text,
      textNodes: run.textNodes,
      wordBefore:
        !(first.type === 'text' && /^\s/.test(first.text || '')) &&
        touchesWord(nodes[run.indexes[0] - 1], 'end'),
      wordAfter:
        !(last.type === 'text' && /\s$/.test(last.text || '')) &&
        touchesWord(nodes[run.indexes[run.indexes.length - 1] + 1], 'start'),
    }
    run.indexes.forEach(index => spanTexts[index].set(markType, span))
    openRuns.delete(markType)
  }

  nodes.forEach((node, index) => {
    if (!isInlineText(node)) {
      Array.from(openRuns.keys()).forEach(flush)
      return
    }

    const markTypes = new Set((node.marks || []).map(mark => mark.type))

    Array.from(openRuns.keys())
      .filter(markType => !markTypes.has(markType))
      .forEach(flush)

    markTypes.forEach(markType => {
      const run = openRuns.get(markType) || { indexes: [], text: '', textNodes: 0 }
      run.indexes.push(index)
      run.text += node.text || ''
      run.textNodes += node.type === 'text' ? 1 : 0
      openRuns.set(markType, run)
    })
  })

  Array.from(openRuns.keys()).forEach(flush)

  return spanTexts
}
