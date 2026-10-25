/** Keep a `*` or `+` list marker. `-` is the default, so it gives `null`. */
export function bulletFromMarker(marker: string) {
  return marker === '*' || marker === '+' ? marker : null
}
