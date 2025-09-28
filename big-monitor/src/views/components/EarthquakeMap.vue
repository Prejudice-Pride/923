<template>
  <div id="map-container"></div>
</template>

<script setup>
import { onMounted, onUnmounted } from "vue";
import AMapLoader from "@amap/amap-jsapi-loader";

let map = null;

onMounted(() => {
  window._AMapSecurityConfig = {
    securityJsCode: "d38dfc2916c1ab189a71e3da20a1a857",
  };

  AMapLoader.load({
    key: "2a69aa7100d68626b83197ec959bbae7",
    version: "2.0",
    plugins: ["AMap.Scale", "AMap.DistrictLayer"],
  })
    .then((AMap) => {
      map = new AMap.Map("map-container", {
        viewMode: "3D",
        zoom: 4,
        center: [104.195397, 35.86166], // 中国中心
      });

      // 添加中国轮廓层
      const countryLayer = new AMap.DistrictLayer.Country({
        zIndex: 10,
        SOC: "CHN",
        depth: 1,
        styles: {
          "nation-stroke": "#00c6ff",
          "coastline-stroke": "#0091ea",
          fill: "rgba(0, 50, 80, 0.2)",
        },
      });
      countryLayer.setMap(map);
    })
    .catch((e) => {
      console.error("地图加载失败", e);
    });
});

onUnmounted(() => {
  map?.destroy();
});
</script>

<style scoped>
#map-container {
  width: 100%;
  height: 600px; /* 先写死，确保能显示 */
}
</style>
