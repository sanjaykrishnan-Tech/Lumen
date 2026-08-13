/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LUMEN_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
