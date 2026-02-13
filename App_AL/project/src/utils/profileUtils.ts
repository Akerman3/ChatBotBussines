export function normalizeProfileName(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
}
