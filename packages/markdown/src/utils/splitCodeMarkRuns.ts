import type { JSONContent } from '@tiptap/core'
import { attrsEqual } from '@tiptap/core'

type Mark = NonNullable<JSONContent['marks']>[number]

const sameMarks = (a: Mark[], b: Mark[]) =>
  a.length === b.length &&
  a.every(mark => b.some(other => other.type === mark.type && attrsEqual(other.attrs, mark.attrs)))

/**
 * Number each code mark run, so the writer closes a code span where another mark starts or ends
 * inside it, then opens it again. Markdown cannot open or close a mark inside a code span.
 */
export function splitCodeMarkRuns(nodes: JSONContent[], codeTypes: Set<string>): JSONContent[] {
  let run = 0
  let previous: { code: Mark; others: Mark[] } | null = null

  return nodes.map(node => {
    const marks = node.marks || []
    const code = marks.find(mark => codeTypes.has(mark.type))
    if (!code) {
      previous = null
      return node
    }

    const others = marks.filter(mark => mark !== code)
    const continues =
      previous !== null &&
      previous.code.type === code.type &&
      attrsEqual(previous.code.attrs, code.attrs) &&
      sameMarks(previous.others, others)
    if (!continues) {
      run += 1
    }
    previous = { code, others }

    return {
      ...node,
      marks: marks.map(mark =>
        mark === code ? { ...mark, attrs: { ...mark.attrs, codeRun: run } } : mark,
      ),
    }
  })
}
