import type { Structure } from 'oca.js-form-core'
import type { FormLayout } from 'types'

let document: Document

if (typeof window === 'undefined') {
  /* eslint-disable */
  const { JSDOM } = require('jsdom')
  const dom = new JSDOM()
  document = dom.window.document
} else {
  document = window.document
}

export const generateOCAForm = (
  structure: Structure,
  data: { [key: string]: any },
  config: {
    showPii?: boolean
    defaultLanguage?: string
    onSubmitHandler?: (capturedData: { [key: string]: any }) => void
  },
  layout: FormLayout
): HTMLElement => {
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

  layout.elements.forEach(element => {
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

        element.parts.forEach(part => {
          let partEl: HTMLElement
          switch (part.name) {
            case 'label':
              partEl = document.createElement('label')
              partEl.classList.add('_label')
              partEl.setAttribute('for', attr.name)
              partEl.innerHTML = `<slot name="control" part="label" attr-name="${attr.name}"></slot>`
              break
            case 'input':
              if (attr.type === 'Select' || attr.type === 'SelectMultiple') {
                partEl = generateControlInput(attr, data[attr.name])
              } else {
                partEl = document.createElement('div')
                partEl.style.cssText += 'display: flex; align-items: center;'
                const inputEl = generateControlInput(attr, data[attr.name])
                partEl.appendChild(inputEl)
                if (attr.isPii) {
                  inputEl.style.cssText += 'display: inline-block;'
                  const showPiiEl = document.createElement('input')
                  showPiiEl.type = 'checkbox'
                  if (config.showPii) {
                    showPiiEl.setAttribute('checked', '')
                  }
                  showPiiEl.style.cssText += 'display: inline-block;'
                  showPiiEl.classList.add('pii-toggle')
                  partEl.appendChild(showPiiEl)
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
          elementEl.appendChild(partEl)
        })
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

    form.appendChild(elementEl)
  })

  const submit = document.createElement('input')
  submit.id = 'submit'
  submit.type = 'submit'
  form.appendChild(submit)

  class OCAForm extends HTMLElement {
    structure: null | {
      translations: Structure['translations']
      controls: Structure['controls']
      sections: Structure['sections']
    }

    static get observedAttributes() {
      return ['language', 'structure']
    }

    constructor() {
      super()
      this.structure = null
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
      shadow.querySelectorAll('.pii-toggle').forEach(el => {
        const toggle = (el: Element) => {
          const inputEl: any = el.parentElement.querySelector('._input')
          const control = structure.controls.find(c => c.name === inputEl.name)
          inputEl.type =
            inputEl.type === 'password'
              ? control.type === 'Binary'
                ? 'file'
                : control.type
              : 'password'
        }
        if (!config.showPii) {
          toggle(el)
        }
        // @ts-ignore
        el.onchange = e => {
          toggle(e.target)
        }
      })
      const formEl = shadow.querySelector('form')
      formEl.onsubmit = e => {
        if (config.onSubmitHandler) {
          config.onSubmitHandler(
            this.captureFormData(e.target as HTMLFormElement)
          )
        }
        return false
      }
    }

    captureFormData(form: HTMLFormElement) {
      const capturedData: { [k: string]: any } = {}
      const formData = new FormData(form)
      this.structure.controls.forEach(c => {
        capturedData[c.name] = ''
        switch (c.type) {
          case 'SelectMultiple':
            capturedData[c.name] = formData.getAll(c.name)
            break
          case 'Binary':
            const file = formData.get(c.name) as Blob
            if (file.size > 0) {
              const reader = new FileReader()
              reader.readAsDataURL(file)
              reader.onload = () => {
                capturedData[c.name] = reader.result
              }
            }
            break
          default:
            capturedData[c.name] = formData.get(c.name) || ''
            break
        }
      })

      return capturedData
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

            const select = document.createElement('select')
            select.setAttribute('name', control.name)
            const currentValues: string[] =
              (fd.has(attrName) ? fd.getAll(attrName) : data[attrName]) || []
            const currentValue =
              (fd.has(attrName) ? fd.get(attrName) : data[attrName]) || ''
            if (control.type === 'SelectMultiple') {
              select.setAttribute('multiple', '')
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
            if (control.isPii) {
              select.classList.add('pii')
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

const generateControlInput = (
  control: Structure['controls'][0],
  defaultInput: string
): HTMLElement => {
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
      // input = generateOCAForm(control.reference, layout)
      break
  }

  if (defaultInput) {
    input.setAttribute('value', defaultInput)
  }
  input.id = control.name
  input.setAttribute('name', control.name)
  if (control.isPii) {
    input.classList.add('pii')
  }

  return input
}
