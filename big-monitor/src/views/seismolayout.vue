<script setup lang="ts">
import EarthquakeMap from "./components/EarthquakeMap.vue"
import EarthquakeTable from "./components/EarthquakeTable.vue"
import { ref } from "vue"

const navItems = ref([
  { label: "地震活动监控页面", active: true },
  { label: "地球物理观测监控", active: false },
  { label: "地震学技术方法可视化", active: false },
  { label: "数据产品服务", active: false },
])

function activate(idx: number) {
  navItems.value.forEach((item, i) => (item.active = i === idx))
}
</script>

<template>
  <div class="app">
    <!-- 横幅 -->
    <header class="banner">
      <div class="banner-left">
        <h1 class="page-title">地震活动监控页面</h1>
        <dv-decoration-5 style="width:180px;height:30px;" />
      </div>
      <div class="nav-bar">
        <div
          v-for="(item, idx) in navItems"
          :key="idx"
          :class="['nav-btn', { active: item.active }]"
          @click="activate(idx)"
        >
          {{ item.label }}
        </div>
      </div>
      <div class="banner-right"></div>
    </header>

    <dv-decoration-8 style="width:100%;height:4px;" />

    <!-- 主体三列 -->
    <main class="main-content">
      <div class="column left">
        <div class="card">
          <div class="card-title">地震目录</div>
          <div class="card-body">
            <!-- 注意用 kebab-case -->
            <earthquake-table />
          </div>
        </div>
      </div>

      <div class="column center">
        <div class="card">
          <div class="card-title">地震分布图</div>
          <div class="card-body">
            <earthquake-map />
          </div>
        </div>
      </div>

      <div class="column right">
        <div class="card">
          <div class="card-title">右侧面板</div>
          <div class="card-body">
            这里可以放置图例、筛选条件、说明等。
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* 全局 app 样式 */
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #001428;
  color: #fff;
  margin: 0; /* 去掉默认白边 */
  padding: 0;
}

/* banner */
.banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
}

.banner-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: 20px;
  font-weight: bold;
  color: #00eaff;
}

.nav-bar {
  display: flex;
  gap: 12px;
}

.nav-btn {
  padding: 4px 12px;
  cursor: pointer;
  border-radius: 4px;
  background: rgba(0, 40, 80, 0.6);
}

.nav-btn.active {
  background: #00c6ff;
  color: #001428;
}

/* 主体三列 */
.main-content {
  display: flex;
  gap: 12px;
  padding: 12px;
  flex: 1; /* 占满剩余高度 */
  overflow: hidden;
}

.column {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.column.left {
  flex: 1;
}

.column.center {
  flex: 2;
}

.column.right {
  flex: 1;
}

/* 卡片样式 */
.card {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(0, 20, 40, 0.6);
  border: 1px solid #00c6ff;
  border-radius: 8px;
  overflow: hidden;
  min-height: 300px;
}

.card-title {
  padding: 8px 12px;
  font-size: 16px;
  font-weight: bold;
  color: #00eaff;
  border-bottom: 1px solid #00c6ff;
  background: rgba(0, 40, 80, 0.8);

  /* 居中样式 */
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-body {
  flex: 1;
  display: flex;
  position: relative;
}

.card-body > * {
  flex: 1;
  min-height: 0; /* <-- 必加：允许子容器内部滚动 */
}


/* Map 容器 */
.map-wrapper {
  flex: 1;
  display: flex;
  min-height: 500px;
}

.map-wrapper > * {
  flex: 1;
}
</style>
