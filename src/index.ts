import type { Structure } from 'oca.js-form-core'
import type { Overlay } from 'oca.js'
import { generateOCACredential } from 'generateOCACredential'
import { generateOCAForm } from 'generateOCAForm'

export const renderOCAForm = async (
  structure: Structure,
  data = {},
  config: {
    showPii?: boolean
    defaultLanguage?: string
    onSubmitHandler?: (capturedData: { [key: string]: string }) => void
    ocaRepoHostUrl?: string
    additionalOverlays?: Overlay[]
  } = {}
): Promise<string> => {
  return (await generateOCAForm(structure, data, config)).outerHTML
}

export const renderOCACredential = async (
  structure: Structure,
  data = {},
  config: {
    dataVaultUrl?: string
    ocaRepoHostUrl?: string
    additionalOverlays?: Overlay[]
  } = {}
): Promise<{
  node: string
  config: { width: string; height: string }
  pageNumber: number
}> => {
  const layout = structure.credentialLayout
  return {
    node: (await generateOCACredential(structure, data, config)).outerHTML,
    config: {
      width: layout.config.css.width,
      height: layout.config.css.height
    },
    pageNumber: layout.pages.length
  }
}
