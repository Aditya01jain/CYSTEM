<script setup lang="ts">
import { onMounted, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n'
import { initTestId } from '@/utils/testid';

const { t: $t } = useI18n()

const emit = defineEmits(['section-click']);

const props = defineProps({
  list: {
    type: Array<Record<string, any>>,
    default: [],
    required: true
  },
  selected: {
    default: '',
    type: String
  },
  activeSectionItem: {
    default: '',
    type: String
  },
  dataTestid: {
    type: String,
    default: 'section-list'
  }
});

const testId = initTestId(props.dataTestid, 'section-list');

const state = reactive({
  selected: ''
});

const onSectionChange = (section: string) => {
  state.selected = section;
  emit('section-click', section);
};

onMounted(() => {
  state.selected = props.list[0]?.id;
});

watch(
  () => props.selected,
  () => {
    state.selected = props.selected;
    onSectionChange(props.selected);
  }
);

watch(
  () => props.activeSectionItem,
  () => {
    state.selected = props.activeSectionItem;
  }
);
</script>

<template>
  <div>
    <div
      class="cyw-px-3 cyw-pt-2 cyw-pb-3 cyw-text-f10 cyw-color-N600 cyw-text-medium"
      v-bind="testId('header')"
    >
      {{ $t('alerts.alert-form.go-to-section-header') }}
    </div>
    <div
      v-for="section in props.list"
      :class="[
        'cyw-text-f12 cyw-px-4 cyw-my-3 cyw-cursor-pointer',
        section.id === state.selected
          ? 'selected cyw-color-N900 cyw-text-medium cyw-border-left-1'
          : 'cyw-color-N800'
      ]"
      :key="section.id"
      v-bind="testId(`${section.id}`)"
      @click="onSectionChange(section.id)"
    >
      {{ section.title }}
    </div>
  </div>
</template>
<style lang="scss" scoped>
.selected {
  border-color: var(--N900);
  border-left-width: 0.2rem !important;
}
</style>
