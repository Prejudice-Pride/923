<script setup lang="ts">
import { ref, onMounted } from 'vue'
import HeaderBar from "./components/HeaderBar.vue"
import EarthquakeMap from "./components/EarthquakeMap.vue"
import EarthquakeTable from "./components/EarthquakeTable.vue"
import EarthquakeCharts from './components/EarthquakeCharts.vue'

// ---------------------------
// ✅ 状态变量定义
// ---------------------------
const earthquakeData = ref([]) // 当前页的地震数据
const provinceName = ref("辽宁") // 默认省份
const page = ref(1)
const size = ref(10)
const total = ref(0)
const loading = ref(false)

// ---------------------------
// ✅ 获取分页地震信息函数
// ---------------------------
async function fetchProvinceEarthquakes() {
  loading.value = true
  try {
    const url = `http://127.0.0.1:5000/dzml_new/province/page?name=${provinceName.value}&page=${page.value}&size=${size.value}`
    const response = await fetch(url)
    const result = await response.json()

    if (response.ok) {
      earthquakeData.value = result.data || []
      total.value = result.total || 0
    } else {
      console.error("请求错误:", result.error)
    }
  } catch (error) {
    console.error("获取地震数据失败:", error)
  } finally {
    loading.value = false
  }
}

// ---------------------------
// ✅ 生命周期：页面挂载时加载数据
// ---------------------------
onMounted(() => {
  fetchProvinceEarthquakes()
})

// ---------------------------
// ✅ 分页切换（可与分页组件绑定）
// ---------------------------
function handlePageChange(newPage: number) {
  page.value = newPage
  fetchProvinceEarthquakes()
}
</script>

<template>
  <div class="app">
    <HeaderBar />
    <dv-decoration-8 style="width:100%;height:4px;" />

    <main class="main-content">
      <!-- 左栏：地震目录 -->
      <div class="column left">
        <div class="card">
          <div class="card-title">
            {{ provinceName }}省地震目录
          </div>
          <div class="card-body">
            <EarthquakeTable :earthquakes="earthquakeData" />
          </div>
        </div>
      </div>

      <!-- 中栏：地图 -->
      <div class="column center">
        <div class="card">
          <div class="card-title">地震分布图</div>
          <div class="card-body">
            <EarthquakeMap :earthquakes="earthquakeData" />
          </div>
        </div>
      </div>

      <!-- 右栏：统计或图表 -->
      <div class="column right">
        <div class="card">
          <div class="card-title">统计分析</div>
          <div class="card-body">
            <EarthquakeCharts :earthquakes="earthquakeData" />
          </div>
        </div>
      </div>
    </main>

    <!-- ✅ 简易分页组件（可替换为 ElementPlus 等 UI 框架） -->
    <div v-if="total > size" class="pagination">
      <button :disabled="page === 1" @click="handlePageChange(page - 1)">上一页</button>
      <span>第 {{ page }} / {{ Math.ceil(total / size) }} 页</span>
      <button :disabled="page * size >= total" @click="handlePageChange(page + 1)">下一页</button>
    </div>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: radial-gradient(circle at center, #001a33, #000c1a);
  color: #fff;
  overflow: hidden;
}

/* 主体布局同前 */
.main-content {
  display: flex;
  flex: 1;
  gap: 12px;
  padding: 12px;
  box-sizing: border-box;
  align-items: stretch;
}

.column.left,
.column.right {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.column.center {
  flex: 2;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  min-height: 0;
}

.card {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(0, 20, 40, 0.6);
  border: 1px solid rgba(0,198,255,0.12);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 0 12px rgba(0, 198, 255, 0.06);
}

.card-title {
  padding: 8px 12px;
  font-size: 16px;
  font-weight: bold;
  color: #00eaff;
  border-bottom: 1px solid rgba(0,198,255,0.08);
  background: rgba(0, 40, 80, 0.8);
  text-align: center;
}

.card-body {
  flex: 1;
  overflow: hidden;
}

/* ✅ 分页样式 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 12px;
  font-size: 14px;
  background: rgba(0, 20, 40, 0.4);
  border-top: 1px solid rgba(0,198,255,0.12);
}

.pagination button {
  background: rgba(0, 60, 100, 0.4);
  border: 1px solid rgba(0,198,255,0.3);
  color: #00eaff;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}
.pagination button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
