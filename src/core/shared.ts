export const DEV_AUTH_COOKIE_NAME = "skrivla-dev-user"
export const DEV_AUTH_ANONYMOUS_VALUE = "anonymous"

export function tryJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value)
  } catch (error) {
    return null
  }
}
