<script setup>
import { ref } from 'vue'
import {
  useBackpackHelper,
} from '@/utils/backpack.js'
import { sleep } from '@/utils/index.js'

const {
  countState,
  performTradeCycle,
} = useBackpackHelper()

const expand = ref(true)
const running = ref(false)
const tradingParams = ref({
  Buy: 2,
  Sell: 2,
  interval: 5,
  mode: 'Market',
  random: false,
  type: 'long',
})

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

async function handleStart() {
  window.running = running.value = !running.value
  console.log(running.value ? 'start' : 'stop')

  running.value && await startTrading()
}
</script>

<template>
  <div
    class="backpack-tool bg-page border !border-buy transition grid gap-2 text-sm text-white p-2 rounded relative pointer-events-auto"
    :class="{ '-translate-y-[90%]': expand }"
    style="grid-template-areas: 'a a . .' 'a a . .' 'a a . .' 'a a . .' 'b b b b' '. . . .';"
  >
    <button
      class="border !border-buy text-buy rounded-full p-2 h-12 self-center bg-primary-gradient text-button-primary" style="grid-area: a;"
      :class="{ 'bg-redText': running }"
      @click="handleStart"
    >
      {{ running ? '脚本运行中,点击关闭交易' : '启动脚本,点击开始交易' }}
    </button>
    <label>
      <span class="opacity-30">限价：</span>
      <input v-model="tradingParams.mode" type="radio" value="Limit" :disabled="true">
    </label>
    <label>
      <span>市场：</span>
      <input v-model="tradingParams.mode" type="radio" value="Market" :disabled="false">
    </label>

    <label>
      <span :class="{ 'opacity-30': tradingParams.random }">开多：</span>
      <input v-model="tradingParams.type" type="radio" value="long" :disabled="running || tradingParams.random">
    </label>
    <label>
      <span :class="{ 'opacity-30': tradingParams.random }">开空：</span>
      <input v-model="tradingParams.type" type="radio" value="short" :disabled="running || tradingParams.random">
    </label>

    <span>随机开多/空:</span>
    <input v-model="tradingParams.random" class="self-start" type="checkbox" :disabled="running">

    <span>间隔时间(秒):</span>
    <input
      v-model.number="tradingParams.interval" class="w-12 h-2 py-2 text-center bg-black text-accentBlue"
      :class="{ 'bg-black/25': running }" type="number" :min="0" :max="600" :step="1"
      :disabled="running"
      @input="e => handleNumberInput(e, 'interval', { min: 0, max: 600 })"
    >

    <p class="mt-4 px-2 pt-2 border-t" style="grid-area: b;">
      间隔时间：开单,关单的间隔时间
    </p>
    <div>开多次数：<span style="color: #afa;">{{ countState.longCount }}</span></div>
    <div>开空次数：<span style="color: #faf;">{{ countState.shortCount }}</span></div>
    <div>买入次数：<span class="text-body-positive">{{ countState.buyCount }}</span></div>
    <div>卖出次数：<span class="text-body-negative">{{ countState.sellCount }}</span></div>
    <div
      class="cursor-pointer bg-cube border-b !border-buy rounded-full bg-base-700 text-xs px-2 py-1 text-center absolute left-1/2 -translate-x-1/2 -bottom-5"
      @click="expand = !expand"
    >
      {{ expand ? '↓展开' : '↑收起' }}{{ running ? '(运行中...)' : '' }}
    </div>
  </div>
</template>

<style scoped>

</style>
