<script setup lang="ts">
import { reactive, ref } from 'vue';
import { commentMsg } from '../alertCreate/config';
import { useCommentsStore } from '@/store/modules/useComments';
import { useI18n } from 'vue-i18n';
const { t: $t } = useI18n();
const revertCommentRef = ref()
const { userDetails, createComment } = useCommentsStore();
const emit = defineEmits(['submit:revert']);

const state = reactive({
    model: {
        comment: ""
    }
})

function showCommentAlert() {
    revertCommentRef?.value?.open(
        {
            type: 'warning'
        }
    );
}

const updateModelValue = ($event: any) => {
    state.model.revert_comment = $event;
};

async function onConfirm() {
    if (state.model.revert_comment) {
        await createComment({ content: state.model.revert_comment })
    }
    emit('submit:revert', {
        content: state.model.revert_comment
    })
    state.model.revert_comment = "";
}

defineExpose({ showCommentAlert });


</script>
<template>
    <CyAlert ref="revertCommentRef" :message="commentMsg($t)" @confirm="onConfirm()">
        <template #extraInfo>
            <div id="add-comment" class="cyw-flex-start-center cyw-w-100 cyw-my-4">
                <cy-tooltip :content="userDetails?.email">
                    <cy-avatar :firstName="userDetails?.first_name" size="3.6" class="cyw-mr-3" />
                </cy-tooltip>
                <CyTextarea class="cyw-w-100 cyw-mr-3" :maxHeight="8" :rows="1"  :autosize="true"
                    wrapperClass="cyw-w-100 cyw-flex-align-center cyw-p-2 " className="ca-border-0 cyw-p-1"
                    :modelValue="state.model?.revert_comment" size="lg" round="lg"
                    @update:modelValue="updateModelValue($event)" :required="true" />
            </div>
        </template>
    </CyAlert>
</template>