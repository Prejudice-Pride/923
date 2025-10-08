<template>
  <div id="map-container"></div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted } from "vue";
import AMapLoader from "@amap/amap-jsapi-loader";
import { useProvinceStore } from "../../stores/usersProvinceStore";

let map: any = null;
const provinceStore = useProvinceStore();

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
        center: provinceStore.center,
        zoom: 6,
        features: ["bg", "road", "point"],
      });

      const district = new AMap.DistrictSearch({ extensions: "all", subdistrict: 1 });
      district.search(provinceStore.adcode || provinceStore.name, (status: string, result: any) => {
        if (status === "complete" && result?.districtList?.length) {
          const info = result.districtList[0];
          const boundaries = info.boundaries;
          if (boundaries && boundaries.length) {
            const mask = boundaries.map((b: any) => [b]);

            const provincePolygon = new AMap.Polygon({
              path: mask[0],
              strokeColor: "#00eaff",
              strokeWeight: 2,
              fillColor: "rgba(0,80,160,0.55)",
              fillOpacity: 0.55,
              zIndex: 1000,
            });
            map.add(provincePolygon);
            map.setMask(mask);
            map.setMapStyle("amap://styles/dark");

            map.setFitView([provincePolygon], false, [60, 60, 60, 60]);
            setTimeout(() => {
              const curZoom = map.getZoom();
              map.setZoom(Math.min(curZoom + 1, 13));
            }, 200);
          }
        }
      });

      fetch(`http://127.0.0.1:5000/dzml_new/by_province?name=${encodeURIComponent(provinceStore.name)}`)
        .then((res) => res.json())
        .then((resData) => {
          const markers: any[] = [];
          (resData.data || []).forEach((eq: any) => {
            const lon = Number(eq.lon);
            const lat = Number(eq.lat);
            if (!isFinite(lon) || !isFinite(lat)) return;

            const marker = new AMap.Marker({
              position: [lon, lat],
              content: `<div class="eq-marker">${eq.mc}</div>`,
              zIndex: 2000,
            });

            const infoWindow = new AMap.InfoWindow({
              content: `
                <div>
                  <strong>${eq.DiMing || "未知"}</strong><br/>
                  震级: M${eq.mc ?? "N/A"}<br/>
                  时间: ${eq.RiQi ?? "未知"}
                </div>`,
              offset: new AMap.Pixel(0, -20),
            });

            marker.on("click", () => infoWindow.open(map, marker.getPosition()));
            markers.push(marker);
          });

          if (markers.length) {
            map.add(markers);
            new AMap.MarkerClusterer({ map, markers, gridSize: 60 });
          }
        })
        .catch((err) => console.error("获取省内地震数据失败：", err));
    })
    .catch((e) => console.error("地图加载失败", e));
});

onUnmounted(() => {
  map?.destroy();
});
</script>

<style scoped>
/* 让地图容器充满卡片体 */
#map-container {
  width: 100%;
  height: 100%;
  min-height: 280px; /* 当卡片很小的时候给个下限 */
}

/* 地震点圆圈（如你原样） */
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
