// src/stores/useProvinceStore.ts
import { defineStore } from "pinia";

export const useProvinceStore = defineStore("province", {
  state: () => ({
    name: "辽宁省",           // 默认省份
    adcode: "210000",        // 默认省份 adcode
    center: [123.4291, 41.7968] as [number, number], // 默认省会坐标
  }),
  actions: {
    // 更新目标省份信息
    setProvince(name: string, adcode: string, center: [number, number]) {
      this.name = name;
      this.adcode = adcode;
      this.center = center;
    },
  },
});
