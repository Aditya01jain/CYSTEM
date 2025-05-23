<script setup lang="ts">
import { computed } from 'vue';
import { initTestId } from '@/utils/testid';

const props = defineProps({
  breadCrumbList: {
    default: [{ name: 'Doc Library' }] as Record<string, any>
  },
  wrapperClass: {
    default: ''
  },
  dataTestid: {
    default: 'breadcrumb'
  }
});

const testId = initTestId(props.dataTestid);
const emit = defineEmits(['breadCrumbClick']);

const crumbFilePath = computed(() =>
  props.breadCrumbList.slice(1, props.breadCrumbList.length - 1)
);

const onBreadCrumbClick = (item: any, index: any) => {
  if( index === props.breadCrumbList.length - 1 ) return;
  emit('breadCrumbClick', {
    item,
    index
  });
};
</script>

<template>
  <CyBreadcrumb size="md" v-bind="testId('breadcrumb')" :class="props.wrapperClass">
    <slot></slot>
    <CyBreadcrumbItem
      @click="onBreadCrumbClick(props.breadCrumbList[0], 0)"
      :class="{ 'cyw-pointer-events': props.breadCrumbList?.length - 1 === 0 }"
      class="breadcrumb-item"
      :offset="300"
      v-bind="testId('0-breadcrumb-item')"
    >
      {{ props.breadCrumbList[0]?.name }}
    </CyBreadcrumbItem>

    <div v-if="props.breadCrumbList.length <= 3 && props.breadCrumbList.length > 1" class="cyw-inline-flex cyw-flex-grow-1">
      <CyBreadcrumbItem
        @click="onBreadCrumbClick(props.breadCrumbList?.[1], 1)"
        class="cyw-flex breadcrumb-item"
        v-bind="testId('1-breadcrumb-item')"
      >
        <div 
          :class="{ 'cyw-cursor-default': props.breadCrumbList?.length - 1 === 1 }"
          class="breadcrumb-item"
        >
          <CyExpandableTitle
            :hideCopy="true"
            :value="props.breadCrumbList?.[1]?.name"
            :offset="300"
          />
        </div>
      </CyBreadcrumbItem>

      <CyBreadcrumbItem
        @click="onBreadCrumbClick(props.breadCrumbList?.[2], 2)"
        class="cyw-flex breadcrumb-item"
        :class="{ 'cyw-cursor-default': props.breadCrumbList?.length - 1 === 2 }"
        v-bind="testId('2-breadcrumb-item')"
      >
        <div 
          :class="{ 'cyw-cursor-default': props.breadCrumbList?.length - 1 === 2 }"
          class="breadcrumb-item"
        >
          <CyExpandableTitle :hideCopy="true" :value="props.breadCrumbList?.[2]?.name" :offset="300" class="cyw-ml-4" />
        </div>
      </CyBreadcrumbItem>
    </div>

    <div v-else-if="props.breadCrumbList.length > 3" class="cyw-flex cyw-mt-4 cyw-pt-2">
      <cy-dropdown v-bind="testId('more-items')">
        <template #dropdown-link>
          <cy-button type="tertiary" subtype="icon" size="lg">
            <div class="cyw-flex-align-center cyw-py-1 cyw-px-2">
              <p>...</p>
            </div>
          </cy-button>
          /
        </template>
        <template #dropdown>
          <div
            v-for="(item, index) in crumbFilePath"
            :key="index"
            v-bind="testId(`${index+2}-breadcrumb-item`)"
            @click="onBreadCrumbClick(item, index + 1)"
            class="cyw-mx-3 cyw-my-2 cyw-text-f12 cyw-cursor-pointer cyw-px-3"
          >
            <p>{{ item.name }}</p>
            <hr v-if="index != crumbFilePath.length - 1" />
          </div>
        </template>
      </cy-dropdown>
      <CyBreadcrumbItem
        class="cyw-ml-3 cyw-pointer-events"
        v-bind="testId(`${props.breadCrumbList?.length - 1}-breadcrumb-item`)"
        @click="
          onBreadCrumbClick(
            props.breadCrumbList[props.breadCrumbList?.length - 1],
            props.breadCrumbList?.length - 1
          )
        "
      >
        <div class="breadcrumb-item cyw-mt-2">
          <CyExpandableTitle
            :hideCopy="true"
            :offset="300"
            :value="props.breadCrumbList[props.breadCrumbList?.length - 1].name"
          />
        </div>
      </CyBreadcrumbItem>
    </div>
  </CyBreadcrumb>
</template>

<style lang="scss" scoped>
.breadcrumb-item {
  width: fit-content;
  max-width: 20rem;
}
</style>
