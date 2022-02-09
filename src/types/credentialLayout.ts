export type CredentialLayout = {
  config: {
    width?: string
    height?: string
    style?: string
  }
  pages: {
    config?: {
      background_image?: string
      style?: string
      classes?: string[]
      name?: string
    }
    elements: ElementLayout[]
  }[]
}

type ElementLayout = BaseElementLayout &
  (RowLayout | ColLayout | MetaLayout | ContentLayout | AttributeLayout)

type BaseElementLayout = {
  config?: {
    style?: string
    classes?: string
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
  text: string
}

type AttributeLayout = {
  type: 'attribute'
  name: string
  part: 'data' | 'label' | 'information'
}
