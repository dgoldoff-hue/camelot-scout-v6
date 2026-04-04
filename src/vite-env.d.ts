/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_AI_API_URL: string;
  readonly VITE_AI_API_KEY: string;
  readonly VITE_AI_MODEL: string;
  readonly VITE_ANTHROPIC_API_KEY: string;
  readonly VITE_APOLLO_API_KEY: string;
  readonly VITE_PROSPEO_API_KEY: string;
  readonly VITE_HUBSPOT_API_KEY: string;
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
