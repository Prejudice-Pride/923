
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import HeaderBar from "./components/HeaderBar.vue"
import InstrumentTable from './components/instrumentTable.vue'
import InstrumentMap from './components/InstrumentMap.vue'
import InstrumentCharts from './components/InstrumentCharts.vue'
import { userProvinceStore } from '@/stores/usersProvinceStore'


// ---------------------------
// ✅ 状态变量
// ---------------------------
const allInstruments = ref([]) // 全部数据
const loading = ref(false)

// ---------------------------
// ✅ 获取省份信息
// ---------------------------
const provinceStore = userProvinceStore()
const provinceName = computed(() => provinceStore.name)

// ---------------------------
// ✅ 获取全部仪器信息函数
// ---------------------------
async function fetchAllInstruments() {
  loading.value = true
  try {
    const url = `http://127.0.0.1:5000/instrument/all`
    const response = await fetch(url)
    const result = await response.json()

    if (response.ok) {
      allInstruments.value = result.data || []
      console.log(`✅ 已获取 ${provinceName.value} 省全部仪器数据，共 ${allInstruments.value.length} 条`)
    } else {
      console.error("请求错误:", result.error)
    }
  } catch (error) {
    console.error("获取全部仪器数据失败:", error)
  } finally {
    loading.value = false
  }
}

// ---------------------------
// ✅ 生命周期：页面挂载时加载数据
// ---------------------------
onMounted(() => {
  fetchAllInstruments()
})
</script>

<template>
  <div class="app">
    <HeaderBar />
    <dv-decoration-8 style="width:100%;height:4px;" />

    <main class="main-content">
      <!-- 左栏：仪器目录（显示全部数据） -->
      <div class="column left">
        <div class="card">
          <div class="card-title">
            {{ provinceName }}省测项目录
          </div>
          <div class="card-body">
            <InstrumentTable :instruments="allInstruments" />
          </div>
        </div>
      </div>

      <!-- 中栏：地图 -->
      <div class="column center">
        <div class="card">
          <div class="card-title">地球物理测点分布图</div>
          <div class="card-body">
            <InstrumentMap :allInstruments="allInstruments" />
          </div>
        </div>
      </div>

      <!-- 右栏：统计或图表 -->
      <div class="column right">
        <div class="card">
          <div class="card-body">
            <InstrumentCharts :allInstruments="allInstruments" />>
          </div>
        </div>
      </div>
    </main>
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
  border: 1px solid rgba(0, 198, 255, 0.12);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 0 12px rgba(0, 198, 255, 0.06);
}

.card-title {
  padding: 8px 12px;
  font-size: 16px;
  font-weight: bold;
  color: #00eaff;
  border-bottom: 1px solid rgba(0, 198, 255, 0.08);
  background: rgba(0, 40, 80, 0.8);
  text-align: center;
}

.card-body {
  flex: 1;
  overflow: hidden;
}
</style>
