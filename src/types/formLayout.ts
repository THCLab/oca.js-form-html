export type FormLayout = {
  rows: {
    config?: {
      style?: string
      classes?: string[]
    }
    elements: {
      type: 'meta' | 'image' | 'category' | 'attribute'
      name: string
      style?: string
      base64?: string
      classes?: string[]
      layout?: FormLayout
    }[]
  }[]
}
