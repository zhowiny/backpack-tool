export const LANG_MAP = {
  Limit: '限价',
  Market: '市价',
  Max: '最大',
  Buy: '购买',
  Sell: '出售',
  Cancel: '取消',
  Balances: '余额',
}

export const MIN_WAIT_MS = 300
export const MAX_WAIT_MS = 2000

export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
export const getRandomWait = (min, max) => Math.floor(Math.random() * max + min)

export function findElementsByText(text, tag, parent = document) {
  const elements = parent.querySelectorAll(`${tag}:not(:empty):not(:has(*))`)
  return Array.from(elements).filter(ele => ele.textContent === text || ele.textContent === LANG_MAP[text])
}

export function getElement(text, tag) {
  let element = findElementsByText(text, tag)[0]
  if (!element) {
    element = findElementsByText(LANG_MAP[text] || text, tag)[0]
    if (!element)
      return
  }
  return element
}

export function clickElementByText(text, tag) {
  const element = getElement(text, tag)
  if (!element || !window.running)
    return
  triggerEvent(element)
}

export function triggerEvent(
  element,
  type = 'click',
  position = ({ x, width, y, height }) => ({
    x: x + (width * 0.5),
    y: y + (height * 0.5),
  }),
) {
  if (!element) {
    console.warn('missing element')
    return
  }
  const domRect = element.getBoundingClientRect()
  let x = domRect.x
  let y = domRect.y
  if (typeof position === 'function') {
    const pos = position(domRect)
    x = pos.x
    y = pos.y
  }
  else if (typeof position === 'object' && Object.keys(position).includes('x')) {
    x = position.x
    y = position.y
  }
  const evt = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
  })
  element.dispatchEvent(evt)
}
