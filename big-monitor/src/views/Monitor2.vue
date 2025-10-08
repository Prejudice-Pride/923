<script setup lang="ts">
import HeaderBar from "./components/HeaderBar.vue";
import EarthquakeMap from "./components/EarthquakeMap.vue";
import EarthquakeTable from "./components/EarthquakeTable.vue";
</script>

<template>
  <div class="app">
    <!-- ✅ 引入独立的顶部栏 -->
    <HeaderBar />

    <dv-decoration-8 style="width:100%;height:4px;" />

    <!-- 主体三栏保持不变 -->
    <main class="main-content">
      <div class="column left">
        <div class="card">
          <div class="card-title">台站目录</div>
          <div class="card-body">
            <earthquake-table />
          </div>
        </div>
      </div>

      <div class="column center">
        <div class="card">
          <div class="card-title">台站分布图</div>
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
/* 页面整体 */
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: radial-gradient(circle at center, #001a33, #000c1a);
  color: #fff;
  overflow: hidden;
}

/* header 三栏 */
.banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 40px;
  height: 110px;
  background: linear-gradient(to bottom, rgba(0, 25, 60, 0.95), rgba(0, 10, 25, 0.9));
  border-bottom: 2px solid rgba(0, 198, 255, 0.12);
  box-sizing: border-box;
}

/* 左右固定宽度，保证中间居中 */
.side {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 340px; /* 根据需要调整 */
  box-sizing: border-box;
}

.center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* nav-border（DataV） */
.nav-border {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  width: 100%;
  box-sizing: border-box;
}

/* nav 按钮组 */
.nav-group {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  width: 100%;
  box-sizing: border-box;
}

/* 每个按钮固定尺寸，保证边框一致 */
.nav-box {
  width: 150px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: rgba(0, 30, 60, 0.36);
  color: #00eaff;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
  text-align: center;
  padding: 6px 8px;
  box-sizing: border-box;
  user-select: none;
}

/* 文本容器 */
.nav-label {
  display: -webkit-box;
  /* -webkit-line-clamp: 2; */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.05;
  font-size: 13px;
}

/* 激活态 */
.nav-box.active {
  background: linear-gradient(90deg, rgba(0,198,255,0.15), rgba(0,140,255,0.12));
  box-shadow: 0 6px 18px rgba(0,198,255,0.12);
  transform: translateY(-2px);
  color: #dffaff;
}

/* 标题框与文字 */
.title-border {
  padding: 12px 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}
.page-title {
  font-size: 32px;
  font-weight: 800;
  color: #00eaff;
  letter-spacing: 3px;
  text-shadow: 0 0 18px #00eaff, 0 0 30px #0088ff;
  margin: 0;
  white-space: nowrap;
  text-align: center;
}

/* 主体：关键设置（确保等高 & 地图撑开） */
/* 主体内容布局 */
.main-content {
  display: flex;
  flex: 1;
  gap: 12px;
  padding: 12px;
  box-sizing: border-box;
  overflow: hidden;

  /* 确保三栏等高 */
  align-items: stretch;
}

/* 左右栏比例 */
.column.left {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.column.right {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* 中间栏：重点修复 */
.column.center {
  flex: 2; /* 中间宽度是两倍 */
  display: flex;
  flex-direction: column;
  justify-content: stretch;
  align-items: stretch;
  min-width: 0;
  min-height: 0; /* <-- 必加，防止塌陷 */
}

/* 卡片容器 */
.card {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(0, 20, 40, 0.6);
  border: 1px solid rgba(0,198,255,0.12);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 0 12px rgba(0, 198, 255, 0.06);
  min-height: 0; /* <-- 关键 */
  min-width: 0;
}

/* 卡片标题 */
.card-title {
  padding: 8px 12px;
  font-size: 16px;
  font-weight: bold;
  color: #00eaff;
  border-bottom: 1px solid rgba(0,198,255,0.08);
  background: rgba(0, 40, 80, 0.8);
  text-align: center;
}

/* 卡片主体 */
.card-body {
  flex: 1;
  display: flex;
  position: relative;
  overflow: hidden;
  min-height: 0;
  min-width: 0;
}

/* 卡片主体的直接子元素（比如 map、table）填满剩余空间 */
.card-body > * {
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
  min-width: 0;
}

</style>
