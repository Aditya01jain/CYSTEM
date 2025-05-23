<script setup lang="ts">
import { cloneDeep } from 'lodash';
import { useStore } from 'vuex';
import { ref, onMounted, reactive, inject } from 'vue';
import { initTestId } from '@/utils/testid';
const store = useStore();

const props = defineProps({
  alertId: {
    type: String,
    default: ''
  },
  tags: {
    type: Array<any>,
    default: () => []
  },
  showAddTags: {
    type: Boolean,
    default: false
  },
  dataTestid: {
    type: String,
    default: ''
  },
  mode: {
    type: String,
    default: 'view'
  }
});

const testId = initTestId(props.dataTestid);
const $notify: any = inject('$notify');
const $api: any = inject('$api');
const emits = defineEmits(['update:tags']);

const tagsPopperRef = ref<any>();

const state = reactive({
  tagUpdating: false,
  modelTags: [] as Record<string, any>[],
  selectedTags: [] as Record<string, any>[]
});

onMounted(() => {
  state.modelTags = props.tags || [];
  state.selectedTags = props.tags || [];
});

const saveTags = async () => {
  state.tagUpdating = true;
  const payload = {
    short_id: props.alertId,
    tags: state.modelTags
  };
  try {
    const response = await $api.put('analyst.alertaddtags', payload);
    $notify.success({
      title: 'Success',
      message: response?.data?.detail || ''
    });
    tagsPopperRef.value?.close();
    emits('update:tags', state.modelTags);
    state.selectedTags = cloneDeep(state.modelTags);
  } catch {
    //
  } finally {
    state.tagUpdating = false;
  }
};

const onTagPopperHide = () => {
  if (props.mode === 'create') {
    state.modelTags = store.getters['alertCreate/getAlertFormData']?.card_tag;
    return;
  }
  state.modelTags = store.getters['alert/getAlertDetails']?.card_tag || [];
};
</script>

<template>
  <div v-if="tags?.length" class="cyw-my-2 cyw-flex-wrap">
    <CyArrayPopper
      :config="{
        key: 'selectedTags',
        slice: 3,
        mapper: 'selectedTags:tag_name',
        type: 'tags',
        rounded: false
      }"
      :value="state"
      v-bind="testId('list')"
    >
      <template #items="{ value }">
        <CyTag
          v-for="(tag, index) in value"
          :key="tag.tag_id"
          :rounded="false"
          :text="tag.tag_name"
          class="cyw-mb-2"
          v-bind="testId(`${index}-tag`)"
        />
      </template>
    </CyArrayPopper>
  </div>
  <p v-else>{{ $t('alerts.labels.na') }}</p>
  <cy-popper
    class="cyw-d-inline-block"
    v-if="props.showAddTags"
    ref="tagsPopperRef"
    placement="left"
    popperClass="alert-tags"
    @hide="onTagPopperHide()"
  >
    <div class="alert-tags__input cyw-p-4">
      <input-tags
        v-model="state.modelTags"
        :maxTagCount="2"
        class="input-tags"
        v-bind="testId('input-tag')"
      />
      <div class="cyw-flex-justify-end">
        <CyButton
          type="primary"
          class="cyw-mt-3"
          size="sm"
          :loading="state.tagUpdating"
          v-bind="testId('update-tag')"
          @click="saveTags"
        >
          Update
        </CyButton>
      </div>
    </div>
    <template #reference>
      <cy-button
        type="tertiary"
        class="cyw-mt-3 cyw-w-fit"
        size="md"
        v-bind="testId('add-edit-tag')"
      >
        {{ props.tags?.length ? 'Edit' : 'Add' }} Tag(s)
      </cy-button>
    </template>
  </cy-popper>
</template>

<style lang="scss">
.alert-tags {
  &.cyw-popper__wrap {
    overflow: visible !important;
  }
  &__input {
    min-width: 35rem;
    max-width: 60rem;
  }
}
</style>
