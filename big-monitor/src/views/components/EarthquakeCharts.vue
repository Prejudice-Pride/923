<script setup lang="ts">
import { defineProps, computed, onMounted, watch, ref, nextTick } from 'vue'
import * as echarts from 'echarts'

interface Earthquake {
  lon: number
  lat: number
  DiMing: string
  mc: number
  RiQi: string
}

// 接收父组件传来的 props（后端原始数组，字段可能命名与前端不同）
const props = defineProps<{ allEarthquakes: any[] }>()

// 标准化后端数据：确保每条记录都有 lon/lat/DiMing/mc/RiQi 字段，并将 mc 转为 number
const earthquakes = computed<Earthquake[]>(() => {
  return (props.allEarthquakes || []).map((e: any) => {
    const lon = e.lon ?? e.JingDu ?? e.JingDuString ?? e.longitude ?? null
    const lat = e.lat ?? e.WeiDu ?? e.WeiDuString ?? e.latitude ?? null
    const mcVal = e.mc ?? e.ZhenJiZhi ?? e.mag1 ?? e.ZhenJiZhi ?? null
    return {
      lon: lon != null ? Number(lon) : 0,
      lat: lat != null ? Number(lat) : 0,
      DiMing: e.DiMing ?? e.DiZhenWei ?? '' ,
      mc: mcVal != null ? Number(mcVal) : 0,
      RiQi: e.RiQi ?? e.RiQiString ?? e.RiQiText ?? ''
    }
  })
})

// --------------------------
// 最近30天的地震数据
// --------------------------
const filteredData = computed(() => {
  const now = new Date()
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  return earthquakes.value.filter(e => {
    if (!e.RiQi) return false
    const date = new Date(e.RiQi)
    return date >= monthAgo && date <= now
  })
})

// --------------------------
// 图表A：MT图
// --------------------------
const chartARef = ref<HTMLDivElement | null>(null)
let chartA: echarts.ECharts | null = null
const chartAOptions = computed(() => {
  const data = filteredData.value.map(d => {
    const date = d.RiQi ? new Date(d.RiQi) : null
    const timeLabel = date ? `${date.getMonth() + 1}/${date.getDate()}` : '未知'
    return { value: Number(d.mc ?? 0), time: timeLabel }
  })

  return {
    tooltip: {
      trigger: 'item',
      formatter: (p: any) => {
        if (!p || !p.data) return ''
        return `时间：${p.data.time}<br/>震级：${p.data.value}`
      }
    },
    grid: { top: 10, left: 50, right: 20, bottom: 50 },
    xAxis: {
      type: 'category',
      name: '时间（月/日）',
      nameLocation: 'middle',
      nameGap: 35,
      nameTextStyle: { color: '#00eaff', fontSize: 12 },
      data: data.map(d => d.time),
      axisLabel: { color: '#00eaff', fontSize: 10, rotate: 45 },
      axisLine: { lineStyle: { color: '#00c6ff' } }
    },
    yAxis: {
      type: 'value',
      name: '震级',
      nameLocation: 'middle',
      nameGap: 25,
      nameTextStyle: { color: '#00eaff', fontSize: 12 },
      axisLabel: { color: '#00eaff' },
      axisLine: { lineStyle: { color: '#00c6ff' } },
      splitLine: { lineStyle: { color: 'rgba(0,198,255,0.1)' } }
    },
    series: [
      {
        type: 'line',
        data: data, // 注意这里直接传对象数组
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#00eaff', width: 2 },
        itemStyle: { color: '#00eaff' }
      }
    ]
  }
})


// --------------------------
// 图表B：地震频度图
// --------------------------
const chartBRef = ref<HTMLDivElement | null>(null)
let chartB: echarts.ECharts | null = null

