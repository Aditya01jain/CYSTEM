<script setup lang="ts">
import { reactive, ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import store from '@/store';
import { commentIdPrefix } from '../alertCreate/config';
import CreateComment from '../comments/CreateComment.vue';
import ShowComments from '../comments/ShowComments.vue';
import { useCommentsStore } from '@/store/modules/useComments';
const { state: commentsState, createComment, fetchComments, submitPartialAlert } = useCommentsStore();
const props = defineProps({
    exportLink: {
        default: ''
    },
    commentData: {
        default: {}
    },
    modelValue: {
        default: {}
    },
    modelKeyCategory: {
        default: {}
    },
    modelKey: {
        default: ''
    },
    modelIndex: {
        default: 0
    },
    fangDefangStatus: {
        default: {}
    }
});

const state = reactive({
    showAddComment: false as boolean,
    position: {} as Record<string, any>,
    model: {} as Record<string, any>,
    commentBoxWidth: 25 as number,
    showComment: false as boolean,
    counter: 1 as number,
    comment: {} as Record<string, any>,
    commentsListState: [] as Record<string, any>[],
    commentsLoading: false as boolean,
    commentId: "" as string,
});
const addCommentRef = ref(null);
const emit = defineEmits(['update:comment', 'remove:span:class', 'update:modelValue']);
const userDetails = computed(() => {
    return store.getters['common/getUserDetails'];
});
async function onCallback(data: Record<string, any>) {
    if (data?.type === "add") {
        state.showAddComment = true;
        onClick(data.position);
    } else if (data?.type === "click") {
        onClick(data.position);
        const commentId = data.spanId?.split(`${commentIdPrefix}_`)[1];     
        state.comment = state.commentsListState?.find((field: Record<string, any>) => 
         field?.id?.toString() === commentId
        );
        if (!state.comment && commentId) {
            await fetchComments({ commentId: commentId });
            if (commentsState.comments?.id) {
                state.comment = commentsState.comments;
                state.showAddComment = false;
                state.showComment = !state.showComment;
                state.commentsListState.push(state.comment);
            }
        } else {
            state.showComment = !state.showComment;
        }
    }
};

function onClick(position = { top: 0, right: 0 }) {
    state.position['top'] = position.top;
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    if ((position.right + state.commentBoxWidth) > (window.innerWidth / rootFontSize)) {
        state.position['right'] = window.innerWidth / rootFontSize - state.commentBoxWidth;
    } else {
        state.position['right'] = position.right;
    }
}

function onOutsideClick(event: any) {
    // Check if the click was outside of the commented div
    if (addCommentRef.value && !addCommentRef.value?.contains(event.target)) {
        if (state.showAddComment) {
            state.showAddComment = false;
            state.model.commentText = ""
            removeClass("select-comment")
        }
    }
    const commentId = event?.target?.dataset?.commentid?.split(`${commentIdPrefix}_`)[1] || event?.target?.parentElement?.dataset?.commentid?.split(`${commentIdPrefix}_`)[1];
    if (!state.comment?.id || state.comment?.id?.toString() !== commentId) {
        state.showComment = false;
    }
};

// need to remove class incase user click anywhere else or api gives error
function removeClass(id: string = "") {
    emit('remove:span:class', id)
}

async function onSend() {
    state.commentsLoading = true;
    if (state.model?.commentText) {
        const alertFormData = store.getters['alertCreate/getAlertFormData'];
        const createCommentPayload = {
            content: state.model?.commentText,
            field_data: {
                key: props.modelKey,
                type: 'system',
            },
        };
        const modelKeyMap: Record<string, any> = {
            custom_fields: {
                key: props.modelKeyCategory?.field_id,
                type: props.modelKey,
            },
            optional_fields: {
                key: props.modelKeyCategory?.field_name,
                type: props.modelKey,
            },
            recommended_actions: {
                key: alertFormData?.recommended_actions?.[props?.modelIndex]?.id,
                type: props.modelKey,
            },
        };

        if (modelKeyMap[props.modelKey]) {
            createCommentPayload.field_data = modelKeyMap[props.modelKey];
        }

        const response: any = await createComment(createCommentPayload);
        if (response?.id) {
            const newCommentid = `${commentIdPrefix}_${response?.id}`;
            const partialAlertResponse = await submitPartialAlertWrapper(alertFormData, response.id, newCommentid);
            if (partialAlertResponse) {
                let doc = document.querySelector(`[data-commentid="select-comment"]`);
                if (doc) {
                    doc.setAttribute("data-commentid", newCommentid);
                }
                store.dispatch('alertCreate/setComments');
                fetchComments();
                state.commentsListState.push({
                    user: {
                        email: userDetails.value?.email,
                        name: userDetails.value?.first_name
                    },
                    modified: response?.modified,
                    content: state.model?.commentText,
                    id: response?.id,
                });
            } else {
                removeClass("select-comment");
            }
        } else {
            removeClass("select-comment");
        }
        state.commentsLoading = false;
        state.showAddComment = false;
        state.model.commentText = "";
    }
}

function updateModelValue($event: any) {
    state.model.commentText = $event;
};

async function submitPartialAlertWrapper(alertFormData: Record<string, any>, commentId: number, newCommentId: string) {

    let modalValue = props.modelValue;
    modalValue = modalValue?.replace(/select-comment/g, newCommentId)
    emit('update:modelValue', modalValue);
    let partialAlertPayload = {
        [props.modelKey]: modalValue,
        associated_comment_id: commentId,
    }
    if (props.modelKey === 'custom_fields') {
        partialAlertPayload[`${props.modelKey}`] = { [props.modelKeyCategory.field_id]: modalValue };
    } else if (props.modelKey === 'optional_fields') {
        partialAlertPayload[`${props.modelKey}`] = { [props.modelKeyCategory.field_name]: modalValue, ...props.fangDefangStatus, };
    } else if (props.modelKey === 'recommended_actions') {
        let fieldModel = alertFormData?.recommended_actions[props?.modelIndex];
        partialAlertPayload[`${props.modelKey}`] = [{
            [fieldModel.id]: modalValue
        }]
    } else {
        partialAlertPayload = { ...partialAlertPayload, ...props.fangDefangStatus }
    }

    const response = await submitPartialAlert(partialAlertPayload);
    return response;
}

onMounted(() => {
    document.addEventListener("click", onOutsideClick);
});

onBeforeUnmount(() => {
    document.removeEventListener("click", onOutsideClick);
});

watch(
    () => props.commentData,
    async () => {
        if (props.commentData) {
            onCallback(props.commentData)
        }
    },
    { immediate: true }
);

</script>

<template>
    <div id="add-comment" ref="addCommentRef" v-if="state.showAddComment && !state.commentsLoading"
        :style="{ top: state.position.top + 'rem', right: state.position.right + 'rem', 'z-index': '2147483640', 'max-width': '40rem !important' }"
        class="cyw-mt-4 cyw-bg-N10 cyw-position-absolute cyw-shadow-600 cyw-round-lg cyw-p-3 cyw-border cyw-w-75 cyw-flex-align-center">
        <CreateComment :userDetails="userDetails" :model="state.model.commentText" @create:comment="onSend()"
            @update:model="updateModelValue" />
    </div>
    <div id="show-comment" v-else-if="state.showComment && !state.commentsLoading"
        :style="{ top: state.position.top + 'rem', right: state.position.right + 'rem', 'z-index': '2147483640', alignItems: 'baseline', 'max-width': '40rem !important' }"
        class="cyw-flex cyw-mt-4 cyw-bg-N10 cyw-shadow-200 cyw-position-absolute cyw-round-lg cyw-p-3 cyw-border cyw-w-75">
        <ShowComments :userDetails="userDetails" :comment="state.comment" />
    </div>
</template>
