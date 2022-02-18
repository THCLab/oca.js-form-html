import type { Structure } from 'oca.js-form-core'
import type { FormLayout } from 'types'
import { JSDOM } from 'jsdom'

const dom = new JSDOM()
let document = dom.window.document

export const generateOCAForm = (
  structure: Structure,
  layout: FormLayout
): HTMLElement => {
  const availableLanguages = Object.keys(structure.translations)
  const defaultLanguage = availableLanguages[0]

  const form = document.createElement('div')
  form.className = 'form'
  // const header = generateHeader(structure.translations)
  // form.appendChild(header)

  layout.rows.forEach(row => {
    const rowDiv = document.createElement('div')
    if (row.config) {
      if (row.config.classes) {
        rowDiv.classList.add(...row.config.classes)
      }
      if (row.config.style) {
        rowDiv.style.cssText = row.config.style
      }
    }

    row.elements.forEach(element => {
      let el: HTMLElement
      switch (element.type) {
        case 'meta':
          switch (element.name) {
            case 'name':
              el = document.createElement('div')
              el.innerText = structure.translations[defaultLanguage].name
              break
            case 'description':
              el = document.createElement('div')
              el.innerText = structure.translations[defaultLanguage].description
              break
            case 'language':
              el = document.createElement('select')
              availableLanguages.forEach(lang => {
                const option = document.createElement('option')
                option.setAttribute('value', lang)
                option.innerText = lang
                el.appendChild(option)
              })
              break
          }
          break
        case 'category': {
          const cat = structure.sections.find(el => el.id == element.name)
          el = generateCategory(cat)
          break
        }
        case 'attribute': {
          const attr = structure.controls.find(el => el.name == element.name)
          el = generateControl(attr, element.layout)
          break
        }
      }
      if (element.style) {
        el.style.cssText = element.style
      }
      if (element.classes) {
        el.classList.add(...element.classes)
      }
      if (rowDiv && el) {
        rowDiv.appendChild(el)
      }
    })
    form.appendChild(rowDiv)
  })

  return form
}

const generateCategory = (
  section: Structure['sections'][0],
  language: string = null
): HTMLElement => {
  const availableLanguages = Object.keys(section.translations)
  const defaultLanguage = language ? language : availableLanguages[0]

  const category = document.createElement('div')
  category.id = section.id

  let level = (section.id.match(/-/g) || []).length
  level = level > 6 ? 6 : level
  const header = document.createElement(`h${level}`)
  header.innerText = section.translations[defaultLanguage].label
  header.innerText = section.translations[defaultLanguage].label
  category.appendChild(header)

  return category
}

const generateControl = (
  control: Structure['controls'][0],
  layout: FormLayout
): HTMLElement => {
  const availableLanguages = Object.keys(control.translations)
  const defaultLanguage = availableLanguages[0]

  const ctrl = document.createElement('div')

  const label = document.createElement('label')
  label.setAttribute('for', control.name)
  label.innerText = control.translations[defaultLanguage].label
  let input: HTMLElement = document.createElement('input')
  switch (control.type) {
    case 'Text':
      input.setAttribute('type', 'text')
      break
    case 'Number':
      input.setAttribute('type', 'number')
      break
    case 'Checkbox':
      input.setAttribute('type', 'checkbox')
      break
    case 'Date':
      input.setAttribute('type', 'date')
      input.setAttribute('placeholder', control.format)
      break
    case 'Select':
      input = document.createElement('select')
      control.entryCodes.forEach(code => {
        const option = document.createElement('option')
        option.value = code
        option.innerText = control.translations[defaultLanguage].entries[code]
        input.appendChild(option)
      })
      break
    case 'SelectMultiple':
      input = document.createElement('select')
      control.entryCodes.forEach(code => {
        const option = document.createElement('option')
        option.value = code
        option.innerText = control.translations[defaultLanguage].entries[code]
        input.appendChild(option)
      })
      input.setAttribute('multiple', '')
      break
    case 'Reference':
      input = generateOCAForm(control.reference, layout)
      break
  }

  input.id = control.name
  input.setAttribute('name', control.name)
  if (control.isPii) {
    input.className = 'pii'
  }

  const information = document.createElement('div')
  information.className = 'information'
  if (control.translations[defaultLanguage].information) {
    information.innerText = control.translations[defaultLanguage].information
  }

  ctrl.appendChild(label)
  ctrl.appendChild(input)
  ctrl.appendChild(information)
  return ctrl
}
