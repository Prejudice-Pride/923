<template>
  <div class="earthquake-table-wrapper">
    <!-- 表格 -->
    <div class="table-container">
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
    </div>

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

      <div class="table-toolbar">
        <button class="sort-btn" @click="toggleSortOrder">
          时间排序：{{ sortOrder === 'asc' ? '正序 ↑' : '倒序 ↓' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { defineProps, ref, computed } from 'vue';

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

// ✅ 接收全部数据
const props = defineProps<{ earthquakes: Earthquake[] }>();

// 分页状态
const currentPage = ref(1);
const pageSize = 20;
const jumpPage = ref<number | null>(null);

// 排序状态
const sortOrder = ref<'asc' | 'desc'>('desc');

// -------------------
// ✅ 排序计算属性
// -------------------
const sortedEarthquakes = computed(() => {
  return [...props.earthquakes].sort((a, b) => {
    const timeA = new Date(a.year, a.month - 1, a.day, a.hour, a.min, a.sec).getTime();
    const timeB = new Date(b.year, b.month - 1, b.day, b.hour, b.min, b.sec).getTime();
    return sortOrder.value === 'asc' ? timeA - timeB : timeB - timeA;
  });
});

// -------------------
// ✅ 当前页数据
// -------------------
const totalPages = computed(() => Math.ceil(sortedEarthquakes.value.length / pageSize));

const paginatedEarthquakes = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return sortedEarthquakes.value.slice(start, start + pageSize);
});

// -------------------
// ✅ 分页方法
// -------------------
function goToFirstPage() { currentPage.value = 1; }
function goToPreviousPage() { if (currentPage.value > 1) currentPage.value--; }
function goToNextPage() { if (currentPage.value < totalPages.value) currentPage.value++; }
function goToLastPage() { currentPage.value = totalPages.value; }
function goToPage() {
  if (jumpPage.value) {
    const page = Math.max(1, Math.min(totalPages.value, jumpPage.value));
    currentPage.value = page;
    jumpPage.value = null;
  }
}

// -------------------
// ✅ 排序按钮方法
// -------------------
function toggleSortOrder() {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
}

// -------------------
// ✅ 时间格式化
// -------------------
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
.earthquake-table-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
  height: 100%;
}

.table-toolbar {
  display: flex;
  justify-content: flex-end;
  padding: 4px 0;
}

.sort-btn {
  padding: 4px 10px;
  border: 1px solid #00c6ff;
  background: rgba(0, 40, 80, 0.8);
  color: #00eaff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.sort-btn:hover {
  background: rgba(0, 80, 120, 0.9);
  box-shadow: 0 0 6px rgba(0, 198, 255, 0.5);
}

.table-container {
  flex: 1;
  overflow-y: auto;
  border: 1px solid rgba(0, 198, 255, 0.2);
  border-radius: 6px;
}

.earthquake-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  line-height: 1.4;
}

.earthquake-table th,
.earthquake-table td {
  border: 1px solid rgba(0, 198, 255, 0.4);
  padding: 6px 8px;
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

.col-time {
  width: 35%;
  font-size: 11px;
}

.col-place {
  width: 35%;
}

.col-lon,
.col-lat {
  width: 15%;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 12px;
  flex-wrap: wrap;
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

.pagination button:hover:not(:disabled) {
  background: rgba(0, 60, 100, 0.8);
  box-shadow: 0 0 6px rgba(0, 198, 255, 0.4);
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
