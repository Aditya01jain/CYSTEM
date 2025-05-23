<script setup lang="ts">
import { reactive, inject, onMounted } from 'vue';

const $api: any = inject('$api');

const props = defineProps({
  link: {
    type: String,
    required: true
  },
  modelValue: {
    default: []
  },
  disabled: {
    default: false
  }
});

const emit = defineEmits(['update:model-value']);

const state = reactive({
  pagination: {
    page: 1,
    page_size: 10
  },
  filter: {},
  data: [] as Array<any>,
  next: true
});

const fetchData = async () => {
  try {
    const { data } = await $api.get(props.link, {
      params: {
        ...state.pagination,
        is_active: true,
        ...state.filter
      }
    });
    state.data =
      state.pagination.page === 1
        ? [...(data.result || data.results)]
        : [...state.data, ...(data.result || data.results)];
    state.next =
      !!data?.link?.next || data.count > state.pagination.page * state.pagination.page_size;
  } catch {
    //
  }
};

function loadMore() {
  if (!state.next) return;
  state.pagination.page += 1;
  fetchData();
}

const onSearch = (event: any) => {
  state.pagination = {
    page: 1,
    page_size: 10
  };
  state.filter = event;
  fetchData();
};

onMounted(() => {
  fetchData();
});
</script>
<template>
  <cy-select
    v-bind="$attrs"
    :data="state.data"
    paginated
    showSearch
    :model-value="props.modelValue"
    @update:model-value="emit('update:model-value', $event)"
    @loadMore="loadMore"
    @search="onSearch($event)"
    :disabled="props.disabled"
  />
</template>
