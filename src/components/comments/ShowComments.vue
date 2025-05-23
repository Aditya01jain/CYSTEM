<script setup lang="ts">
import { formatDateTime } from '@/utils';
const emit = defineEmits(['handleSend']);

const props = defineProps({
    comment: {
        default: {}
    }
});
</script>
<template>
    <cy-tooltip v-if="comment?.user?.email" :content="comment?.user?.email">
        <cy-avatar :firstName="comment?.user?.name" size="3"
            class="cyw-flex-align-center cyw-mr-3 cyw-color-P600 background-BL200" />
    </cy-tooltip>
    <cy-avatar v-else :firstName="comment?.user?.name" size="3" class="cyw-flex-align-center cyw-mr-3 cyw-color-P600 background-BL200" />
    <div class="comment-box">
        <span :id="`comment-title-${comment?.id}`" class="cyw-text-f14 cyw-color-N600 cyw-flex-align-center">
            <div class="comment-box__user">
                <cy-tooltip :content="comment?.user?.name" :config="{ wrapperClass: 'cyw-text-ellipsis'}">
                    <strong>{{ comment?.user?.name }}</strong>
                </cy-tooltip>
            </div>
            <div class="cyw-flex-align-center">
                <span class="comment-box__dot cyw-bg-N600 cyw-round-full cyw-mx-2" aria-hidden="true"></span>
                <span class="comment-box__date cyw-text-regular cyw-text-f10">{{ formatDateTime(comment.modified)
                    }}</span>
            </div>
        </span>
        <cy-sanitize-html
            class="cyw-py-3 cyw-px-4 cyw-bg-N100 cyw-color-N700 cyw-text-f12 cyw-round-lg cyw-w-100 cyw-mt-2 cyw-mb-2 comment-box__comment"
            :text="comment?.content" />
    </div>
</template>

<style scoped lang="scss">
.comment-box {
    width: calc(100% - 4.8rem) !important;

    &__comment {
        overflow-wrap: anywhere;
        word-break: break-all;
        max-height: 20rem;
    }

    &__dot {
        width: 0.5rem;
        height: 0.5rem;
    }

    &__date {
        text-align: left;
    }

    &__user {
        max-width: 40%;
    }
}

.background-BL200 {
  background-color: var(--BL200);
}
</style>