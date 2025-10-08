<template>
  <div style="width:100vw; height:100vh; background:#000;">
    <!-- <Map /> -->
     <Cesiummap/>
  </div>
</template>

<script>
import Cesiummap from "./components/CesiumMap.vue";

export default {
  components: { Map }
};
</script>
