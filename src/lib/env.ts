const envRecord = import.meta.env as unknown as Record<string, string | undefined>;

export const DISABLE_CACHE: boolean = envRecord.VITE_DISABLE_CACHE === 'true';

export function getEnvBool(key: string, fallback = false): boolean {
  const v = envRecord[key];
  if (v === undefined) return fallback;
  return v === 'true' || v === '1';
}
