import type { Structure } from 'oca.js-form-core'
import type { CredentialLayout } from 'types'
import { gridCss } from 'grid'

export const generateOCACredential = (
  structure: Structure,
  data: { [key: string]: string },
  config: { dataVaultUrl?: string },
  layout: CredentialLayout
): HTMLElement => {
  const iframe = document.createElement('iframe')
  iframe.id = 'credential'
  iframe.style.cssText = 'width: 100%; height: 100%; border: none;'
  iframe.scrolling = 'no'
  const iframeHead = document.createElement('head')
  if (layout.config.css && layout.config.css.style) {
    const iframeStyle = document.createElement('style')
    iframeStyle.innerText = layout.config.css.style + iframeStyle.innerText
    iframeHead.appendChild(iframeStyle)
  }
  const iframeGridStyle = document.createElement('style')
  iframeGridStyle.innerText = gridCss
  iframeHead.appendChild(iframeGridStyle)
  if (layout.classes) {
    const classesStyle = document.createElement('style')
    Object.entries(layout.classes).forEach(
      ([name, classDefinition]: [string, { style: string }]) => {
        classesStyle.innerHTML += `.${name}{${classDefinition.style}}`
      }
    )
    iframeHead.appendChild(classesStyle)
  }
  const iframeBody = document.createElement('body')
  iframeBody.style.cssText = 'margin: 0;'

  const availableLanguages = Object.keys(structure.translations)
  const languageSelect = document.createElement('select')
  languageSelect.id = 'language-select'
  availableLanguages.forEach(lang => {
    const option = document.createElement('option')
    option.setAttribute('value', lang)
    option.innerText = lang
    languageSelect.appendChild(option)
  })
  iframeBody.appendChild(languageSelect)

  const credentials: HTMLElement[] = []
  availableLanguages.forEach((language, i) => {
    const credential = document.createElement('div')
    credential.className = 'credential'
    credential.id = language
    if (i != 0) {
      credential.style.display = 'none'
    } else {
      credential.style.display = 'inline-block'
    }

    if (layout.pages.length > 1) {
      const pageSelect = document.createElement('select')
      pageSelect.className = 'page-select'
      layout.pages.forEach((page, i) => {
        const option = document.createElement('option')
        option.setAttribute('value', 'page-' + i)
        option.innerText = page.config.name
        pageSelect.appendChild(option)
      })
      credential.appendChild(pageSelect)
    }

    layout.pages.forEach((page, i) => {
      const pageDiv = document.createElement('div')
      pageDiv.className = 'page'
      pageDiv.classList.add('page-' + i)
      if (page.config && page.config.css) {
        if (page.config.css.style) {
          pageDiv.style.cssText = page.config.css.style
        }

        if (page.config.css.background_image) {
          const imageSAI = page.config.css.background_image.replace('SAI:', '')
          pageDiv.style.cssText += `background-image: url("${config.dataVaultUrl}/${imageSAI}");`
        }
      }
      if (i != 0) {
        pageDiv.style.display = 'none'
      } else {
        pageDiv.style.display = 'inline-block'
      }

      const renderElement = (
        element: CredentialLayout['pages'][0]['elements'][0]
      ) => {
        let el: HTMLElement
        switch (element.type) {
          case 'row':
            el = document.createElement('div')
            el.className = 'row'
            if (element.elements) {
              element.elements.forEach(e => el.appendChild(renderElement(e)))
            }
            break
          case 'col':
            el = document.createElement('div')
            el.className = element.size ? `col-${element.size}` : 'col'
            if (element.elements && element.elements.length > 0) {
              element.elements.forEach(e => el.appendChild(renderElement(e)))
            }
            break
          case 'layout-label':
            el = document.createElement('div')
            el.innerText = layout.labels[element.name][language]
            break
          case 'text':
            el = document.createElement('div')
            el.innerText = element.content
            break
          case 'meta':
            switch (element.part) {
              case 'name':
                el = document.createElement('div')
                el.innerText = structure.translations[language].name
                break
              case 'description':
                el = document.createElement('div')
                el.innerText = structure.translations[language].description
                break
            }
            break
          case 'attribute': {
            const attr = structure.controls.find(el => el.name == element.name)
            if (attr.type == 'Binary') {
              el = document.createElement('img')
              if (data[element.name]) {
                (el as HTMLImageElement).src = data[element.name]
              }
            } else if (attr.type == 'Select') {
              el = document.createElement('div')
              if (attr.translations[language].entries && data[element.name]) {
                el.innerText =
                  attr.translations[language].entries[data[element.name]]
              }
            } else {
              el = document.createElement('div')
              if (data[element.name]) {
                el.innerText = data[element.name]
              }
            }
            break
          }
          case 'code':
            el = document.createElement('div')
            if (data[element.name]) {
              el.innerText = data[element.name]
            }
            break
          case 'label': {
            const attr = structure.controls.find(el => el.name == element.name)
            el = document.createElement('div')
            el.innerText = attr.translations[language].label
            break
          }
          case 'information': {
            const attr = structure.controls.find(el => el.name == element.name)
            el = document.createElement('div')
            el.innerText = attr.translations[language].information
            break
          }
        }

        if (element.config && element.config.css) {
          if (element.config.css.style) {
            el.style.cssText = element.config.css.style
          }
          if (element.config.css.classes) {
            el.classList.add(...element.config.css.classes)
          }
        }

        return el
      }

      page.elements.forEach(element => {
        const el = renderElement(element)

        if (pageDiv && el) {
          pageDiv.appendChild(el)
        }
      })

      credential.appendChild(pageDiv)
    })

    credentials.push(credential)
  })

  credentials.forEach(credential => iframeBody.appendChild(credential))

  const languageScript = document.createElement('script')
  languageScript.innerText = `let currentPage = 'page-0'; document.getElementById('language-select').addEventListener('change', e => { [...document.getElementsByClassName('credential')].forEach(el => el.style.display = 'none'); document.getElementById(e.target.value).style.display = 'inline-block'; [...document.getElementsByClassName('page-select')].forEach(s => s.value = currentPage )})`
  iframeBody.appendChild(languageScript)

  if (layout.pages.length > 1) {
    const pageScript = document.createElement('script')
    pageScript.innerText = `[...document.getElementsByClassName('page-select')].forEach(s => s.addEventListener('change', e => { currentPage = e.target.value; [...document.getElementsByClassName('page')].forEach(el => el.style.display = 'none'); [...document.getElementsByClassName(e.target.value)].forEach(el => el.style.display = 'inline-block') } ))`
    iframeBody.appendChild(pageScript)
  }

  iframe.src =
    'data:text/html;charset=utf-8,' +
    encodeURI(iframeHead.outerHTML) +
    encodeURI(iframeBody.outerHTML)
  return iframe
}
