export const LANG_MAP = {
  Limit: '限制',
  Market: '市场',
  Max: '最大',
  Buy: '购买',
  Sell: '出售',
  Cancel: '取消',
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
  element.click()
}
