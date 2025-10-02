export const DISABLE_CACHE: boolean = import.meta.env.VITE_DISABLE_CACHE === 'true';

export function getEnvBool(key: string, fallback = false): boolean {
  const v = (import.meta.env as unknown as Record<string, string | undefined>)[key];
  if (v === undefined) return fallback;
  return v === 'true' || v === '1';
}


