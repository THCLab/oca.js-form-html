import type { Structure } from 'oca.js-form-core'
import type { Overlay, UnitOverlay } from 'oca.js'
import type { Data, DataValue } from './types'
import { transformDataUnit } from './transformDataUnit'

let document: Document

if (typeof window === 'undefined') {
  const { JSDOM } = require('jsdom') // eslint-disable-line
  const dom = new JSDOM()
  document = dom.window.document
} else {
  document = window.document
}

export const generateOCAForm = async (
  structure: Structure,
  data: Data,
  config: {
    showFlagged?: boolean
    defaultLanguage?: string
    onSubmitHandler?: (capturedData: Data) => void
    ocaRepoHostUrl?: string
    additionalOverlays?: Overlay[]
    formLayout?: Structure['formLayout']
  }
): Promise<HTMLElement> => {
  const unitMappingOverlays = config.additionalOverlays
    ? (config.additionalOverlays.filter(o =>
        o.type.includes(`/unit/`)
      ) as UnitOverlay[])
    : []
  data = await transformDataUnit(data, {
    structure,
    unitOverlays: unitMappingOverlays,
    ocaRepoHostUrl: config.ocaRepoHostUrl
  })

  const layout = config.formLayout || structure.formLayout
  const availableLanguages = Object.keys(structure.translations)
  let defaultLanguage = availableLanguages[0]
  if (config.defaultLanguage) {
    if (availableLanguages.includes(config.defaultLanguage)) {
      defaultLanguage = config.defaultLanguage
    } else if (
      availableLanguages.find(lang => lang.startsWith(config.defaultLanguage))
    ) {
      defaultLanguage = availableLanguages.find(lang =>
        lang.startsWith(config.defaultLanguage)
      )
    }
  }

  const form = document.createElement('div')

  if (layout.config && layout.config.css && layout.config.css.style) {
    const layoutStyle = document.createElement('style')
    layoutStyle.innerHTML = layout.config.css.style
    form.appendChild(layoutStyle)
  }

  const elements: typeof layout.elements = []
  layout.elements.forEach(element => {
    let cardinality = 1
    if (element.type === 'attribute') {
      const attr = structure.controls.find(el => el.name == element.name)
      if (attr.cardinality) {
        cardinality = Number(attr.cardinality)
      }
    }

    for (let i = 0; i < cardinality; i++) {
      elements.push(element)
    }
  })
  ;(
    await Promise.all(
      elements.map(async element => {
        let elementEl = document.createElement('div')
        switch (element.type) {
          case 'meta':
            element.parts.forEach(part => {
              let partEl: HTMLElement

              switch (part.name) {
                case 'name':
                  partEl = document.createElement('div')
                  partEl.innerHTML = '<slot name="meta-name"></slot>'
                  break
                case 'description':
                  partEl = document.createElement('div')
                  partEl.innerHTML = '<slot name="meta-description"></slot>'
                  break
                case 'language': {
                  partEl = document.createElement('select')
                  partEl.id = 'languageSelect'

                  availableLanguages.forEach(lang => {
                    const option = document.createElement('option')
                    option.setAttribute('value', lang)
                    option.innerText = lang
                    if (lang === defaultLanguage) {
                      option.setAttribute('selected', '')
                    }
                    partEl.appendChild(option)
                  })
                  break
                }
              }

              if (part.config && part.config.css) {
                if (part.config.css.style) {
                  partEl.style.cssText = part.config.css.style
                }
                if (part.config.css.classes) {
                  partEl.classList.add(...part.config.css.classes)
                }
              }
              elementEl.appendChild(partEl)
            })
            break
          case 'category': {
            const cat = structure.sections.find(el => el.id == element.id)
            elementEl = generateCategory(cat)
            elementEl.classList.add('_category')
            break
          }
          case 'attribute': {
            const attr = structure.controls.find(el => el.name == element.name)
            elementEl.classList.add('_control')
            ;(
              await Promise.all(
                element.parts.map(async part => {
                  let partEl: HTMLElement
                  switch (part.name) {
                    case 'label':
                      partEl = document.createElement('label')
                      partEl.classList.add('_label')
                      partEl.setAttribute('for', attr.name)
                      partEl.innerHTML = `<slot name="control" part="label" attr-name="${attr.name}"></slot>`
                      break
                    case 'input':
                      if (
                        attr.type === 'Select' ||
                        attr.type === 'SelectMultiple'
                      ) {
                        partEl = await generateControlInput(
                          attr,
                          data[attr.mapping || attr.name] as string,
                          {
                            showFlagged: config.showFlagged,
                            defaultLanguage: config.defaultLanguage,
                            ocaRepoHostUrl: config.ocaRepoHostUrl
                          }
                        )
                      } else {
                        let dataValue = data[attr.mapping || attr.name]
                        if (Array.isArray(dataValue)) {
                          dataValue = (
                            data[attr.mapping || attr.name] as string[]
                          ).shift()
                        }
                        partEl = document.createElement('div')
                        partEl.style.cssText +=
                          'display: flex; align-items: center;'

                        const controlInputConfig: {
                          showFlagged: boolean
                          defaultLanguage: string
                          ocaRepoHostUrl: string
                          formLayout?: Structure['formLayout']
                        } = {
                          showFlagged: config.showFlagged,
                          defaultLanguage: config.defaultLanguage,
                          ocaRepoHostUrl: config.ocaRepoHostUrl
                        }
                        if (part.layout) {
                          controlInputConfig['formLayout'] =
                            structure.formLayout.reference_layouts[part.layout]
                        }
                        const inputEl = await generateControlInput(
                          attr,
                          dataValue,
                          controlInputConfig
                        )
                        partEl.appendChild(inputEl)
                        if (attr.isFlagged) {
                          inputEl.style.cssText += 'display: inline-block;'
                          const showFlaggedEl = document.createElement('input')
                          showFlaggedEl.type = 'checkbox'
                          if (config.showFlagged) {
                            showFlaggedEl.setAttribute('checked', '')
                          }
                          showFlaggedEl.style.cssText +=
                            'display: inline-block;'
                          showFlaggedEl.classList.add('flagged-toggle')
                          partEl.appendChild(showFlaggedEl)
                        }
                      }
                      break
                    case 'information':
                      partEl = document.createElement('div')
                      partEl.classList.add('_information')

                      partEl.innerHTML = `<slot name="control" part="information" attr-name="${attr.name}"></slot>`
                      break
                  }
                  if (part.config && part.config.css) {
                    if (part.config.css.style) {
                      partEl.style.cssText = part.config.css.style
                    }
                    if (part.config.css.classes) {
                      partEl.classList.add(...part.config.css.classes)
                    }
                  }
                  return partEl
                })
              )
            ).forEach(partEl => elementEl.appendChild(partEl))
            break
          }
        }
        if (element.config && element.config.css) {
          if (element.config.css.style) {
            elementEl.style.cssText = element.config.css.style
          }
          if (element.config.css.classes) {
            elementEl.classList.add(...element.config.css.classes)
          }
        }

        return elementEl
      })
    )
  ).forEach(elementEl => form.appendChild(elementEl))

  if (config.onSubmitHandler) {
    const submit = document.createElement('input')
    submit.id = 'submit'
    submit.type = 'submit'
    form.appendChild(submit)
  }

  class OCAForm extends HTMLElement {
    structure: null | {
      translations: Structure['translations']
      controls: Structure['controls']
      sections: Structure['sections']
    }

    form: HTMLFormElement
    hiddenControls: Set<string>

    static get observedAttributes() {
      return ['language', 'structure']
    }

    constructor() {
      super()
      this.structure = null
      this.hiddenControls = new Set()
      const shadow = this.attachShadow({ mode: 'open' })

      const template = document.createElement('template')
      template.innerHTML = `<form>${form.outerHTML}</form>`
      const templateContent = template.content

      shadow.appendChild(templateContent.cloneNode(true))
      const languageSelect: HTMLSelectElement =
        shadow.querySelector('#languageSelect')
      if (languageSelect) {
        languageSelect.onchange = () =>
          this.setAttribute('language', languageSelect.value)
      }
      shadow.querySelectorAll('.flagged-toggle').forEach(el => {
        const toggle = (el: Element) => {
          const inputEl: HTMLInputElement =
            el.parentElement.querySelector('._input')
          const control = structure.controls.find(c => c.name === inputEl.name)
          inputEl.type =
            inputEl.type === 'password'
              ? control.type === 'Binary'
                ? 'file'
                : control.type
              : 'password'
        }
        if (!config.showFlagged) {
          toggle(el)
        }
        /* eslint-disable */
        // @ts-ignore
        el.onchange = e => {
          toggle(e.target)
        }
        /* eslint-enable */
      })
      this.form = shadow.querySelector('form')
      this.form.oninput = e => {
        /* eslint-disable */
        // @ts-ignore
        if (e.target.classList.contains('_input')) {
          // @ts-ignore
          this.controlInputChanged(e.target.getAttribute('name'))
        }
        /* eslint-enable */
      }

      this.form.onsubmit = () => {
        if (config.onSubmitHandler && this.validateForm()) {
          const capturedData = this.captureFormData()
          this.hiddenControls.forEach(
            controlName => delete capturedData[controlName]
          )
          config.onSubmitHandler(capturedData)
        }
        return false
      }
    }

    validateForm(form = this.form) {
      const formsValidation = Array.from(
        form.querySelectorAll('._reference')
      ).map(refEl => {
        const refForm = refEl?.shadowRoot?.querySelector('form')
        if (refForm) {
          return refForm.reportValidity()
        }
      })
      return [form.reportValidity(), ...formsValidation].every(v => v)
    }

    controlInputChanged(controlName: string) {
      const capturedData = this.captureFormData()
      this.structure.controls.forEach(c => {
        if (c.dependencies?.includes(controlName)) {
          this.evaluateControlCondition(c, capturedData)
        }
      })
    }

    evaluateControlCondition(
      control: Structure['controls'][0],
      capturedData: Data = {}
    ) {
      const varPlaceholders = control.condition.match(/\${\d+}/g) || []
      const placeholersValue: Data = {}
      varPlaceholders.forEach(placeholder => {
        const index = parseInt(placeholder.match(/\d+/)[0])
        const dependencyName = control.dependencies[index]
        placeholersValue[placeholder] = capturedData[dependencyName]
      })
      let condition = control.condition
        .split('‘')
        .join("'")
        .split('’')
        .join("'")
      Object.entries(placeholersValue).forEach(([placeholder, value]) => {
        condition = condition.split(placeholder).join(`'${value}'`)
      })

      let controlDiv: HTMLElement
      while (!controlDiv) {
        let node: HTMLElement = this.form.querySelector(`#${control.name}`)
        while (!node.classList.contains('_control')) {
          node = node.parentElement
        }
        controlDiv = node
      }
      if (evaluateCondition(condition)) {
        this.hiddenControls.delete(control.name)
        controlDiv.style.display = null

        if (control.reference) {
          const refEl = this.form.querySelector(
            `._reference#${control.name}`
          ).shadowRoot
          control.reference.controls.forEach(nestedControl => {
            if (nestedControl.conformance === 'M') {
              refEl
                .querySelector(`#${nestedControl.name}`)
                .setAttribute('required', '')
            }
          })
        }

        Array.from(controlDiv.getElementsByClassName('_input')).forEach(el => {
          if (control.conformance === 'M') {
            el.setAttribute('required', '')
          }
        })
      } else {
        this.hiddenControls.add(control.name)

        if (control.reference) {
          const refEl = this.form.querySelector(
            `._reference#${control.name}`
          ).shadowRoot
          control.reference.controls.forEach(nestedControl => {
            refEl
              .querySelector(`#${nestedControl.name}`)
              .removeAttribute('required')
          })
        }

        controlDiv.style.display = 'none'
        Array.from(controlDiv.getElementsByClassName('_input')).forEach(el => {
          el.removeAttribute('required')
        })
      }
    }

    captureFormData(form = this.form, structure = this.structure) {
      const capturedData: Data = {}
      const formData = new FormData(form)
      structure.controls.forEach(c => {
        switch (c.type) {
          case 'SelectMultiple': {
            capturedData[c.name] = formData.getAll(c.name) as string[]
            break
          }
          case 'Reference': {
            if (c.cardinality) {
              const refOCAForms = form.querySelectorAll(`#${c.name}\\[\\]`)
              capturedData[c.name] = []
              refOCAForms.forEach(refOCAForm => {
                const refForm = refOCAForm?.shadowRoot?.querySelector('form')
                if (refForm) {
                  ;(capturedData[c.name] as Data[]).push(
                    this.captureFormData(refForm, c.reference)
                  )
                }
              })
            } else {
              const refForm = form
                .querySelector(`#${c.name}`)
                ?.shadowRoot?.querySelector('form')
              if (refForm) {
                capturedData[c.name] = this.captureFormData(
                  refForm,
                  c.reference
                )
              }
            }
            break
          }
          case 'Binary': {
            const file = formData.get(c.name) as Blob
            if (file.size > 0) {
              const reader = new FileReader()
              reader.readAsDataURL(file)
              reader.onload = () => {
                capturedData[c.name] = reader.result as string
              }
            }
            break
          }
          default:
            if (c.cardinality) {
              capturedData[c.name] = (formData.getAll(c.name + '[]') ||
                []) as string[]
            } else {
              capturedData[c.name] = (formData.get(c.name) || '') as string
            }
            break
        }

        capturedData[c.name] = capturedData[c.name] || ''
      })

      return capturedData
    }

    connectedCallback() {
      const capturedData = this.captureFormData()
      this.structure.controls.forEach(c => {
        if (c.condition) {
          this.evaluateControlCondition(c, capturedData)
        }
      })
    }

    attributeChangedCallback(
      name: string,
      _oldValue: string,
      newValue: string
    ) {
      if (name === 'language' && this.structure) {
        this.updateLang()
      }
      if (name === 'structure' && newValue) {
        this.structure = JSON.parse(newValue)
      }
    }

    updateLang() {
      const shadow = this.shadowRoot
      const s = this.structure
      const l = this.getAttribute('language')
      const fd = new FormData(shadow.querySelector('form'))

      shadow.querySelectorAll('slot').forEach(slot => {
        switch (slot.name) {
          case 'meta-name': {
            slot.textContent = s.translations[l].name
            break
          }
          case 'meta-description': {
            slot.textContent = s.translations[l].description
            break
          }
          case 'category': {
            const catId = slot.getAttribute('id')
            const section = s.sections.find(cat => cat.id === catId)
            slot.textContent = section.translations[l].label
            break
          }
          case 'control': {
            const attrName = slot.getAttribute('attr-name')
            const control = s.controls.find(c => c.name === attrName)
            switch (slot.getAttribute('part')) {
              case 'label': {
                slot.textContent = control.translations[l].label
                if (control.conformance === 'M') {
                  slot.textContent += '*'
                }
                break
              }
              case 'information': {
                slot.textContent = control.translations[l].information
                break
              }
            }
            break
          }
          case 'entry': {
            const attrName = slot.getAttribute('attr-name')
            const control = s.controls.find(c => c.name === attrName)
            const entryCodesMapping: { [_: string]: string } = {}
            if (control.entryCodesMapping) {
              control.entryCodesMapping.forEach(mapping => {
                const splitted = mapping.split(':')
                entryCodesMapping[splitted[1]] = splitted[0]
              })
            }

            const select = document.createElement('select')
            select.setAttribute('name', control.name)
            let currentValues = ((fd.has(attrName)
              ? fd.getAll(attrName)
              : data[control.mapping || attrName]) || []) as string[]
            let currentValue = ((fd.has(attrName)
              ? fd.get(attrName)
              : data[control.mapping || attrName]) || '') as string

            if (Array.isArray(currentValues)) {
              currentValues = currentValues.map(v => entryCodesMapping[v] || v)
            }
            currentValue = entryCodesMapping[currentValue] || currentValue

            if (control.type === 'SelectMultiple') {
              select.setAttribute('multiple', '')
            }
            if (control.conformance === 'M') {
              select.setAttribute('required', '')
            }
            control.entryCodes.forEach(code => {
              const opt = new Option(
                control.translations[l].entries[code],
                code
              )
              if (
                control.type == 'SelectMultiple' &&
                currentValues.includes(code)
              ) {
                opt.setAttribute('selected', '')
              } else if (control.type == 'Select' && currentValue === code) {
                opt.setAttribute('selected', '')
              }
              select.options.add(opt)
            })
            if (currentValues.length === 0 && currentValue === '') {
              select.value = null
            }

            select.classList.add('_input')
            if (control.isFlagged) {
              select.classList.add('flagged')
            }

            slot.innerHTML = ''
            slot.appendChild(select)
            break
          }
        }
      })
    }
  }

  const randomNr = Math.random().toString(16).substring(2)

  customElements.define(`oca-form-${randomNr}`, OCAForm)
  const ocaForm = document.createElement(`oca-form-${randomNr}`)
  ocaForm.setAttribute(
    'structure',
    `{
    "translations": ${JSON.stringify(structure.translations)},
    "controls": ${JSON.stringify(structure.controls)},
    "sections": ${JSON.stringify(structure.sections)}
  }`
  )
  ocaForm.setAttribute('language', defaultLanguage)

  return ocaForm
}

