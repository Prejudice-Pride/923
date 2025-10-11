<template>
  <div id="map-container"></div>
</template>

<script lang="ts" setup>
import { defineProps, onMounted, onUnmounted } from "vue";
import AMapLoader from "@amap/amap-jsapi-loader";

interface Instrument {
  lon: number;
  lat: number;
  DiMing: string;
  mc?: string;
  RiQi?: string;
}

// props
const props = defineProps<{ instruments: Instrument[] }>();

let map: any = null;

onMounted(() => {
  (window as any)._AMapSecurityConfig = { securityJsCode: "d38dfc2916c1ab189a71e3da20a1a857" };

  AMapLoader.load({
    key: "2a69aa7100d68626b83197ec959bbae7",
    version: "2.0",
    plugins: ["AMap.DistrictSearch", "AMap.MarkerClusterer"],
  })
    .then((AMap) => {
      map = new AMap.Map("map-container", {
        viewMode: "3D",
        center: [105, 35],
        zoom: 6,
        features: ["bg", "road", "point"],
      });

      const markers: any[] = props.instruments.map((eq: Instrument) => {
        const marker = new AMap.Marker({
          position: [eq.lon, eq.lat],
          content: `<div class='eq-marker'>${eq.mc || ""}</div>`,
          zIndex: 2000,
        });

        const infoWindow = new AMap.InfoWindow({
          content: `
            <div>
              <strong>${eq.DiMing || "未知"}</strong><br/>
              震级: M${eq.mc || "N/A"}<br/>
              时间: ${eq.RiQi || "未知"}
            </div>`,
          offset: new AMap.Pixel(0, -20),
        });

        marker.on("click", () => infoWindow.open(map, marker.getPosition()));
        return marker;
      });

      if (markers.length) {
        map.add(markers);
        new AMap.MarkerClusterer({ map, markers, gridSize: 60 });
      }
    })
    .catch((e) => console.error("地图加载失败", e));
});

onUnmounted(() => {
  map?.destroy();
});
</script>

<style scoped>
#map-container {
  width: 100%;
  height: 100%;
  min-height: 280px;
}

.eq-marker {
  background-color: rgba(255, 0, 0, 0.75);
  color: #fff;
  font-size: 12px;
  font-weight: bold;
  border-radius: 50%;
  padding: 4px;
  text-align: center;
  width: 24px;
  height: 24px;
  line-height: 16px;
  border: 2px solid #fff;
}
</style>