const chartBOptions = computed(() => {
  const now = new Date()
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const dayCounts: Record<string, number> = {}
  for (let d = new Date(monthAgo); d <= now; d.setDate(d.getDate() + 1)) {
    const key = `${d.getMonth() + 1}/${d.getDate()}`
    dayCounts[key] = 0
  }

  filteredData.value.forEach(e => {
    if (!e.RiQi) return
    const date = new Date(e.RiQi)
    const key = `${date.getMonth() + 1}/${date.getDate()}`
    if (key in dayCounts) dayCounts[key] += 1
  })

  const xData = Object.keys(dayCounts)
  const yData = Object.values(dayCounts)

  // 转换为 [x, y] 结构
  const scatterData = xData.map((x, i) => [x, yData[i]])

  return {
    tooltip: {
      trigger: 'item',
      formatter: (p: any) => {
        if (!p || !p.data) return ''
        const [date, count] = p.data
        return `日期：${date}<br/>次数：${count}`
      }
    },
    grid: { top: 10, left: 50, right: 20, bottom: 50 },
    xAxis: {
      type: 'category',
      name: '日期（月/日）',
      nameLocation: 'middle',
      nameGap: 35,
      nameTextStyle: { color: '#00eaff', fontSize: 12 },
      data: xData,
      axisLabel: { color: '#00eaff', fontSize: 10, rotate: 45 },
      axisLine: { lineStyle: { color: '#00c6ff' } }
    },
    yAxis: {
      type: 'value',
      name: '次数',
      nameLocation: 'middle',
      nameGap: 25,
      nameTextStyle: { color: '#00eaff', fontSize: 12 },
      axisLabel: { color: '#00eaff' },
      axisLine: { lineStyle: { color: '#00c6ff' } },
      splitLine: { lineStyle: { color: 'rgba(0,198,255,0.1)' } }
    },
    series: [
      // 垂直线（每个点的线）
      {
        type: 'line',
        data: scatterData.map(([x, y]) => [x, y]),
        lineStyle: { color: 'rgba(0,234,255,0.4)', width: 1 },
        showSymbol: false,
        smooth: false,
        step: false
      },
      // 散点
      {
        type: 'scatter',
        data: scatterData,
        symbolSize: (val: any) => Math.max(6, val[1] * 2),
        itemStyle: { color: '#00eaff' },
        emphasis: {
          scale: 1.5
        }
      }
    ]
  }
})




// --------------------------
// 图表C：震级分布图
// --------------------------
const chartCRef = ref<HTMLDivElement | null>(null)
let chartC: echarts.ECharts | null = null

const chartCOptions = computed(() => {
  const bins = [0, 1, 2, 3, 4, 5, 6, 7]
  const counts = Array(bins.length).fill(0)

  filteredData.value.forEach(e => {
    const mag = Number(e.mc ?? 0)
    for (let i = 0; i < bins.length; i++) {
      if (i === bins.length - 1) {
        if (mag >= bins[i]) counts[i] += 1
      } else {
        if (mag >= bins[i] && mag < bins[i + 1]) counts[i] += 1
      }
    }
  })

  const xData = bins.map((v, i) =>
    i === bins.length - 1 ? `${v}+` : `${v}~${bins[i + 1]}`
  )

  return {
    tooltip: {
      trigger: 'axis',
      formatter: (p: any) => `${p[0].axisValue}<br/>震级：${p[0].data}`
    },
    grid: { top: 10, left: 50, right: 20, bottom: 50 },
    xAxis: {
      type: 'category',
      name: '震级区间',
      nameLocation: 'middle',
      nameGap: 35,
      nameTextStyle: { color: '#00eaff', fontSize: 12 },
      data: xData,
      axisLabel: { color: '#00eaff', fontSize: 10 },
      axisLine: { lineStyle: { color: '#00c6ff' } }
    },
    yAxis: {
      type: 'value',
      name: '震级',
      nameLocation: 'middle',
      nameGap: 25,
      nameTextStyle: { color: '#00eaff', fontSize: 12 },
      axisLabel: { color: '#00eaff' },
      axisLine: { lineStyle: { color: '#00c6ff' } },
      splitLine: { lineStyle: { color: 'rgba(0,198,255,0.1)' } }
    },
    series: [
      {
        type: 'bar',
        data: counts,
        itemStyle: { color: '#00eaff' }
      }
    ]
  }
})

