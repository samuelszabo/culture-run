import sk from './sk.json'

const strings: Record<string, string> = sk

export function t(key: string): string {
  return strings[key] ?? key
}
