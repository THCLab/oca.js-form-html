import type { Structure } from 'oca.js-form-core'
import type { CredentialLayout, FormLayout } from 'types'
import { generateOCACredential } from 'generateOCACredential'
import { generateOCAForm } from 'generateOCAForm'
import yaml from 'js-yaml'

export const renderOCAForm = (
  structure: Structure,
  data = {},
  config: {
    showPii?: boolean
    defaultLanguage?: string
    onSubmitHandler?: (capturedData: { [key: string]: string }) => void
  } = {}
): string => {
  return generateOCAForm(
    structure,
    data,
    config,
    yaml.load(structure.formLayout, { schema: yaml.JSON_SCHEMA }) as FormLayout
  ).outerHTML
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
  const layout = yaml.load(structure.credentialLayout, {
    schema: yaml.JSON_SCHEMA
  }) as CredentialLayout
  return {
    node: generateOCACredential(structure, data, config, layout).outerHTML,
    config: {
      width: layout.config.css.width,
      height: layout.config.css.height
    },
    pageNumber: layout.pages.length
  }
}
