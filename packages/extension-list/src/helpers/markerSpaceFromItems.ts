/** The 2 to 4 spaces a list put after each marker, like 3 in `-   a`. One space gives `null`. */
export function markerSpaceFromItems(items: { raw?: string }[]): number | null {
  // Items with no text on the marker line have no space to keep
  const spaces = items
    .map(item => /^ *(?:[-+*]|\d+[.)])( +)\S/.exec(item.raw ?? '')?.[1].length)
    .filter(space => space !== undefined)
  const [markerSpace] = spaces

  if (!markerSpace || markerSpace < 2 || markerSpace > 4) {
    return null
  }

  return spaces.every(space => space === markerSpace) ? markerSpace : null
}
