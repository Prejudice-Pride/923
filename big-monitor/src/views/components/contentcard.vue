<template>
<div class="card">
    <div class="card-title">
        <slot name="title"> </slot> <!-- title 出口 -->
    </div>

    <div class="card-body">
        <slot name="body"></slot> <!-- body 出口 -->
    </div>
</div>
</template>

<script setup lang="ts">
</script>

<style scoped>

.card {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(0, 20, 40, 0.6);
  /* border: 1px solid #00c6ff; */
  /* border-radius: 8px; */
  box-shadow: -8px -8px 3px -10px rgba(255,255,255,1),8px 8px 16px -10px rgba(0,0,0,.7);

  overflow: hidden;
  min-height: 300px;
}

.card-title {
  padding: 8px 12px;
  font-size: 16px;
  font-weight: bold;
  color: #00eaff;
  border-bottom: 1px solid #00c6ff;
  background: rgba(0, 40, 80, 0.8);
}

.card-body {
  flex: 1;
  display: flex;
  position: relative;
}

.card-body > * {
  flex: 1; /* Map 或内容撑满 */
}


</style>