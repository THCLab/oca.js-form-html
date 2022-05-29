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
  const height = [
    { layout: structure.credentialLayout, cardinality: 1 },
    ...structure.controls
      .filter(c => c.type === 'Reference')
      .map(c => ({
        layout: layout.reference_layouts[c.reference.captureBaseSAI],
        cardinality: Number(c.cardinality) || 1
      }))
  ]
    .map(({ layout, cardinality }) => {
      return {
        height: parseInt(layout.config.css.height, 10),
        pageNumber: layout.pages.length,
        cardinality
      }
    })
    .reduce(
      (result, item) =>
        result + (item.height / item.pageNumber) * item.cardinality,
      0
    )

  return {
    node: (await generateOCACredential(structure, data, config)).outerHTML,
    config: {
      width: layout.config.css.width,
      height: height + 'px'
    },
    pageNumber: layout.pages.length
  }
}
