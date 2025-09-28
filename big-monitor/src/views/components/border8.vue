<script setup lang="ts">
import { BorderBox8 as DvBorderBox8 } from '@kjgl77/datav-vue3'
</script>

<template>
  <div>
    <dv-border-box8 :dur="5" id="dv-border-box8">
        <slot></slot>
    </dv-border-box8>
  </div>
</template>

<style scoped>
#dv-border-box8 {
  width: 50%;
  height: 800px;
  margin: 0;
  padding: 0;
}
</style>
