import type { Structure } from 'oca.js-form-core'
import type { CredentialLayout } from './types'
import { gridCss } from './grid'

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
  const iframeStyle = document.createElement('style')
  iframeStyle.innerText = gridCss
  iframeHead.appendChild(iframeStyle)
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
      if (page.config) {
        if (page.config.style) {
          pageDiv.style.cssText = page.config.style
        }

        if (page.config.background_image) {
          const imageSAI = page.config.background_image.replace('SAI:', '')
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
          case 'content':
            el = document.createElement('div')
            el.innerText = element.text
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
            switch (element.part) {
              case 'data':
                el = document.createElement('div')
                if (data[element.name]) {
                  el.innerText = data[element.name]
                }
                break
              case 'label':
                el = document.createElement('div')
                el.innerText = attr.translations[language].label
                break
              case 'information':
                el = document.createElement('div')
                el.innerText = attr.translations[language].information
                break
            }
            break
          }
        }

        if (element.config) {
          if (element.config.style) {
            el.style.cssText = element.config.style
          }
          if (element.config.classes) {
            el.classList.add(...element.config.classes)
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