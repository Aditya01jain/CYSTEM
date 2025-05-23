import { inject, reactive, computed } from 'vue';
import { defineStore } from 'pinia';
import { useStore } from '@/store';
import { useCommonData } from '@/composables/useCommonData';
import { ALERT_STATUS } from '@/components/alertCreate/config';

export const useCommentsStore = defineStore('comments', () => {
  const store = useStore();
  const $api: any = inject('$api');
  const state = reactive({
    comments: {},
    loading: false,
    commentsLoading: false,
    commentsList: {},
    commentCount: 0
  });
  const { isPermittedToMe } = useCommonData();

  const alertFormData = computed(() => store.getters['alertCreate/getAlertFormData']);

  const visibleComments = computed(
    () =>
      isPermittedToMe('submitted', 'sa') &&
      alertFormData.value.short_id &&
      [
        ALERT_STATUS.SUBMITTED,
        ALERT_STATUS.REVERTED,
        ALERT_STATUS.SCHEDULED,
        ALERT_STATUS.DRAFT,
        ALERT_STATUS.PUBLISHED
      ].includes(alertFormData.value.status)
  );

  const userDetails = computed(() => {
    return store.getters['common/getUserDetails'];
  });

  async function fetchComments(params: Record<string, any> = {}) {
    if (!visibleComments.value) return;
    try {
      let updatedParam = `${alertFormData.value?.short_id}`;
      if (params?.commentId) {
        updatedParam = `${alertFormData.value?.short_id}/${params?.commentId}`;
        state.commentsLoading = true;
      } else {
        state.loading = true;
      }
      const { data } = await $api.get('analyst.alertComments', {
        id: updatedParam
      });
      if (params?.commentId) {
        state.comments = data;
      } else {
        state.commentsList = data;
      }
      state.commentsLoading = false;
      state.loading = false;
    } catch (error: any) {
      state.loading = false;
    }
  }

  async function createComment(params: Record<string, any> = {}) {
    try {
      state.commentsLoading = true;

      const { data } = await $api.post(
        'analyst.alertComments',
        {
          ...params
        },
        {
          id: alertFormData.value?.short_id
        }
      );
      state.commentCount++;
      state.commentsLoading = false;

      return data;
    } catch (error: any) {
      state.commentsLoading = false;
    }
  }

  async function submitPartialAlert(params: Record<string, any> = {}) {
    try {
      state.commentsLoading = true;

      const { data } = await $api.put(
        'analyst.partialAlertUpdate',
        {
          ...params
        },
        {
          id: `${alertFormData.value?.short_id}`
        }
      );
      state.commentsLoading = false;
      return data;
    } catch (error: any) {
      state.commentsLoading = false;
    }
  }

  function resetCommentCount(){
    state.commentCount = 0;
  }

  return {
    fetchComments,
    createComment,
    submitPartialAlert,
    resetCommentCount,
    state,
    visibleComments,
    userDetails
  };
});
