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
        <tr v-for="quake in paginatedEarthquakes" :key="quake.key">
          <td class="col-time" :title="formatDate(quake)">{{ formatDate(quake) }}</td>
          <td class="col-place">{{ quake.DiMing }}</td>
          <td class="col-lon">{{ quake.lon }}</td>
          <td class="col-lat">{{ quake.lat }}</td>
        </tr>
      </tbody>
    </table>

    <!-- 分页控件 -->
    <div class="pagination">
      <button :disabled="currentPage === 1" @click="goToFirstPage">首页</button>
      <button :disabled="currentPage === 1" @click="goToPreviousPage">上一页</button>

      <span>第 {{ currentPage }} 页 / 共 {{ totalPages }} 页</span>

      <button :disabled="currentPage === totalPages" @click="goToNextPage">下一页</button>
      <button :disabled="currentPage === totalPages" @click="goToLastPage">尾页</button>

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
import { defineProps, ref, computed, onMounted } from 'vue';

// 定义 Earthquake 类型
interface Earthquake {
  year: number;
  month: number;
  day: number;
  hour: number;
  min: number;
  sec: number;
  lon: number;
  lat: number;
  DiMing: string;
  key: string;
}

const props = defineProps<{ earthquakes: Earthquake[] }>();

// 分页状态
const currentPage = ref(1);
const pageSize = 10;
const totalPages = computed(() => Math.ceil(props.earthquakes.length / pageSize));
const jumpPage = ref<number | null>(null);

// 计算当前页显示的数据
const paginatedEarthquakes = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return props.earthquakes.slice(start, start + pageSize);
});

// 分页方法
function goToFirstPage() {
  currentPage.value = 1;
}

function goToPreviousPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}

function goToNextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
}

function goToLastPage() {
  currentPage.value = totalPages.value;
}

function goToPage() {
  if (jumpPage.value) {
    const page = Math.max(1, Math.min(totalPages.value, jumpPage.value));
    currentPage.value = page;
    jumpPage.value = null;
  }
}

onMounted(() => {
  console.log('Received earthquakes data:', props.earthquakes);
});

function formatDate(quake: Earthquake) {
  const y = quake.year
  const m = String(quake.month).padStart(2, '0')
  const d = String(quake.day).padStart(2, '0')
  const h = String(quake.hour).padStart(2, '0')
  const min = String(quake.min).padStart(2, '0')
  const sec = String(Math.floor(quake.sec)).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}:${sec}`
}

</script>

<style scoped>
/* 原有样式保持不变 */
</style>

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
