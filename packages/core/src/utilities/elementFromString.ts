import { DOMParser as LinkedomDOMParser } from 'linkedom/worker'

const removeWhitespaces = (node: HTMLElement) => {
  const children = node.childNodes

  for (let i = children.length - 1; i >= 0; i -= 1) {
    const child = children[i]

    if (child.nodeType === 3 && child.nodeValue && /^(\n\s\s|\n)$/.test(child.nodeValue)) {
      node.removeChild(child)
    } else if (child.nodeType === 1) {
      removeWhitespaces(child as HTMLElement)
    }
  }

  return node
}

export function elementFromString(value: string): HTMLElement {
  // Prefer the platform DOMParser (browser). Fall back to linkedom for worker/server runtimes.
  const domParser = typeof DOMParser === 'undefined' ? new LinkedomDOMParser() : new DOMParser()

  // add a wrapper to preserve leading and trailing whitespace
  const wrappedValue = `<body>${value}</body>`

  const html = domParser.parseFromString(wrappedValue, 'text/html').body

  return removeWhitespaces(html as unknown as HTMLElement)
}
