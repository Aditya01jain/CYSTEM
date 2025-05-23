<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { useI18n } from 'vue-i18n';
const { t: $t } = useI18n();

const { fetchTags, addTags } = useAlertBasicsData();
const store = useStore();
const emit = defineEmits(['update:modelValue', 'selected']);
const tags = ref();

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  dataTestid: {
    type: String,
    default: ''
  },
  showFilterOptions: {
    type: Boolean,
    default: true
  }
});

const state = reactive({
  model: {
    tags: [],
    tagGroups: []
  } as Record<string, any>,
  tagsList: [] as Record<string, any>[],
  search: '',
  page: 1,
  total: 0,
  selectedSwitch: 'startswith'
});

const searchOptions = [
  {name: 'Starts With', id: 'startswith'},
  {name: 'Exact Match', id: 'exact'},
  {name: "Contains", id: "phrase"}
];

const isTagCreationAllowed = computed(
  () => !store.getters['common/getTenantDetails']?.disable_tag_creation_dashboard
);

const fetchData = async (existingData: Record<string, any>[] = []) => {
  const data = await fetchTags({
    search: state.search,
    page: state.page,
    page_size: 10,
    search_mode: state.selectedSwitch
  });
  if (data.success) {
    state.total = data.success?.count;
    state.tagsList = [...existingData, ...(data.success?.results || [])];
    if (
      !state.tagsList.some((tag: any) => tag.tag_name === state.search) &&
      isTagCreationAllowed.value
    ) {
      state.tagsList.unshift({
        tag_name: $t('alerts.buttons.add-tag', { tag_name: state.search }),
        tag_id: 'create'
      });
    }
  } else {
    state.tagsList = [];
  }
};

const handleSearch = async (searchObj: any) => {
  const { q } = searchObj;
  if (q?.length < 3) {
    state.tagsList = [];
    state.search = '';
    return;
  }
  state.search = q;
  fetchData();
};

const handleSearchOptions = (event: any) =>{
  state.selectedSwitch = event.id;
  if(state.search) {
    fetchData()
  }
}

const makeTags = async (input: string) => {
  try {
    const data = await addTags({
      tag_name: input?.replace(/^[;,]|[;,]$/g, '')
    });
    tags.value.search = '';
    data.success.forEach((item: Record<string, any>) => {
      state.model.tags.push(item);
    });
  } finally {
    state.tagsList = [];
  }
};

const updateTags = async (event: Record<string, any>[]) => {
  state.model.tags = event.filter((item) => item.tag_id !== 'create');
  const newTag = event.find((item) => item.tag_id === 'create');
  if (newTag) await makeTags(newTag.tag_name);
  emit('update:modelValue', state.model.tags);
  emit('selected', state.model.tags);
};

const onTagsLoadMore = () => {
  if (state.total < state.page * 10) {
    state.page += 1;
    fetchData(state.tagsList);
  }
};
</script>

<template>
  <CySelect
    ref="tags"
    class="cyw-select-menu cyw-mt-4"
    showSearch
    multiple
    name="tags"
    :label="$t('alerts.metadata.tags')"
    :placeholder="$t('alerts.placeholder.search-and-select-tags')"
    valueIdentifier="tag_name"
    :noDataText="$t('alerts.placeholder.type-your-query')"
    identifier="tag_id"
    :data="state.tagsList"
    :model-value="props.modelValue"
    @search="handleSearch($event)"
    @update:modelValue="updateTags"
    size="md"
    :data-testid="props.dataTestid"
    @loadMore="onTagsLoadMore"
    @close="state.tagsList = []"
  >
    <template v-if="showFilterOptions" #menu-header>
      <div class="switcher-container">
        <cy-switcher
          type="subtle"
          :value="state.selectedSwitch"
          :options="searchOptions"
          @change="handleSearchOptions"
        >
        </cy-switcher>
      </div>
    </template>
  </CySelect>
</template>

<style lang="scss">
.switcher-container {
	margin-left: 1rem;
	margin-top: 1rem;
  margin-bottom: 1rem;
	padding: 0;
  line-height: 0px;
}
</style>