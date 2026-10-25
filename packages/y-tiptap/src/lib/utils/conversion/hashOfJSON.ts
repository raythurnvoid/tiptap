import * as sha256 from 'lib0/hash/sha256'
import * as buf from 'lib0/buffer'
const foldDigest = (digest: Uint8Array<ArrayBufferLike>) => {
  const hashBytes = 6
  for (let i = hashBytes; i < digest.length; i++) {
    digest[i % hashBytes] = digest[i % hashBytes] ^ digest[i]
  }
  return digest.slice(0, hashBytes)
}
// Not lib0's toBase64: outside a browser it uses Node's Buffer, which Convex does not have
const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes))
export const hashOfJSON = (json: unknown) =>
  toBase64(foldDigest(sha256.digest(buf.encodeAny(json))))
