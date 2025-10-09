<template>
  <header class="banner">
    <div class="side side-left">
      <dv-border-box-8 class="nav-border">
        <div class="nav-group">
          <div
            v-for="(item, idx) in navLeft"
            :key="'L' + idx"
            class="nav-box"
            :class="{ active: isActive(item.path) }"
            @click="goTo(item.path)"
          >
            <div class="nav-label">{{ item.label }}</div>
          </div>
        </div>
      </dv-border-box-8>
    </div>

    <div class="center">
      <dv-border-box-8 class="title-border">
        <h1 class="page-title">辽宁省地震活动监测可视化系统</h1>
      </dv-border-box-8>
    </div>

    <div class="side side-right">
      <dv-border-box-8 class="nav-border">
        <div class="nav-group">
          <div
            v-for="(item, idx) in navRight"
            :key="'R' + idx"
            class="nav-box"
            :class="{ active: isActive(item.path) }"
            @click="goTo(item.path)"
          >
            <div class="nav-label">{{ item.label }}</div>
          </div>
        </div>
      </dv-border-box-8>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

function goTo(path: string) {
  router.push(path);
}

function isActive(path: string) {
  return route.path === path;
}

const navLeft = ref<{ label: string; path: string }[]>([
  { label: "地震活动监控页面", path: "/monitor1" },
  { label: "地球物理观测监控", path: "/monitor2" },
]);

const navRight = ref<{ label: string; path: string }[]>([
  { label: "地震学技术方法可视化", path: "/monitor3" },
  { label: "数据产品服务", path: "/monitor4" },
]);
</script>

<style scoped>
.banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 40px;
  height: 110px;
  background: linear-gradient(to bottom, rgba(0, 25, 60, 0.95), rgba(0, 10, 25, 0.9));
  border-bottom: 2px solid rgba(0, 198, 255, 0.12);
}

.side {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 340px;
}

.center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-border {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  width: 100%;
}

.nav-group {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  width: 100%;
}

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

.nav-label {
  display: -webkit-box;
  /* -webkit-line-clamp: 2; */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.05;
  font-size: 13px;
}

.nav-box.active {
  background: linear-gradient(90deg, rgba(0,198,255,0.15), rgba(0,140,255,0.12));
  box-shadow: 0 6px 18px rgba(0,198,255,0.12);
  transform: translateY(-2px);
  color: #dffaff;
}

.title-border {
  padding: 12px 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
</style>
