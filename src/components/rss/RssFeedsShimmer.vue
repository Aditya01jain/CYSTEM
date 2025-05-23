<script lang="ts" setup>
import { initTestId } from '@/utils/testid';
const testId = initTestId('rss');

const props = defineProps({
  type: {
    type: String,
    default: 'sidebar'
  }
});
</script>

<template>
  <div v-if="props.type === 'sidebar'">
    <div class="cyw-p-4" v-for="i in 10" :key="i" v-bind="testId(`${i}-loading-side-bar`)">
      <CyShimmer type="single"></CyShimmer>
      <CyShimmer type="single"></CyShimmer>
      <div class="cyw-w-50 cyw-flex cyw-mt-4">
        <CyShimmer type="single" class="cyw-w-50"></CyShimmer>
        <CyShimmer type="single" class="cyw-w-50 cyw-pl-4"></CyShimmer>
      </div>
      <div class="cyw-w-75 cyw-flex cyw-mt-2">
        <CyShimmer type="single" class="cyw-w-50"></CyShimmer>
        <CyShimmer type="single" class="cyw-w-50 cyw-pl-4"></CyShimmer>
      </div>
    </div>
  </div>
  <div v-else v-bind="testId(`loading`)">
    <CyShimmer type="single"></CyShimmer>
    <CyShimmer type="single"></CyShimmer>
    <CyShimmer class="cyw-w-25" type="single"></CyShimmer>
    <div class="cyw-mt-5">
      <CyShimmer type="image"></CyShimmer>
      <CyShimmer type="card"></CyShimmer>
      <CyShimmer type="card"></CyShimmer>
    </div>
  </div>
</template>