// --------------------------
// 初始化图表
// --------------------------
onMounted(() => {
  // 如果组件挂载时已经有数据，立即初始化图表；否则交由 watcher 在数据到达后初始化
  if (filteredData.value.length > 0) {
    if (chartARef.value) {
      chartA = echarts.init(chartARef.value!)
      chartA.setOption(chartAOptions.value)
    }
    if (chartBRef.value) {
      chartB = echarts.init(chartBRef.value!)
      chartB.setOption(chartBOptions.value)
    }
    if (chartCRef.value) {
      chartC = echarts.init(chartCRef.value!)
      chartC.setOption(chartCOptions.value)
    }
  }
})

watch(filteredData, async () => {
  // 等待 DOM 更新，以确保 chartXRef 在切换 v-if 后可用
  await nextTick()

  if (filteredData.value.length > 0) {
    // Chart A
    if (!chartA && chartARef.value) {
      chartA = echarts.init(chartARef.value!)
    }
    if (chartA) chartA.setOption(chartAOptions.value)

    // Chart B
    if (!chartB && chartBRef.value) {
      chartB = echarts.init(chartBRef.value!)
    }
    if (chartB) chartB.setOption(chartBOptions.value)

    // Chart C
    if (!chartC && chartCRef.value) {
      chartC = echarts.init(chartCRef.value!)
    }
    if (chartC) chartC.setOption(chartCOptions.value)
  } else {
    // 无数据时清空（如果已初始化）
    if (chartA) chartA.clear()
    if (chartB) chartB.clear()
    if (chartC) chartC.clear()
  }
})
</script>

<template>
  <div class="charts-wrapper">
    <!-- 图表A：MT图 -->
    <div class="chart-card">
      <div class="chart-title">MT图</div>
      <div class="chart-body">
        <div v-if="filteredData.length === 0" class="chart-placeholder">
          <p>近一个月无地震记录</p>
        </div>
        <div v-else ref="chartARef" class="chart-container"></div>
      </div>
    </div>

    <!-- 图表B：地震频度图 -->
    <div class="chart-card">
      <div class="chart-title">地震频度图</div>
      <div class="chart-body">
        <div v-if="filteredData.length === 0" class="chart-placeholder">
          <p>近一个月无地震记录</p>
        </div>
        <div v-else ref="chartBRef" class="chart-container"></div>
      </div>
    </div>

    <!-- 图表C：震级分布图 -->
    <div class="chart-card">
      <div class="chart-title">震级分布图</div>
      <div class="chart-body">
        <div v-if="filteredData.length === 0" class="chart-placeholder">
          <p>近一个月无地震记录</p>
        </div>
        <div v-else ref="chartCRef" class="chart-container"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.charts-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  overflow-y: auto;
  padding: 8px;
  box-sizing: border-box;
}

.chart-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(0, 20, 40, 0.6);
  border: 1px solid rgba(0, 198, 255, 0.12);
  border-radius: 8px;
  box-shadow: 0 0 8px rgba(0, 198, 255, 0.06);
  overflow: hidden;
  min-height: 220px;
}

.chart-title {
  padding: 8px 12px;
  font-size: 15px;
  font-weight: bold;
  color: #00eaff;
  border-bottom: 1px solid rgba(0, 198, 255, 0.08);
  background: rgba(0, 40, 80, 0.8);
  text-align: center;
}

.chart-body {
  flex: 1;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.chart-container {
  width: 95%;
  height: 95%;
}

.chart-placeholder {
  border: 1px dashed rgba(0, 198, 255, 0.3);
  border-radius: 6px;
  padding: 12px;
  text-align: center;
  width: 90%;
  height: 80%;
  color: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
