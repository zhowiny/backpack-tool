<script setup>
import { ref } from 'vue'
import {
  useBackpackHelper,
} from '@/utils/backpack.js'
import { sleep } from '@/utils/index.js'

const {
  countState,
  performTradeCycle,
  checkOrderTimeout,
  getTabs,
  getPriceElement,
  getOrderList,
} = useBackpackHelper()

const expand = ref(true)
const running = ref(false)
const tradingParams = ref({
  Buy: 2,
  Sell: 2,
  timeout: 0,
  mode: 'Market',
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
    class="backpack-tool transition grid gap-2 text-sm text-white bg-base-700 p-2 rounded relative pointer-events-auto"
    :class="{ '-translate-y-[90%]': expand }"
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

    <p class="text-xs mt-4 px-2 pt-2 border-t" style="grid-area: b;">
      超时时间：超时自动取消订单，<code>0</code>为不取消！
      <span class="text-gray-500">
        (author: <a class="hover:underline" href="https://x.com/ouyoung11" target="_blank">oooooyoung</a> & <a class="hover:underline" href="https://x.com/zhowiny" target="_blank">zhowiny</a>)
      </span>
    </p>
    <div>当前订单数：{{ currentOrder.length }}</div>
    <div>买入次数：<span style="color: #afa;">{{ countState.buyCount }}</span></div>
    <div>卖出次数：<span style="color: #faf;">{{ countState.sellCount }}</span></div>
    <div>取消次数：<span style="color: #ffa;">{{ countState.cancelCount }}</span></div>
    <div
      class="cursor-pointer rounded-full bg-base-700 text-xs p-2 text-center absolute left-1/2 -translate-x-1/2 -bottom-5"
      @click="expand = !expand"
    >
      {{ expand ? '↓展开' : '↑收起' }}{{ running ? '(运行中...)' : '' }}
    </div>
  </div>
</template>

<style scoped>

</style>
