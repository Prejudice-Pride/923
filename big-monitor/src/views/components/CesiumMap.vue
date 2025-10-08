<template>
  <div ref="cesiumContainer" class="cesium-container"></div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import * as Cesium from 'cesium'

const cesiumContainer = ref(null)

onMounted(() => {
  // 不使用 Ion Token（离线模式）
  const viewer = new Cesium.Viewer(cesiumContainer.value, {
    imageryProvider: new Cesium.UrlTemplateImageryProvider({
      url: '/tiles/{z}/{x}/{y}.png', // 本地瓦片路径
      maximumLevel: 18
    }),
    baseLayerPicker: false,
  })
})
</script>

<style>
.cesium-container {
  width: 100%;
  height: 100vh;
  display: block;
}
</style>
