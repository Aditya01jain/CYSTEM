<script setup lang="ts">
import { debounce } from 'lodash';
import { computed } from 'vue';

const emit = defineEmits(['click:action']);

const props = defineProps<{
  config: Object;
  row: Object;
  column: Object;
  testIdFn: Function;
}>();

const filteredOptions = computed(() => {
  return Object.entries(props.config).reduce((acc, [key, action]) => {
    if (!action?.showIf || action?.showIf(props.row)) {
      acc[key] = action;
    }
    return acc;
  }, {} as Record<string, any>);
});

const debouncedClickAction = debounce(onClickAction, 100);

function onClickAction(data: Record<string, any>) {
  emit('click:action', data);
}
</script>

<template>
  <cy-dropdown wrapperClass="table-action-box">
    <template #dropdown-link>
      <CyIconShell size="md" data-testid="action-button">
        <CyIcon icon="fa-solid fa-ellipsis-vertical" class="cyw-p-1" />
      </CyIconShell>
    </template>
    <template #dropdown>
      <ul role="group">
        <li
          v-for="(value, key, index) in filteredOptions"
          :key="key"
          role="button"
          :tabindex="0"
          class="cyw-my-2 cyw-cursor-pointer cyw-list-unstyled"
          @click="debouncedClickAction({ data: props.row, action: key })"
          @mousedown="debouncedClickAction({ data: props.row, action: key })"
          v-bind="testIdFn(key + '-table-quick-action')"
        >
          <div
            class="list-option cyw-flex-align-center cyw-px-3 cyw-py-2 cyw-text-f12 cyw-text-medium cyw-color-N800"
          >
            <div class="list-option__icon cyw-flex-center">
              <CyIcon :icon="value.icon" :class="value?.iconClass || ''" />
            </div>
            <div class="list-option__label cyw-flex-align-center cyw-pl-2">
              {{ value?.label }}
            </div>
          </div>
          <div v-if="value?.showDivider && index < Object.keys(filteredOptions).length - 1">
            <hr />
          </div>
        </li>
      </ul>
    </template>
  </cy-dropdown>
</template>
<style lang="scss">
.table-action-box {
  &.cyw-dropdown-menu--expanded {
    max-height: initial;
  }
}
</style>
<style lang="scss" scoped>
.list-option {
  min-width: 15rem;
  max-width: 20rem;
  &:hover {
    color: var(--P600);
    background-color: var(--N100);
  }
  &__icon {
    width: 2rem;
  }
  &__label {
    width: calc(100% - 2rem);
  }
}
</style>
