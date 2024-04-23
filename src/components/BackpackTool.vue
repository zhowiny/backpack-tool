<script setup>
import { ref } from 'vue'

const LANG_MAP = {
  Limit: '限制',
  Market: '市场',
  Max: '最大',
  Buy: '购买',
  Sell: '出售',
  Cancel: '取消',
}

const MIN_WAIT_MS = 300
const MAX_WAIT_MS = 1000
const MIN_SWITCH_MS = 500
const MAX_SWITCH_MS = 2000

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const getRandomWait = (min, max) => Math.floor(Math.random() * max + min)

function findElementsByText(text, tag, parent = document) {
  const elements = parent.querySelectorAll(`${tag}:not(:empty):not(:has(*))`)
  return Array.from(elements).filter(ele => ele.textContent === text || ele.textContent === LANG_MAP[text])
}

function getElement(text, tag) {
  let element = findElementsByText(text, tag)[0]
  if (!element) {
    element = findElementsByText(LANG_MAP[text] || text, tag)[0]
    if (!element)
      return
  }
  return element
}

async function clickElementByText(text, tag) {
  const element = getElement(text, tag)
  if (!element || !window.running)
    return
  element.click()
  await sleep(getRandomWait(MIN_WAIT_MS, MAX_WAIT_MS))
}

function getPriceCnt() {
  return document.querySelector('.flex.flex-col.no-scrollbar.h-full.flex-1.snap-mandatory.overflow-y-auto.font-sans')
}
function getPriceElement(type, num) {
  const isBuy = type === 'Buy'
  const priceCnt = getPriceCnt()
  return priceCnt.querySelector(`& > div:${isBuy ? 'last' : 'first'}-child > div > div:nth-child(${num}) button div`)
}

async function setPrice(type, num) {
  const price = getPriceElement(type, num)
  price.classList.add('border')
  price.click()
  await sleep(300)
}

let buyCount = 0
let sellCount = 0
let cancelCount = 0
async function clickTradeButton(type) {
  const element = getElement(type, 'button')
  if (!element)
    return
  element.addEventListener('click', () => {
    if (type === 'Buy') {
      buyCount++
      console.log(`%c第${buyCount}次买入`, 'color: #afa;')
    }
    else {
      sellCount++
      console.log(`%c第${sellCount}次卖出`, 'color: #faf;')
    }
  }, { once: true })
  element.click()
  await sleep(getRandomWait(MIN_WAIT_MS, MAX_WAIT_MS))
}

async function executeTrade(type, params) {
  if (!window.running)
    return console.log('已暂停')
  await clickElementByText(type, 'p')
  await clickElementByText(params.mode || 'Limit', 'div')
  await setPrice(type, params[type])
  await clickElementByText('Max', 'div')
  // await clickElementByText(type, "button");
  await clickTradeButton(type)
}

