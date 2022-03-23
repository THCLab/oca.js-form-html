import type { Structure } from 'oca.js-form-core'
import { generateOCACredential } from 'generateOCACredential'
import { generateOCAForm } from 'generateOCAForm'

export const renderOCAForm = (
  structure: Structure,
  data = {},
  config: {
    showPii?: boolean
    defaultLanguage?: string
    onSubmitHandler?: (capturedData: { [key: string]: string }) => void
  } = {}
): string => {
  return generateOCAForm(structure, data, config).outerHTML
}

export const renderOCACredential = (
  structure: Structure,
  data = {},
  config: { dataVaultUrl?: string } = {}
): {
  node: string
  config: { width: string; height: string }
  pageNumber: number
} => {
  const layout = structure.credentialLayout
  return {
    node: generateOCACredential(structure, data, config).outerHTML,
    config: {
      width: layout.config.css.width,
      height: layout.config.css.height
    },
    pageNumber: layout.pages.length
  }
}
