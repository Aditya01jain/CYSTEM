<script setup lang="ts">
import { reactive, onMounted, ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import InputTags from '@/components/common/InputTags.vue';
import store from '@/store';
import { initTestId } from '@/utils/testid';

const testId = initTestId('ac', 'tags');

const { fetchTagsGroup } = useAlertBasicsData();

const { t: $t } = useI18n()
const emit = defineEmits(['selected']);

const props = defineProps({
  modelValue: { default: () => [] },
  required: { default: false }
});

const state = reactive({
  activeItem: ['tags'],
  selected: {
    tags: [],
    tagGroups: []
  } as Record<string, any>,
  model: {
    tags: [],
    tagGroups: []
  } as Record<string, any>,
  tagGroupsList: [] as Record<string, any>[],
  tagsList: [] as Record<string, any>[],
  search: '',
  page: 1,
  total: 0
});

const tagRef = ref();

const cardTag: Record<string, any> = computed(
  () => store.getters['alertCreate/getAlertFormData']?.card_tag || []
);

const updateTagGroups = (event: Record<string, any>) => {
  state.model.tagGroups = event;
  // Collect all tags from tagGroups
  const tags = state.model.tagGroups.flatMap((tagGroup: Record<string, any>) => tagGroup.card_tag);
  // Get user-selected tags
  const userSelectedTags = state.model.tags.filter((tag: Record<string, any>) => tag.tag_slug);
  // Merge and remove duplicates based on tag_id
  state.model.tags = [...tags, ...userSelectedTags].filter(
    (tag, index, self) => self.findIndex((t) => t.tag_id === tag.tag_id) === index
  );
  emit('selected', state.model.tags);
  validateTags();
};

const validateTags = async () => {
  try {
    await tagRef.value.validate();
  } catch {
    //
  }
};

const getTagGroupList = async () => {
  const data = await fetchTagsGroup();
  if (data.success) state.tagGroupsList = data.success;
};

const setInitValues = () => {
  state.model.tags = props.modelValue;
  state.selected.tags = state.model.tags.map((tag: Record<string, any>) => tag.tag_id);
};

onMounted(async () => {
  await getTagGroupList();
  setInitValues();
});

watch(
  () => cardTag.value,
  (cardTag: Record<string, any>[]) => {
    if (cardTag.length) {
      state.model.tags = cardTag;
    }
  }
);
</script>

<template>
  <CyAccordionItem
    name="card_tag"
    :title="`Tags ${props.required ? '*' : ''}`"
    id="tags"
    v-bind="testId()"
  >
    <el-form-item ref="tagRef" prop="card_tag" class="cyw-mb-5" v-bind="testId('group-form-item')">
      <input-user-dropdown
        v-bind="testId('group')"
        class="cyw-select-menu"
        multiple
        :label="$t('alerts.labels.tag-group')"
        name="tag'"
        :placeholder="$t('alerts.placeholder.tag-group')"
        valueIdentifier="title"
        identifier="id"
        link="analyst.alertformtagsgroup"
        :modelValue="state.model.tagGroups"
        @update:modelValue="updateTagGroups"
        size="md"
      >
      </input-user-dropdown>
      <input-tags
        v-model="state.model.tags"
        v-bind="testId()"
        @selected="
          emit('selected', state.model.tags);
          validateTags();
        "
      />
    </el-form-item>
  </CyAccordionItem>
</template>
