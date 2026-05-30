import type { Context } from 'hono';

export function envValue(key: string, c?: Context): string | undefined {
  const honoEnvValue = c?.env?.[key];
  if (typeof honoEnvValue === 'string') {
    return honoEnvValue;
  }

  return typeof Bun === 'undefined' ? process.env[key] : Bun.env[key];
}
