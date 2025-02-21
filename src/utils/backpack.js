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
    longCount: 0,
    shortCount: 0,
  })

  function getPriceCnt() {
    return document.querySelector('.flex.flex-col.no-scrollbar.h-full.flex-1.snap-mandatory.overflow-y-auto.font-sans')
  }
  function getPriceElement(type, num) {
    const isBuy = type === 'Buy'
    const priceCnt = getPriceCnt()
    return priceCnt.querySelector(`& > div:${isBuy ? 'last' : 'first'}-child > div > div:nth-child(${num}) button div`)
  }

  function setPrice(type, num) {
    const price = getPriceElement(type, num)
    price.classList.add('border')
    price.click()
  }

  function clickTradeButton(type) {
    const element = getElement(type, 'div', document.querySelector('form'))
    if (!element)
      return
    triggerEvent('click', element)

    if (type === 'Buy') {
      countState.value.buyCount++
      console.log(`%c第${countState.value.buyCount}次买入`, 'color: #afa;')
    }
    else {
      countState.value.sellCount++
      console.log(`%c第${countState.value.sellCount}次卖出`, 'color: #faf;')
    }
  }

  async function randomWaitFn(fn, ms) {
    await fn()
    await sleep(ms || getRandomWait(MIN_WAIT_MS, MAX_WAIT_MS))
  }

  async function executeTrade(type, params) {
    if (!window.running)
      return console.log('已暂停')
    await randomWaitFn(
      () => triggerEvent('mousedown', getElement('Market', 'button')),
    )
    await randomWaitFn(() => clickElementByText(type, 'div'))
    // await randomWaitFn(() => clickElementByText(params.mode === 'Market' ? 'MKT' : 'Limit', 'div'))
    // await randomWaitFn(() => setPrice(type, params[type]), 300)
    await randomWaitFn(() => clickElementByText('100%', 'span'))

    await randomWaitFn(() => clickTradeButton(type))
  }

  async function performTradeCycle(params) {
    try {
      if (params.random)
        Math.random() > 0.5 ? await openLong() : await openShort()
      else
        params.type === 'long' ? await openLong() : await openShort()
    }
    catch (error) {
      console.error('发生错误:', error)
    }

    async function openLong() {
      countState.value.longCount++
      console.log(`%c---------第(${countState.value.longCount})次开多-----------`, 'color: #4caf50;')
      await executeTrade('Buy', params)
      params.interval > 0 && await sleep(params.interval * 1000)
      await executeTrade('Sell', params)
      console.log(`%c---------第(${countState.value.longCount})次开多结束-----------`, 'color: #4caf50;')
    }
    async function openShort() {
      countState.value.shortCount++
      console.log(`%c---------第(${countState.value.shortCount})次开空-----------`, 'color: #e53e3e;')
      await executeTrade('Sell', params)
      params.interval > 0 && await sleep(params.interval * 1000)
      await executeTrade('Buy', params)
      console.log(`%c---------第(${countState.value.shortCount})次开空结束-----------`, 'color: #e53e3e;')
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
    const anchorElement = findElementsByText('My Assets', 'div')[0]
    const tabsElement = anchorElement.parentElement.parentElement

    const openOrderTab = tabsElement.children[0]
    return {
      openOrderTab,
      tabsElement,
    }
  }
  const getOrderListElement = tabsElement => tabsElement.parentElement.nextElementSibling.querySelector('tbody')

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
        cancel: () => findElementsByText('Cancel', 'p', ele)[0].click(),
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
