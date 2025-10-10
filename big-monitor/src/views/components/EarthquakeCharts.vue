<script setup lang="ts">
import { defineProps, computed, onMounted, watch, ref } from 'vue'
import * as echarts from 'echarts'

interface Earthquake {
  lon: number
  lat: number
  DiMing: string
  mc?: string
  RiQi?: string
}

// 接收父组件传来的 props
const props = defineProps<{ allEarthquakes: Earthquake[] }>()

// ⚡ 创建本地响应式变量，初始为 props.allEarthquakes
const earthquakes = ref(props.allEarthquakes)

// --------- 开发测试用：覆盖为模拟数据 ---------
// 注释掉下面一段即可使用真实数据
earthquakes.value = [
  { lon: 123.4, lat: 41.8, DiMing: "辽宁省抚顺市", mc: "3.2", RiQi: "2025-09-15T10:23:00" },
  { lon: 124.2, lat: 42.1, DiMing: "辽宁省沈阳市", mc: "2.8", RiQi: "2025-09-18T14:50:00" },
  { lon: 124.2, lat: 42.1, DiMing: "辽宁省沈阳市", mc: "1.8", RiQi: "2025-09-18T16:50:00" },
  { lon: 124.2, lat: 42.1, DiMing: "辽宁省沈阳市", mc: "1.2", RiQi: "2025-09-18T19:22:00" },
  { lon: 123.9, lat: 41.9, DiMing: "辽宁省大连市", mc: "3.5", RiQi: "2025-09-20T08:12:00" },
  { lon: 124.1, lat: 41.7, DiMing: "辽宁省鞍山市", mc: "4.1", RiQi: "2025-09-22T16:45:00" },
  { lon: 123.5, lat: 42.0, DiMing: "辽宁省本溪市", mc: "2.5", RiQi: "2025-09-25T09:30:00" },
  { lon: 124.0, lat: 41.85, DiMing: "辽宁省锦州市", mc: "3.8", RiQi: "2025-09-28T11:15:00" }
]

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
    return { value: parseFloat(d.mc || '0'), time: timeLabel }
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

  return {
    tooltip: {
      trigger: 'axis',
      formatter: (p: any) => `${p[0].axisValue}<br/>次数：${p[0].data}`
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
      {
        type: 'bar',
        data: yData,
        itemStyle: { color: '#00eaff' }
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
    const mag = parseFloat(e.mc || '0')
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
  if (filteredData.value.length > 0) {
    chartA = echarts.init(chartARef.value!)
    chartA.setOption(chartAOptions.value)

    chartB = echarts.init(chartBRef.value!)
    chartB.setOption(chartBOptions.value)

    chartC = echarts.init(chartCRef.value!)
    chartC.setOption(chartCOptions.value)
  }
})

watch(filteredData, () => {
  if (filteredData.value.length > 0) {
    chartA && chartA.setOption(chartAOptions.value)
    chartB && chartB.setOption(chartBOptions.value)
    chartC && chartC.setOption(chartCOptions.value)
  } else {
    chartA && chartA.clear()
    chartB && chartB.clear()
    chartC && chartC.clear()
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
