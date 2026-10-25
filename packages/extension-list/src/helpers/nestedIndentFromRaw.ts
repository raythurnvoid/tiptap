/** The indent of a list item's nested list, when the file put it past the item's text. */
export function nestedIndentFromRaw(raw: string): number | null {
  const [firstLine, ...lines] = raw.split('\n')
  const markerIndent = firstLine.match(/^ */)?.[0].length ?? 0
  // The nested list's first line, past any wrapped lines of the item's text
  const listLine = lines.find(line => /^ *(?:[-+*]|\d{1,9}[.)])(?:[ \t]|$)/.test(line))
  const indent = (listLine?.match(/^ */)?.[0].length ?? 0) - markerIndent
  const textColumn = (firstLine.match(/^ *\S+ /)?.[0].length ?? Infinity) - markerIndent

  return indent > textColumn ? indent : null
}
