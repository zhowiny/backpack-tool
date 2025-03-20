import { ref } from 'vue'
import {
  MAX_WAIT_MS,
  MIN_WAIT_MS,
  clickElementByText,
  findElementsByText,
  getElement,
  getRandomWait,
  sleep,
  triggerEvent,
} from '@/utils/index.js'

export function useBackpackHelper() {
  const countState = ref({
    buyCount: 0,
    sellCount: 0,
    cancelCount: 0,
  })

  function getPriceCnt() {
    return document.querySelector('.flex.flex-col.no-scrollbar.h-full.flex-1.overflow-y-auto.font-sans')
  }
  function getPriceElement(type, num) {
    const isBuy = type === 'Buy'
    const priceCnt = getPriceCnt()
    return priceCnt.querySelector(`& > div:${isBuy ? 'last' : 'first'}-child > div > div:nth-child(${num}) button div > div:nth-child(3)`)
  }

  function setPrice(type, num) {
    const price = getPriceElement(type, num)
    price.classList.add('border')
    price.click()
  }

  async function setQuantity(percent = 0) {
    const slider = document.querySelector('div[aria-label="Percentage Slider"] > div.h-1')
    const calcPosition = ({ x, width, y, height }) => ({
      x: x + width * percent,
      y: y + height * 0.5,
    })
    triggerEvent(slider, 'mousedown', calcPosition)
    await sleep(50)
    triggerEvent(slider, 'mouseup', calcPosition)
  }

  function clickTradeButton(type) {
    const button = document.querySelector('div.flex ~ button[data-rac].text-center.h-12')
    const element = getElement(type, 'div', button)
    if (!element || button.disabled)
      return
    button.addEventListener('click', () => {
      if (type === 'Buy') {
        countState.value.buyCount++
        console.log(`%c第${countState.value.buyCount}次买入`, 'color: #afa;')
      }
      else {
        countState.value.sellCount++
        console.log(`%c第${countState.value.sellCount}次卖出`, 'color: #faf;')
      }
    }, { once: true })
    triggerEvent(element)
  }

  async function randomWaitFn(fn, ms) {
    await fn()
    await sleep(ms || getRandomWait(MIN_WAIT_MS, MAX_WAIT_MS))
  }

  async function executeTrade(type, params) {
    if (!window.running)
      return console.log('已暂停')
    await randomWaitFn(() => clickElementByText(type, 'button'))
    await randomWaitFn(() => clickElementByText(params.mode || 'Limit', 'div'))
    if (params.mode === 'Market')
      await randomWaitFn(() => setPrice(type, params[type]), 300)

    await randomWaitFn(() => setQuantity(0), 300)
    await randomWaitFn(() => setQuantity(1))
    await randomWaitFn(() => clickTradeButton(type))
  }

  async function performTradeCycle(params) {
    try {
      await executeTrade('Buy', params)
      await sleep(3000)
      await executeTrade('Sell', params)
    }
    catch (error) {
      console.error('发生错误:', error)
    }
  }

  const orderTimeoutMap = new Map()

  function checkOrderTimeout(orderList) {
    orderList.forEach((order) => {
      const timeoutTime = orderTimeoutMap.get(order.orderText)
      if (!timeoutTime)
        return
      if (Date.now() > timeoutTime) {
        order.cancel()
        orderTimeoutMap.delete(order.orderText)
        countState.value.cancelCount++
        console.log(`%c订单【${order.orderText}】超时未成交，已取消！订单取消次数：${countState.value.cancelCount}`, 'color: #ffa;')
      }
    })
  }

  function getTabs() {
    const anchorElement = findElementsByText('Balances', 'div')[0]
    const tabsElement = anchorElement.parentElement

    const openOrderTab = tabsElement.children[3]
    return {
      openOrderTab,
      tabsElement,
    }
  }
  const getOrderListElement = tabsElement => tabsElement.parentElement.parentElement.nextElementSibling.querySelector('tbody')

  function getOrderList(tradingParams) {
    const element = getOrderListElement(getTabs().tabsElement)
    const { timeout = 0 } = tradingParams

    return [...(element?.children ?? [])].reduce((res, ele) => {
      const orderText = ele.textContent
      if (orderText.includes('No open Orders'))
        return []

      const order = {
        orderText,
        ele,
        cancel: () => findElementsByText('Cancel', 'button', ele)[0].click(),
        data: ele.textContent.split('\n').filter(i => i),
      }

      res.push(order)
      const timeoutTime = timeout ? orderTimeoutMap.get(orderText) || (Date.now() + timeout * 1000) : 0
      orderTimeoutMap.set(orderText, timeoutTime)
      return res
    }, [])
  }

  return {
    countState,
    getPriceElement,
    performTradeCycle,
    checkOrderTimeout,
    getTabs,
    getOrderList,
  }
}
