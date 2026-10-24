import type { Extensions } from '@tiptap/core'
import { getSchema } from '@tiptap/core'
import { type ParseOptions, DOMParser as PMDOMParser } from '@tiptap/pm/model'
import { DOMParser } from 'linkedom/worker'

/**
 * Generates a JSON object from the given HTML string and converts it into a Prosemirror node with content.
 * @remarks **Important**: This function requires `linkedom` to be installed in your project.
 * @param {string} html - The HTML string to be converted into a Prosemirror node.
 * @param {Extensions} extensions - The extensions to be used for generating the schema.
 * @param {ParseOptions} options - The options to be supplied to the parser.
 * @returns {Promise<Record<string, any>>} - A promise with the generated JSON object.
 * @example
 * const html = '<p>Hello, world!</p>'
 * const extensions = [...]
 * const json = generateJSON(html, extensions)
 * console.log(json) // { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello, world!' }] }] }
 */
export function generateJSON(
  html: string,
  extensions: Extensions,
  options?: ParseOptions,
): Record<string, any> {
  // Linkedom parses data without executing scripts or loading resources.
  const localDOMParser = new DOMParser()
  const schema = getSchema(extensions)
  const htmlString = `<!DOCTYPE html><html><body>${html}</body></html>`
  const doc = localDOMParser.parseFromString(htmlString, 'text/html')

  if (!doc) {
    throw new Error('Failed to parse HTML string')
  }

  // Linkedom keeps attribute names as written, but HTML reads `HREF` as `href`
  doc.body.querySelectorAll('*').forEach(element => {
    Array.from(element.attributes).forEach(attribute => {
      const name = attribute.name.toLowerCase()
      if (name === attribute.name) {
        return
      }
      element.removeAttribute(attribute.name)
      if (!element.hasAttribute(name)) {
        element.setAttribute(name, attribute.value)
      }
    })
  })

  return PMDOMParser.fromSchema(schema)
    .parse(doc.body as unknown as Node, options)
    .toJSON()
}
