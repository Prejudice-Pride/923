<template>
  <div class="earthquake-table-wrapper">
    <!-- 表格 -->
    <table class="earthquake-table">
      <thead>
        <tr>
          <th class="col-time">地震时间</th>
          <th class="col-place">地震地点</th>
          <th class="col-lon">经度</th>
          <th class="col-lat">纬度</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="quake in earthquakes" :key="quake.key">
          <td class="col-time" :title="formatDate(quake)">{{ formatDate(quake) }}</td>
          <td class="col-place">{{ quake.DiMing }}</td>
          <td class="col-lon">{{ quake.lon }}</td>
          <td class="col-lat">{{ quake.lat }}</td>
        </tr>
      </tbody>
    </table>

    <!-- 分页控件 -->
    <div class="pagination">
      <button :disabled="currentPage === 1" @click="goFirst">首页</button>
      <button :disabled="currentPage === 1" @click="prevPage">上一页</button>

      <span>第 {{ currentPage }} 页 / 共 {{ totalPages }} 页</span>

      <button :disabled="currentPage === totalPages" @click="nextPage">下一页</button>
      <button :disabled="currentPage === totalPages" @click="goLast">末页</button>

      <div class="jump">
        跳转到
        <input type="number" v-model.number="jumpPage" min="1" :max="totalPages" @keyup.enter="goToPage" />
        页
        <button @click="goToPage">确定</button>
      </div>
    </div>

  </div>
</template>
<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

// 后端记录的简化类型
interface BackendEarthquake {
  DiMing?: string
  year?: number | string
  month?: number | string
  day?: number | string
  hour?: number | string
  min?: number | string
  sec?: number | string
  lon?: number | string
  lat?: number | string
  OldId?: string
}

// 前端展示类型
interface Earthquake {
  year: number
  month: number
  day: number
  hour: number
  min: number
  sec: number
  lon: number
  lat: number
  DiMing: string
  key: string
}

// 状态
const earthquakes = ref<Earthquake[]>([])
const currentPage = ref<number>(1)
const pageSize = 10
const totalPages = ref<number>(1)
const totalRecords = ref<number>(0)
const loading = ref<boolean>(false)

// 格式化时间
function formatDate(quake: Earthquake) {
  const y = Number(quake.year)
  const m = String(quake.month).padStart(2, '0')
  const d = String(quake.day).padStart(2, '0')
  const h = String(quake.hour).padStart(2, '0')
  const min = String(quake.min).padStart(2, '0')
  const sec = String(Math.floor(Number(quake.sec))).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}:${sec}`
}


// 后端 -> 前端的映射
function mapBackendToEarthquake(q: BackendEarthquake): Earthquake {
  const year = Number(q.year ?? 0)
  const month = Number(q.month ?? 0)
  const day = Number(q.day ?? 0)
  const hour = Number(q.hour ?? 0)
  const min = Number(q.min ?? 0)
  const sec = Number(q.sec ?? 0)
  const lon = Number(q.lon ?? 0)
  const lat = Number(q.lat ?? 0)
  const DiMing = (q.DiMing ?? '') as string
  const key = q.OldId ?? `${year}-${month}-${day}-${hour}-${min}-${sec}`
  return { year, month, day, hour, min, sec, lon, lat, DiMing, key }
}

// 拉取分页数据（使用 axios 泛型，方便 ts 提示）
async function fetchPage(page: number) {
  loading.value = true
  try {
    const res = await axios.get<{ data: BackendEarthquake[]; total: number }>(
      'http://127.0.0.1:5000/dzml_new/page',
      { params: { page, size: pageSize } }
    )

    const { data, total } = res.data
    totalRecords.value = total
    totalPages.value = Math.max(1, Math.ceil((total || 0) / pageSize))

    earthquakes.value = (data || []).map(mapBackendToEarthquake)
    currentPage.value = page
  } catch (err) {
    console.error('获取地震数据失败', err)
    // 可在此设置全局提示/错误状态
  } finally {
    loading.value = false
  }
}

// 翻页
function prevPage() {
  if (currentPage.value > 1) fetchPage(currentPage.value - 1)
}
function nextPage() {
  if (currentPage.value < totalPages.value) fetchPage(currentPage.value + 1)
}

const jumpPage = ref<number | null>(null) // 输入的跳转页

function goFirst() {
  if (currentPage.value !== 1) {
    fetchPage(1)
  }
}

function goLast() {
  if (currentPage.value !== totalPages.value) {
    fetchPage(totalPages.value)
  }
}

function goToPage() {
  if (!jumpPage.value) return
  let page = Math.max(1, Math.min(totalPages.value, jumpPage.value)) // 限制范围
  fetchPage(page)
  jumpPage.value = null // 清空输入框
}


// 初始加载
onMounted(() => {
  fetchPage(1)
})
</script>

<style scoped>
.earthquake-table-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}

/* 表格整体 */
.earthquake-table {
  width: 100%;
  border-collapse: collapse;
  flex: 1;
  table-layout: fixed;
  /* 固定列宽，避免抖动 */
  font-size: 12px;
  /* 👈 全表格字体缩小 */
  line-height: 1.2;
  /* 行高紧凑 */
}

/* 单元格基础样式 */
.earthquake-table th,
.earthquake-table td {
  border: 1px solid #00c6ff;
  padding: 4px 6px;
  text-align: center;
  color: #00eaff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.earthquake-table th {
  background: rgba(0, 40, 80, 0.8);
  font-weight: bold;
}

/* 列宽控制 */
.earthquake-table th.col-time,
.earthquake-table td.col-time {
  width: 35%;
  font-size: 11px;
  /* 时间列稍微更小 */
}

.earthquake-table th.col-place,
.earthquake-table td.col-place {
  width: 35%;
}

.earthquake-table th.col-lon,
.earthquake-table td.col-lon,
.earthquake-table th.col-lat,
.earthquake-table td.col-lat {
  width: 15%;
}

/* 分页控件 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
  font-size: 12px;
  /* 分页文字也跟表格统一 */
}

.pagination button {
  padding: 4px 12px;
  border: 1px solid #00c6ff;
  background: rgba(0, 20, 40, 0.6);
  color: #00eaff;
  cursor: pointer;
  border-radius: 4px;
  font-size: 12px;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 12px;
  flex-wrap: wrap;
  /* 小屏幕可换行 */
}

.pagination button {
  padding: 4px 10px;
  border: 1px solid #00c6ff;
  background: rgba(0, 20, 40, 0.6);
  color: #00eaff;
  cursor: pointer;
  border-radius: 4px;
  font-size: 12px;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.jump {
  display: flex;
  align-items: center;
  gap: 4px;
}

.jump input {
  width: 50px;
  padding: 2px 4px;
  border: 1px solid #00c6ff;
  background: rgba(0, 20, 40, 0.8);
  color: #00eaff;
  border-radius: 4px;
  font-size: 12px;
  text-align: center;
}
</style>
