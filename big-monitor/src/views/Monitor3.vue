<template>
  <div class="monitor3-app">
    <!-- 顶部 Header -->
    <HeaderBar />

    <dv-decoration-8 style="width:100%;height:4px;" />

    <!-- 四宫格主体 -->
    <main class="main-grid">
      <!-- A -->
      <div class="grid-card">
        <div class="card-title">B值空间分布</div>
        <div class="card-body placeholder">地图展示区 A</div>
      </div>

      <!-- B -->
      <div class="grid-card">
        <div class="card-title">地震矩释放 MAR</div>
        <div class="card-body placeholder">地图展示区 B</div>
      </div>

      <!-- C -->
      <div class="grid-card">
        <div class="card-title">B值时间变化</div>
        <div class="card-body placeholder">坐标系展示区 C</div>
      </div>

      <!-- D -->
      <div class="grid-card">
        <div class="card-title">固体调制解调比</div>
        <div class="card-body placeholder">地图展示区 D</div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import HeaderBar from "./components/HeaderBar.vue";
</script>

<style scoped>
/* 整体背景保持一致 */
.monitor3-app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: radial-gradient(circle at center, #001a33, #000c1a);
  color: #fff;
  overflow: hidden;
}

/* 四宫格主体 */
.main-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr; /* 两列 */
  grid-template-rows: 1fr 1fr;    /* 两行 */
  gap: 14px;
  padding: 14px 20px;
  box-sizing: border-box;
}

/* 每个卡片 */
.grid-card {
  display: flex;
  flex-direction: column;
  background: rgba(0, 25, 50, 0.6);
  border: 1px solid rgba(0, 198, 255, 0.12);
  border-radius: 10px;
  box-shadow: 0 0 12px rgba(0, 198, 255, 0.08);
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.grid-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 0 20px rgba(0, 198, 255, 0.25);
}

/* 标题栏 */
.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #00eaff;
  text-align: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(0, 198, 255, 0.12);
  background: linear-gradient(to right, rgba(0, 50, 100, 0.8), rgba(0, 20, 40, 0.8));
  text-shadow: 0 0 10px #00eaff;
  letter-spacing: 1px;
}

/* 内容区 */
.card-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #88cfff;
  font-size: 14px;
  letter-spacing: 1px;
  background: radial-gradient(circle at center, rgba(0, 40, 80, 0.3), rgba(0, 10, 30, 0.6));
}

/* 未来地图或图表的占位样式 */
.placeholder {
  border: 1px dashed rgba(0, 198, 255, 0.2);
  backdrop-filter: blur(3px);
  transition: all 0.3s ease;
}

.placeholder:hover {
  border-color: #00eaff;
  background: rgba(0, 60, 120, 0.3);
}

/* 响应式（中屏时改为竖两栏） */
@media (max-width: 1200px) {
  .main-grid {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(4, 1fr);
  }
}
</style>
