/** The indent of a list item's nested list, when the file put it past the item's text. */
export function nestedIndentFromRaw(raw: string): number | null {
  const [firstLine, ...lines] = raw.split('\n')
  const markerIndent = firstLine.match(/^ */)?.[0].length ?? 0
  const indent = (lines.find(line => line.trim())?.match(/^ */)?.[0].length ?? 0) - markerIndent
  const textColumn = (firstLine.match(/^ *\S+ /)?.[0].length ?? Infinity) - markerIndent

  return indent > textColumn ? indent : null
}
