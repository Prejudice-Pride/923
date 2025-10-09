// src/stores/useProvinceStore.ts
import { defineStore } from "pinia";

export const useProvinceStore = defineStore("province", {
  state: () => ({
    name: "辽宁省",           // 默认省份
    adcode: "210000",        // 默认省份 adcode
    center: [104.066540, 30.572269] as [number, number], // 默认省会坐标
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

// 各省会/直辖市坐标（经度,纬度）
var adcode = [
    // 华北地区
    {adcode: "110000", name: "北京市", coordinate: [116.407526, 39.904030]},
    {adcode: "120000", name: "天津市", coordinate: [117.201538, 39.085294]},
    {adcode: "130000", name: "河北省", coordinate: [114.543400, 38.035990]}, // 石家庄
    {adcode: "140000", name: "山西省", coordinate: [112.548879, 37.870590]}, // 太原
    {adcode: "150000", name: "内蒙古自治区", coordinate: [111.752020, 40.841490]}, // 呼和浩特

    // 东北地区
    {adcode: "210000", name: "辽宁省", coordinate: [123.431474, 41.805698]}, // 沈阳
    {adcode: "220000", name: "吉林省", coordinate: [125.325990, 43.896160]}, // 长春
    {adcode: "230000", name: "黑龙江省", coordinate: [126.536850, 45.803780]}, // 哈尔滨

    // 华东地区
    {adcode: "310000", name: "上海市", coordinate: [121.473701, 31.230416]},
    {adcode: "320000", name: "江苏省", coordinate: [118.763230, 32.061710]}, // 南京
    {adcode: "330000", name: "浙江省", coordinate: [120.153580, 30.287460]}, // 杭州
    {adcode: "340000", name: "安徽省", coordinate: [117.227320, 31.820570]}, // 合肥
    {adcode: "350000", name: "福建省", coordinate: [119.306239, 26.075302]}, // 福州
    {adcode: "360000", name: "江西省", coordinate: [115.857940, 28.682020]}, // 南昌
    {adcode: "370000", name: "山东省", coordinate: [117.000923, 36.675807]}, // 济南

    // 华中地区
    {adcode: "410000", name: "河南省", coordinate: [113.665410, 34.757969]}, // 郑州
    {adcode: "420000", name: "湖北省", coordinate: [114.298569, 30.584354]}, // 武汉
    {adcode: "430000", name: "湖南省", coordinate: [112.983398, 28.112660]}, // 长沙

    // 华南地区
    {adcode: "440000", name: "广东省", coordinate: [113.264434, 23.129162]}, // 广州
    {adcode: "450000", name: "广西壮族自治区", coordinate: [108.320004, 22.824020]}, // 南宁
    {adcode: "460000", name: "海南省", coordinate: [110.331190, 20.031971]}, // 海口

    // 西南地区
    {adcode: "500000", name: "重庆市", coordinate: [106.551557, 29.563010]},
    {adcode: "510000", name: "四川省", coordinate: [104.066540, 30.572269]}, // 成都
    {adcode: "520000", name: "贵州省", coordinate: [106.707410, 26.598030]}, // 贵阳
    {adcode: "530000", name: "云南省", coordinate: [102.712250, 25.038940]}, // 昆明
    {adcode: "540000", name: "西藏自治区", coordinate: [91.140860, 29.645020]}, // 拉萨

    // 西北地区
    {adcode: "610000", name: "陕西省", coordinate: [108.940170, 34.341270]}, // 西安
    {adcode: "620000", name: "甘肃省", coordinate: [103.834170, 36.061380]}, // 兰州
    {adcode: "630000", name: "青海省", coordinate: [101.778228, 36.617144]}, // 西宁
    {adcode: "640000", name: "宁夏回族自治区", coordinate: [106.258640, 38.471170]}, // 银川
    {adcode: "650000", name: "新疆维吾尔自治区", coordinate: [87.616880, 43.826630]}, // 乌鲁木齐

    // 特别行政区及台湾省
    {adcode: "710000", name: "台湾省", coordinate: [121.509062, 25.044332]}, // 台北
    {adcode: "810000", name: "香港特别行政区", coordinate: [114.169361, 22.319304]},
    {adcode: "820000", name: "澳门特别行政区", coordinate: [113.549090, 22.198951]}
];
