const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 30;

const hits = new Map<string, number[]>();

/**
 * Rate limit em memória por IP. Reinicia a cada deploy/restart do container
 * e NÃO é compartilhado entre réplicas — adequado para uma única instância
 * (V1). Antes de escalar horizontalmente, substituir por um store
 * compartilhado (ex.: Redis).
 */
export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const timestamps = (hits.get(key) ?? []).filter((timestamp) => now - timestamp < WINDOW_MS);

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    hits.set(key, timestamps);
    return false;
  }

  timestamps.push(now);
  hits.set(key, timestamps);
  return true;
}