async function performTradeCycle(params) {
  try {
    await executeTrade('Buy', params)
    await sleep(getRandomWait(MIN_SWITCH_MS, MAX_SWITCH_MS))
    await executeTrade('Sell', params)
    await sleep(getRandomWait(MIN_SWITCH_MS, MAX_SWITCH_MS))
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
      cancelCount++
      console.log(`%c订单【${order.orderText}】超时未成交，已取消！订单取消次数：${cancelCount}`, 'color: #ffa;')
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

const running = ref(false)
const tradingParams = ref({
  Buy: 2,
  Sell: 2,
  timeout: 0,
  mode: 'Market',
})
const orderCount = ref({
  buy: 0,
  sell: 0,
  cancel: 0,
})
const currentOrder = ref([])

function handleNumberInput(e, type, options = { min: 1, max: 20 }) {
  const { min, max } = options
  let value = Number.parseInt(e.target.value)
  if (value > max)
    value = max
  if (value < min || Number.isNaN(value))
    value = min
  tradingParams.value[type] = Math.max(min, Math.min(max, value))
}

async function startTrading() {
  await performTradeCycle(tradingParams.value)
  orderCount.value.buy = buyCount
  orderCount.value.sell = sellCount
  await sleep(3000)
  if (running.value)
    window.requestAnimationFrame(() => startTrading())
}
async function queryOrderListTask() {
  const { openOrderTab } = getTabs()
  openOrderTab.click()
  await sleep(300)
  const orderList = getOrderList(tradingParams.value)
  currentOrder.value = orderList
  checkOrderTimeout(orderList)
  orderCount.value.cancel = cancelCount
  await sleep(2000)
  if (running.value)
    window.requestAnimationFrame(() => queryOrderListTask())
}

async function handleStart() {
  window.running = running.value = !running.value
  console.log(running.value ? 'start' : 'stop')

  running.value && await startTrading()

  running.value && await queryOrderListTask()

  !running.value && getPriceElement('Buy', tradingParams.value.Buy).classList.remove('border')
  !running.value && getPriceElement('Sell', tradingParams.value.Sell).classList.remove('border')
}
</script>

<template>
  <div
    class="backpack-tool grid gap-2 text-sm text-white bg-base-700 p-2 rounded"
    style="grid-template-areas: 'a a . .' 'a a . .' 'a a . .' 'a a . .' 'b b b b' '. . . .';"
  >
    <button
      class="bg-greenText rounded p-2 h-12 self-center" style="grid-area: a;"
      :class="{ 'bg-redText': running }"
      @click="handleStart"
    >
      {{ running ? '脚本运行中,点击关闭交易' : '启动脚本,点击开始交易' }}
    </button>
    <label>
      <span>限价：</span>
      <input v-model="tradingParams.mode" type="radio" value="Limit" :disabled="running">
    </label>
    <label>
      <span>市场：</span>
      <input v-model="tradingParams.mode" type="radio" value="Market" :disabled="running">
    </label>

    <span :class="{ 'opacity-10': tradingParams.mode === 'Market' }">第几个买入:</span>
    <input
      v-model.number="tradingParams.Buy"
      class="w-12 h-2 py-2 text-center bg-black text-greenText"
      :class="{ 'bg-black/25': running, 'opacity-10': tradingParams.mode === 'Market' }" type="number" :min="1" :max="20" :step="1"
      :disabled="running || tradingParams.mode === 'Market'"
      @input="e => handleNumberInput(e, 'Buy')"
    >
    <span :class="{ 'opacity-10': tradingParams.mode === 'Market' }">第几个卖出:</span>
    <input
      v-model.number="tradingParams.Sell"
      class="w-12 h-2 py-2 text-center bg-black text-redText"
      :class="{ 'bg-black/25': running, 'opacity-10': tradingParams.mode === 'Market' }" type="number" :min="1" :max="20" :step="1"
      :disabled="running || tradingParams.mode === 'Market'"
      @input="e => handleNumberInput(e, 'Sell')"
    >
    <span>超时时间(秒):</span>
    <input
      v-model.number="tradingParams.timeout" class="w-12 h-2 py-2 text-center bg-black text-accentBlue"
      :class="{ 'bg-black/25': running }" type="number" :min="0" :max="600" :step="1"
      :disabled="running"
      @input="e => handleNumberInput(e, 'timeout', { min: 0, max: 600 })"
    >

    <p class="mt-4 px-2 pt-2 border-t" style="grid-area: b;">
      超时时间：超时自动取消订单，<code>0</code>为不取消！
    </p>
    <div>当前订单数：{{ currentOrder.length }}</div>
    <div>买入次数：<span style="color: #afa;">{{ orderCount.buy }}</span></div>
    <div>卖出次数：<span style="color: #faf;">{{ orderCount.sell }}</span></div>
    <div>取消次数：<span style="color: #ffa;">{{ orderCount.cancel }}</span></div>
  </div>
</template>

<style scoped>

</style>
