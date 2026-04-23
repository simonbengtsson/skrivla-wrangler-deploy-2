const ALPHANUM = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

export function generateShortId(): string {
  return generateId62(6)
}

export function generateId(): string {
  return generateId62(20)
}

export function generateToken(): string {
  return generateId62(64)
}

function generateId62(length: number): string {
  let out = ""
  const charsLen = ALPHANUM.length
  const buf = new Uint8Array(length * 2)
  crypto.getRandomValues(buf)

  let i = 0
  while (out.length < length && i < buf.length) {
    const v = buf[i++]
    if (v < 248) {
      out += ALPHANUM[v % charsLen]
    }
  }

  if (out.length < length) {
    return out + generateId62(length - out.length)
  }

  return out
}
