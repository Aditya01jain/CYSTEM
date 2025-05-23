<script setup lang="ts">
import { reactive } from 'vue';
import CreateComment from './CreateComment.vue';
import ShowComments from './ShowComments.vue'
import { useCommentsStore } from '@/store/modules/useComments';
const { state: commentsState, createComment, fetchComments, userDetails } = useCommentsStore();

const state = reactive({
  model: {
    comment: ""
  }
})

async function onCreateComment() {
  await createComment({ content: state.model.comment })
  fetchComments();
  state.model.comment = ""
}

function updateModelValue($event: any) {
  state.model.comment = $event;
};

</script>
<template>
  <div id="add-comment" class="cyw-flex-align-center cyw-mt-4">
    <CreateComment :userDetails="userDetails" :model="state.model.comment" @create:comment="onCreateComment"
      @update:model="updateModelValue" />
  </div>
  <div v-if="commentsState.loading">
    <CyShimmer type="card"></CyShimmer>
  </div>
  <div v-else class="cyw-flex-align-center cyw-flex-wrap cyw-mt-4">
    <template v-if="commentsState.commentsList?.comments_list?.length">
      <div v-for="(comment, index) in commentsState.commentsList.comments_list" :key="index"
        class="cyw-flex cyw-mb-4 cyw-w-100">
        <ShowComments :userDetails="userDetails" :comment="comment" />
      </div>
    </template>
  </div>
</template>