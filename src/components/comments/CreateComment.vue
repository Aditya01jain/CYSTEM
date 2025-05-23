<script setup lang="ts">
import { computed } from 'vue';
import store from '@/store';
import { initTestId } from '@/utils/testid';
const testId = initTestId('ac', 'comment-section');

const emit = defineEmits(['update:model', 'create:comment']);

const props = defineProps({
    userDetails: {
        default: {}
    },
    model: {
        default: ""
    }
});

const userDetails = computed(() => {
    return store.getters['common/getUserDetails'];
});

</script>
<template>
    <cy-tooltip :content="userDetails?.email">
        <cy-avatar :firstName="userDetails?.first_name" size="3.6" class="cyw-mr-3 cyw-color-P600 background-BL200" />
    </cy-tooltip>
    <CyTextarea class="cyw-w-100 cyw-mr-3" :maxHeight="8" :rows="1" :autosize="true" v-bind="testId(`comment`)" className="ca-border-0 cyw-p-1"
        :placeholder="$t('alerts.placeholder.add-comment')" wrapperClass="cyw-w-100 cyw-p-2 cyw-flex-align-center" round="lg"
        :modelValue="props.model" :required="true" @update:modelValue="emit('update:model', $event)">
        <template #append>
            <CyButton subtype="subtle" v-bind="testId(`comment`)" :disabled="!props.model" size="md"
                class="cyw-round-lg cyw-px-4" @click="emit('create:comment')">
                <CyIcon icon="fa-solid fa-paper-plane-top" />
            </CyButton>
        </template>
    </CyTextarea>
</template>

<style scoped lang="scss">
.background-BL200 {
    background-color: var(--BL200);
}
</style>