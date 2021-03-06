declare module 'oca.js-form-html' {
  import type { Structure } from 'oca.js-form-core'
  import type { Overlay } from 'oca.js'
  const renderOCAForm: (
    structure: Structure,
    data: { [key: string]: string },
    config: {
      showFlagged?: boolean
      defaultLanguage?: string
      onSubmitHandler?: (capturedData: { [key: string]: string }) => void
      ocaRepoHostUrl?: string
      additionalOverlays?: Overlay[]
    }
  ) => Promise<string>
  const renderOCACredential: (
    structure: Structure,
    data: { [key: string]: string },
    config: {
      defaultLanguage?: string
      dataVaultUrl?: string
      ocaRepoHostUrl?: string
      additionalOverlays?: Overlay[]
    }
  ) => Promise<{
    node: string
    config: { width: string; height: string }
    pageNumber: number
  }>

  export { renderOCAForm, renderOCACredential }
}
