export function buildSearchTokens(...values: unknown[]): string[] {
  const words = values
    .map((value) => String(value || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s-]/g, ' '))
    .join(' ')
    .split(/\s+/)
    .filter((word) => word.length >= 2);
  const tokens = new Set<string>();
  for (const word of words) {
    tokens.add(word.slice(0, 40));
    for (let length = 2; length <= Math.min(word.length, 12); length += 1) tokens.add(word.slice(0, length));
    if (tokens.size >= 120) break;
  }
  return Array.from(tokens).slice(0, 120);
}

