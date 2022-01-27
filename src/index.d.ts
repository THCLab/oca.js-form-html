declare module 'oca.js-form-html' {
  import type { Structure } from 'oca.js-form-core'
  const renderOCAForm: (structure: Structure) => string
  const renderOCACredential: (
    structure: Structure,
    data: { [key: string]: string },
    config: { dataVaultUrl?: string }
  ) => {
    node: string
    config: { width: string; height: string }
    pageNumber: number
  }

  export { renderOCAForm, renderOCACredential }
}
