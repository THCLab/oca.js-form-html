import type { Structure } from 'oca.js-form-core'

export const renderOCAForm = function (structure: Structure): string {
  console.log(structure)
  return generateOCAForm(structure).outerHTML
}

const generateOCAForm = (structure: Structure): HTMLElement => {
  const form = document.createElement('div')
  form.className = 'form'
  const header = generateHeader(structure.translations)

  const content = document.createElement('div')
  content.className = 'form__content'

  structure.sections.forEach(section => {
    content.appendChild(generateCategory(section))
  })

  form.appendChild(header)
  form.appendChild(content)

  return form
}

const generateHeader = (
  translations: Structure['translations']
): HTMLElement => {
  const availableLanguages = Object.keys(translations)
  const defaultLanguage = availableLanguages[0]

  const header = document.createElement('div')
  header.className = 'form__header'

  const title = document.createElement('div')
  title.className = 'form__header__title'
  title.innerText = translations[defaultLanguage].name
  const language = document.createElement('select')
  language.className = 'form__header__language'
  availableLanguages.forEach(lang => {
    const option = document.createElement('option')
    option.setAttribute('value', lang)
    option.innerText = lang
    language.appendChild(option)
  })
  const description = document.createElement('div')
  description.className = 'form__header__description'
  description.innerText = translations[defaultLanguage].description

  header.appendChild(title)
  header.appendChild(language)
  header.appendChild(description)

  return header
}

const generateCategory = (section: Structure['sections'][0]): HTMLElement => {
  const availableLanguages = Object.keys(section.translations)
  const defaultLanguage = availableLanguages[0]

  const category = document.createElement('div')
  category.className = 'form__content__category'
  category.id = section.id

  let level = (section.id.match(/-/g) || []).length
  level = level > 6 ? 6 : level
  const header = document.createElement(`h${level}`)
  header.className = 'form__content__category__header'
  header.innerText = section.translations[defaultLanguage].label
  category.appendChild(header)

  section.controls.forEach(control => {
    category.appendChild(generateControl(control))
  })
  section.subsections.forEach(subsection => {
    category.appendChild(generateCategory(subsection))
  })

  return category
}

const generateControl = (
  control: Structure['sections'][0]['controls'][0]
): HTMLElement => {
  const availableLanguages = Object.keys(control.translations)
  const defaultLanguage = availableLanguages[0]

  const ctrl = document.createElement('div')
  ctrl.className = 'form__content__category__control'

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
      input = generateOCAForm(control.reference)
      break
  }

  input.id = control.name
  input.setAttribute('name', control.name)
  if (control.isPii) {
    input.className = 'pii'
  }

  const information = document.createElement('div')
  information.className = 'form__content__category__control__information'
  if (control.translations[defaultLanguage].information) {
    information.innerText = control.translations[defaultLanguage].information
  }

  ctrl.appendChild(label)
  ctrl.appendChild(input)
  ctrl.appendChild(information)
  return ctrl
}
