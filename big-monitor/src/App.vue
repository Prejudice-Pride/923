<script lang="ts" setup>
import seismolayout from './views/seismolayout.vue'
import test from './views/test.vue'
</script>

<template>
  <seismolayout />
  <!-- <test /> -->
</template>

<style>
/* 全局重置边距和内边距 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  height: 100%;
}
</style>