const generateCategory = (
  section: Structure['sections'][0]
): HTMLDivElement => {
  const category = document.createElement('div')
  category.id = section.id

  let level = (section.id.match(/-/g) || []).length
  level = level > 6 ? 6 : level
  const header = document.createElement(`h${level}`)
  header.innerHTML = `<slot name="category" id="${category.id}"></slot>`
  category.appendChild(header)

  return category
}

const generateControlInput = async (
  control: Structure['controls'][0],
  defaultInput: DataValue,
  config: {
    showFlagged?: boolean
    defaultLanguage?: string
    ocaRepoHostUrl?: string
  }
): Promise<HTMLElement> => {
  let input: HTMLElement = document.createElement('input')
  switch (control.type) {
    case 'Text':
      input.classList.add('_input')
      input.setAttribute('type', 'text')
      break
    case 'Numeric':
      input.classList.add('_input')
      input.setAttribute('type', 'number')
      break
    case 'Checkbox':
      input.classList.add('_input')
      input.setAttribute('type', 'checkbox')
      break
    case 'Date':
      input.classList.add('_input')
      input.setAttribute('type', 'date')
      input.setAttribute('placeholder', control.format)
      break
    case 'Select':
    case 'SelectMultiple':
      input = document.createElement('div')
      input.innerHTML = `<slot name="entry" attr-name="${control.name}"></slot>`
      break
    case 'Binary':
      input.classList.add('_input')
      input.setAttribute('type', 'file')
      if (control.format) {
        input.setAttribute('accept', control.format)
      }
      break
    case 'Reference':
      input = await generateOCAForm(
        control.reference,
        (defaultInput as Data) || {},
        config
      )
      input.classList.add('_reference')
      break
  }

  if (defaultInput) {
    input.setAttribute('value', defaultInput as string)
  }
  if (control.conformance === 'M') {
    input.setAttribute('required', '')
  }
  if (control.cardinality) {
    input.id = control.name + '[]'
    input.setAttribute('name', control.name + '[]')
  } else {
    input.id = control.name
    input.setAttribute('name', control.name)
  }
  if (control.isFlagged) {
    input.classList.add('flagged')
  }

  return input
}

const evaluateCondition = (condition: string) => {
  return Function('"use strict";return (' + condition + ')')()
}
