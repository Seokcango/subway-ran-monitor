/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'false'면 가상 데이터 대신 실제 API를 호출한다. */
  readonly VITE_USE_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
