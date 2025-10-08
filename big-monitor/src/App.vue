<script lang="ts" setup>
import monitor1 from './views/Monitor1.vue'
import test from './views/test.vue'
</script>

<template>
  <router-view />
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