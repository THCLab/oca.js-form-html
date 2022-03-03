export type CredentialLayout = {
  config: {
    css?: {
      width?: string
      height?: string
      style?: string
    }
  }
  pages: {
    config?: {
      css?: {
        background_image?: string
        style?: string
        classes?: string[]
      }
      name?: string
    }
    elements: ElementLayout[]
  }[]
  labels?: {
    [name: string]: {
      [language: string]: string
    }
  }
  classes?: {
    [name: string]: {
      style: string
    }
  }
}

type ElementLayout = BaseElementLayout &
  (RowLayout | ColLayout | MetaLayout | ContentLayout | AttributeLayout)

type BaseElementLayout = {
  config?: {
    css?: {
      style?: string
      classes?: string
    }
  }
}

type RowLayout = {
  type: 'row'
  elements?: ElementLayout[]
}

type ColLayout = {
  type: 'col'
  size?: number
  elements?: ElementLayout[]
}

type MetaLayout = {
  type: 'meta'
  part: 'name' | 'description'
}

type ContentLayout = {
  type: 'content'
  text?: string
  label?: string
}

type AttributeLayout = {
  type: 'attribute'
  name: string
  part: 'data' | 'code' | 'label' | 'information'
}
