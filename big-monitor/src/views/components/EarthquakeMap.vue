<template>
  <div id="map-container"></div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted } from "vue";
import AMapLoader from "@amap/amap-jsapi-loader";
import { useProvinceStore } from "../../stores/usersProvinceStore";

let map: any = null; // 避免 TS 报错
const provinceStore = useProvinceStore();

onMounted(() => {
  // 高德安全密钥
  (window as any)._AMapSecurityConfig = {
    securityJsCode: "d38dfc2916c1ab189a71e3da20a1a857",
  };

  AMapLoader.load({
    key: "2a69aa7100d68626b83197ec959bbae7",
    version: "2.0",
    plugins: ["AMap.DistrictSearch", "AMap.DistrictLayer", "AMap.MarkerClusterer"],
  })
    .then((AMap) => {
      // 初始化地图
      map = new AMap.Map("map-container", {
        viewMode: "3D",
        center: provinceStore.center,
        zoom: 6,
        features: ["bg", "road", "point"], // 不显示铁路层
      });

      // 使用 DistrictSearch 获取省边界
      const district = new AMap.DistrictSearch({
        extensions: "all",
        subdistrict: 0,
      });

      const searchKey = provinceStore.adcode || provinceStore.name;

      district.search(
        searchKey,
        (status: string, result: { districtList?: any[] }) => {
          if (status === "complete" && result.districtList?.length) {
            const info = result.districtList[0];
            const boundaries = info.boundaries;

            if (!boundaries || boundaries.length === 0) {
              console.warn("未查询到边界数据，无法设置掩膜与 fitView。");
              return;
            }

            const mask = boundaries.map((b: any) => [b]);

            // 绘制省份高亮 polygon（深蓝色）
            const provincePolygon = new AMap.Polygon({
              path: mask[0],
              strokeColor: "#00eaff",
              strokeWeight: 2,
              fillColor: "rgba(0,80,160,0.55)",
              fillOpacity: 0.55,
              zIndex: 1000,
            });
            map.add(provincePolygon);

            // 设置掩膜
            map.setMask(mask);
            map.setMapStyle("amap://styles/dark");

            // 自动调整视野并以省会为中心
            map.setFitView([provincePolygon], false, [60, 60, 60, 60]);
            setTimeout(() => {
              const curZoom = map.getZoom();
              const desiredZoom = Math.min(curZoom + 1, 13);
              map.setZoom(desiredZoom);
              map.setCenter(provinceStore.center);
            }, 200);
          } else {
            console.error("DistrictSearch 查询失败：", status, result);
          }
        });

      // 获取省内地震数据
      fetch(
        `http://127.0.0.1:5000/dzml_new/by_province?name=${encodeURIComponent(
          provinceStore.name
        )}`
      )
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
                </div>
              `,
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
#map-container {
  width: 100%;
  height: 600px;
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
