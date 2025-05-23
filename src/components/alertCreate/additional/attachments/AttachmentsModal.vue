<script setup lang="ts">
import { ref, useAttrs } from 'vue';
import { initTestId } from '@/utils/testid';

const attachmentsModalRef = ref();

const $attrs: any = useAttrs();
const testId = initTestId($attrs['data-testid']);

const emits = defineEmits(['close']);

function hide() {
  attachmentsModalRef.value.hide();
}

function show() {
  attachmentsModalRef.value.show();
}

defineExpose({
  hide,
  show
});
</script>
<template>
  <CyModal
    modelAppendToBody
    ref="attachmentsModalRef"
    headerClass="ca-border-0"
    @close="emits('close')"
    v-bind="{ ...$attrs, ...testId() }"
  >
    <template #modal-title>
      <div id="attachments-header" v-bind="testId('header')"></div>
    </template>
    <template #modal-content>
      <slot></slot>
    </template>
    <template #modal-footer>
      <div id="attachments-footer" v-bind="testId('footer')"></div>
    </template>
  </CyModal>
</template>
