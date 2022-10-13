import { expect } from 'chai'
const oca = require('./assets/oca.json')
import { OcaJs } from 'oca.js-form-core'
import { renderOCAForm } from '../src'

describe('#renderOCAForm()', () => {
  it('handles cardinality properly', async () => {
    const ocaJs = new OcaJs({})
    const structure = await ocaJs.createStructure(oca)
    const form = await renderOCAForm(structure, {}, {})

    const div = document.createElement('div')
    div.innerHTML = form
    document.body.appendChild(div)
    const ocaForm = div.firstElementChild.shadowRoot
    let controls = Array.from(ocaForm.querySelectorAll('._control'))

    expect(controls.length).to.eq(1)
    expect(controls[0].querySelector('._label > slot').innerHTML).to.eq('Name:')
    expect(controls[0].querySelector('._information > slot').innerHTML).to.eq(
      'Provide your name'
    )

    const cardinalityManager = ocaForm.querySelector(
      '._cardinality-manager\\[name\\]'
    )
    const addButton: HTMLButtonElement =
      cardinalityManager.querySelector('button[t="add"]')

    await Promise.resolve().then(async () => {
      addButton.click()
      addButton.click()
    })
    controls = Array.from(ocaForm.querySelectorAll('._control'))
    expect(controls.length).to.eq(3)
    expect(addButton.style.display).to.eq('none')

    const removeButtons: HTMLButtonElement[] = Array.from(
      cardinalityManager.querySelectorAll('button[t="remove"]')
    )

    await Promise.resolve().then(async () => {
      removeButtons[0].click()
    })
    controls = Array.from(ocaForm.querySelectorAll('._control'))
    expect(controls.length).to.eq(2)
    expect(addButton.style.display).to.eq('block')
  })
})
