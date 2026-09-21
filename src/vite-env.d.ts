/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_DISABLE_CACHE?: 'true' | 'false' | '1' | '0';
  readonly VITE_TOKEN_SELL_ADDRESS?: string;
  readonly VITE_TONAPI_KEY?: string;
  readonly VITE_TONCONNECT_MANIFEST_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
