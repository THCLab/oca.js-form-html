declare module 'oca.js-form-html' {
  import type { Structure } from 'oca.js-form-core'
  const renderOCAForm: (structure: Structure) => string

  export { renderOCAForm }
}
