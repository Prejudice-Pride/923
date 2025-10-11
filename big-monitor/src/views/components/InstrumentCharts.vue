<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'

// 占位图表引用
const lineChartRef = ref<HTMLDivElement | null>(null)
const pieChartRef = ref<HTMLDivElement | null>(null)
let lineChart: echarts.ECharts | null = null
let pieChart: echarts.ECharts | null = null

// 初始化空图表
onMounted(async () => {
  await nextTick()
  if (lineChartRef.value) {
    lineChart = echarts.init(lineChartRef.value)
    lineChart.setOption({
      title: { text: '折线图', left: 'center', textStyle: { color: '#00eaff' } },
      tooltip: {},
      xAxis: { type: 'category', data: [], axisLine: { lineStyle: { color: '#00c6ff' } } },
      yAxis: { type: 'value', axisLine: { lineStyle: { color: '#00c6ff' } } },
      series: [{ type: 'line', data: [] }]
    })
  }
  if (pieChartRef.value) {
    pieChart = echarts.init(pieChartRef.value)
    pieChart.setOption({
      title: { text: '饼图', left: 'center', textStyle: { color: '#00eaff' } },
      tooltip: { trigger: 'item' },
      series: [{ type: 'pie', data: [], label: { color: '#00eaff' }, radius: '60%' }]
    })
  }
})
</script>

<template>
  <div class="instrument-charts-wrapper">
    <!-- 上部 a: 测项统计概况 -->
    <div class="chart-card chart-a">
      <div class="chart-title">测项统计概况</div>
      <div class="chart-body chart-a-body">
        <div ref="lineChartRef" class="chart-container"></div>
        <div ref="pieChartRef" class="chart-container"></div>
      </div>
    </div>

    <!-- 下部 b: 测项运行状态 -->
    <div class="chart-card chart-b">
      <div class="chart-title">测项运行状态</div>
      <div class="chart-body chart-b-body">
        <div class="status-item">
          <div class="status-label">正常运行</div>
          <div class="status-number">0</div>
        </div>
        <div class="status-item">
          <div class="status-label">故障</div>
          <div class="status-number">0</div>
        </div>
        <div class="status-item">
          <div class="status-label">异常</div>
          <div class="status-number">0</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.instrument-charts-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

/* 上下比例 3:1 */
.chart-a { flex: 3; }
.chart-b { flex: 1; }

.chart-card {
  display: flex;
  flex-direction: column;
  background: rgba(0, 20, 40, 0.6);
  border: 1px solid rgba(0,198,255,0.12);
  border-radius: 8px;
  box-shadow: 0 0 8px rgba(0,198,255,0.06);
  overflow: hidden;
}

.chart-title {
  padding: 8px 12px;
  font-size: 15px;
  font-weight: bold;
  color: #00eaff;
  border-bottom: 1px solid rgba(0,198,255,0.08);
  background: rgba(0,40,80,0.8);
  text-align: center;
}

.chart-body {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 8px;
}

.chart-a-body {
  flex-direction: column; /* 上下排列 */
}

.chart-b-body {
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
}

.chart-container {
  flex: 1;
  width: 100%;
  height: 100%;
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.status-label {
  font-size: 13px;
  color: #00eaff;
}

.status-number {
  font-size: 28px;
  font-weight: bold;
  color: #00eaff;
  margin-top: 4px;
}
</style>
