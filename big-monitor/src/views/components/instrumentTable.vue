<template>
  <div class="instrument-table-wrapper">
    <!-- 表格 -->
    <div class="table-container">
      <table class="instrument-table">
        <thead>
          <tr>
            <th>所属台站</th>
            <th>仪器类型</th>
            <th>经度</th>
            <th>纬度</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="instr in paginatedInstruments" :key="instr.id">
            <td>{{ instr.region }}</td>
            <td>{{ instr.type }}</td>
            <td>{{ instr.lon }}</td>
            <td>{{ instr.lat }}</td>
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
    </div>
  </div>
</template>

<script lang="ts" setup>
import { defineProps, ref, computed } from 'vue';

interface Instrument {
  id: number;
  region: string;
  type: string;
  lon: number;
  lat: number;
}

const props = defineProps<{ instruments: Instrument[] }>();

// 分页状态
const currentPage = ref(1);
const pageSize = 20;
const jumpPage = ref<number | null>(null);

// 计算分页数据
const totalPages = computed(() => Math.ceil(props.instruments.length / pageSize));
const paginatedInstruments = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return props.instruments.slice(start, start + pageSize);
});

// 分页方法
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
</script>

<style scoped>
.instrument-table-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
}

.table-container {
  flex: 1;
  overflow-y: auto;
  border: 1px solid rgba(0, 198, 255, 0.2);
  border-radius: 6px;
}

.instrument-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  line-height: 1.4;
}

.instrument-table th,
.instrument-table td {
  border: 1px solid rgba(0, 198, 255, 0.4);
  padding: 6px 8px;
  text-align: center;
  color: #00eaff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.instrument-table th {
  background: rgba(0, 40, 80, 0.8);
  font-weight: bold;
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
