/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_XMOV_APP_ID?: string
  readonly VITE_XMOV_APP_SECRET?: string
  readonly VITE_XMOV_AVATAR_2_ID?: string
  readonly VITE_XMOV_AVATAR_2_SECRET?: string
  readonly VITE_XMOV_AVATAR_3_ID?: string
  readonly VITE_XMOV_AVATAR_3_SECRET?: string
  readonly VITE_XMOV_GATEWAY_SERVER?: string
  readonly VITE_XMOV_SDK_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
