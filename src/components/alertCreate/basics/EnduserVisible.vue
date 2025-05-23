<script lang="ts" setup>
const props = defineProps({
  isFieldVisible: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  dataTestid: { type: String, default: '' }
});

const emits = defineEmits(['update']);
</script>
<template>
  <CyIconShell
    @click="emits('update', !isFieldVisible)"
    class="cyw-ml-3"
    :class="{
      'cyw-pointer-events  cyw-cursor-none': props.disabled
    }"
    :data-testid="`${props.dataTestid}-enduser-visible`"
  >
    <CyTooltip :content="props.isFieldVisible ? 'Visible to Members' : 'Hidden for Members'">
      <cy-button type="tertiary" subtype="icon" :disabled="props.disabled">
        <CyIcon
          v-if="props.isFieldVisible"
          icon="fa-sharp fa-solid fa-eye"
          class="cyw-text-f16 cyw-mt-3"
        />
        <CyIcon v-else icon="fa-sharp fa-solid fa-eye-slash" class="cyw-text-f16 cyw-mt-3" />
      </cy-button>
    </CyTooltip>
  </CyIconShell>
</template>
