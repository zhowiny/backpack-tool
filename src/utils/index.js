export const LANG_MAP = {
  Limit: 'Limit',
  Market: 'Market',
  Max: '最大',
  Buy: 'Buy/Long',
  Sell: 'Sell/Short',
  Cancel: '取消',
}

export const MIN_WAIT_MS = 300
export const MAX_WAIT_MS = 1000

export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
export const getRandomWait = (min, max) => Math.floor(Math.random() * max + min)

export function findElementsByText(text, tag, parent = document) {
  const elements = parent.querySelectorAll(`${tag}:not(:empty):not(:has(*))`)
  return Array.from(elements).filter(ele => ele.textContent === text || ele.textContent === LANG_MAP[text])
}

export function getElement(text, tag, parent = document) {
  let element = findElementsByText(text, tag, parent)[0]
  if (!element) {
    element = findElementsByText(LANG_MAP[text] || text, tag, parent)[0]
    if (!element)
      return
  }
  return element
}

export function clickElementByText(text, tag) {
  const element = getElement(text, tag)
  if (!element || !window.running)
    return
  triggerEvent('click', element)
}

export function triggerEvent(type = 'click', element) {
  if (!element) {
    console.warn('missing element')
    return
  }
  const domRect = element.getBoundingClientRect()
  const x = domRect.x + (domRect.width / 2)
  const y = domRect.y + (domRect.height / 2)
  const evt = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
  })
  element.dispatchEvent(evt)
}
