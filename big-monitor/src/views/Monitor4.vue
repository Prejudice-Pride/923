<script setup lang="ts">
import HeaderBar from "./components/HeaderBar.vue"
import Contentcard from "./components/contentcard.vue";
</script>

<template>
  <div class="app">
    <!-- ✅ 引入独立的顶部栏 -->
    <HeaderBar />

    <dv-decoration-8 style="width:100%;height:4px;" />

    <main class="main-content">
    <div class="left-area">
      <div class="column left-top">
        <Contentcard>
          <template v-slot:title>上侧面板</template>
          <template v-slot:body>
            这里可以放置监控选项、统计概览等。
          </template>
        </Contentcard>    
      </div>

        <div class="column left-bottom">
          <Contentcard>
            <template v-slot:title>下侧面板</template>
            <template v-slot:body>
              这里可以放置图例、筛选条件、说明等。
            </template>
          </Contentcard> 
      </div>
    </div>

      <div class="column right">
        <div class="card">
          <Contentcard>
            <template v-slot:title>文件预览</template>
            <template v-slot:body>
              
            </template>
          </Contentcard> 
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

.main-content {
  display: flex;
  gap: 12px;
  padding: 12px;
  flex: 1; /* 占满剩余高度 */
  overflow: hidden;
}

.left-area{
    flex: 1;
}


.column {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.column.left-top {
  flex: 1;
}

.column.left-bottom{
  flex: 1;
}

.column.center {
  flex: 2;
}

.column.right {
  flex: 2;
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
