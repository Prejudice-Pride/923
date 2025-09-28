<template>
  <div class="earthquake-table-wrapper">
    <!-- 表格 -->
    <table class="earthquake-table">
      <thead>
        <tr>
          <th>地震时间</th>
          <th>地震地点</th>
          <th>经度</th>
          <th>纬度</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="quake in earthquakes" :key="quake.key">
          <td>{{ formatDate(quake) }}</td>
          <td>{{ quake.DiMing }}</td>
          <td>{{ quake.lon }}</td>
          <td>{{ quake.lat }}</td>
        </tr>
      </tbody>
    </table>

    <!-- 分页控件 -->
    <div class="pagination">
      <button :disabled="currentPage === 1" @click="prevPage">上一页</button>
      <span>第 {{ currentPage }} 页 / 共 {{ totalPages }} 页</span>
      <button :disabled="currentPage === totalPages" @click="nextPage">下一页</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

// 定义地震数据类型
interface Earthquake {
  year: number
  month: number
  day: number
  hour: number
  min: number
  sec: number
  lon: number | string
  lat: number | string
  DiMing: string
  key: string
}

// 数据和分页状态
const allEarthquakes = ref<Earthquake[]>([]) // 存放所有数据
const earthquakes = ref<Earthquake[]>([])    // 当前页显示的数据
const currentPage = ref(1)
const pageSize = 10
const totalPages = ref(1)

// 格式化时间
function formatDate(quake: Earthquake) {
  const y = Number(quake.year)
  const m = String(quake.month).padStart(2,'0')
  const d = String(quake.day).padStart(2,'0')
  const h = String(quake.hour).padStart(2,'0')
  const min = String(quake.min).padStart(2,'0')
  const sec = Number(quake.sec).toFixed(3)
  return `${y}-${m}-${d} ${h}:${min}:${sec}`
}

// 获取所有数据
async function fetchAllData() {
  try {
    const res = await axios.get('/dzml_new/all') // 正确后端路径
    const data = res.data.data as any[]
    allEarthquakes.value = data.map(q => ({
      ...q,
      key: `${q.year}-${q.month}-${q.day}-${q.hour}-${q.min}-${q.sec}`,
      lon: Number(q.lon),
      lat: Number(q.lat),
      sec: Number(q.sec)
    }))
    totalPages.value = Math.ceil(allEarthquakes.value.length / pageSize)
    updatePage()
  } catch (err) {
    console.error('获取地震数据失败', err)
  }
}

// 更新当前页数据
function updatePage() {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  earthquakes.value = allEarthquakes.value.slice(start, end)
}

// 分页操作
function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
    updatePage()
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    updatePage()
  }
}

// 初始化加载
onMounted(() => {
  fetchAllData()
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

.earthquake-table {
  width: 100%;
  border-collapse: collapse;
  flex: 1;
}

.earthquake-table th,
.earthquake-table td {
  border: 1px solid #00c6ff;
  padding: 6px 8px;
  text-align: center;
  color: #00eaff;
}

.earthquake-table th {
  background: rgba(0, 40, 80, 0.8);
  font-weight: bold;
}

/* 分页控件 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
}

.pagination button {
  padding: 4px 12px;
  border: 1px solid #00c6ff;
  background: rgba(0, 20, 40, 0.6);
  color: #00eaff;
  cursor: pointer;
  border-radius: 4px;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
