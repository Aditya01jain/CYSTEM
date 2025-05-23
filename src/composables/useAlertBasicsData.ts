import { inject } from 'vue';
import { useStore } from '@/store';
import { transformUserGroupData } from '@/utils';
import { useCommonData } from './useCommonData';

const { isPermittedToMe } = useCommonData();

export const useAlertBasicsData = () => {
  const store: Record<string, any> = useStore();
  const $api: any = inject('$api');
  const $notify: any = inject('$notify');
  const $session: Record<string, any> = inject('$session') || {};

  const fetchAlerts = async (params = {}) => {
    try {
      const { data } = await $api.get('analyst.alertlist', {
        params: params
      });
      store.dispatch('alert/setList', {
        component: 'alert-list',
        data: data
      });
    } catch {
      //
    }
  };

  const fetchGroupsWithCategory = async () => {
    try {
      const { data } = await $api.get('analyst.alertTeamsListing');
      store.dispatch('alertCreate/setAlertFormListData', {
        key: 'analyst-groups',
        value: data.results
      });
    } catch {
      //
    }
  };

  const fetchAlertCategories = async () => {
    try {
      const { data } = await $api.get('analyst.alertformcategories', {
        params: {
          type: 'story',
          view: 'sa',
          is_active: true
        }
      });
      data.filter((item: Record<string, any>) => item.is_active);
      store.dispatch('alertCreate/setAlertFormListData', {
        key: 'category-list',
        value: data
      });
    } catch {
      //
    }
  };

  const fetchAlertCampaign = async () => {
    try {
      const { data } = await $api.get('analyst.alertformcampaign', {
        params: { all_data: true, is_active: true }
      });
      store.dispatch('alertCreate/setAlertFormListData', {
        key: 'campaign-list',
        value: data.results
      });
    } catch {
      //
    }
  };

  const setTlpList = (data: Record<string, any>) => {
    store.dispatch('alertCreate/setAlertFormListData', {
      key: 'tlp-list',
      value: data
    });
  };

  const fetchActiveCategory = async (id: string) => {
    try {
      const { data } = await $api.get('analyst.alertformcategories', {
        id
      });
      store.dispatch('alertCreate/setAlertFormListData', {
        key: 'active-category',
        value: data
      });
    } catch {
      //
    }
  };

  const fetchAnalysisFieldsMap = async () => {
    try {
      const { data } = await $api.get('analyst.alertformanalysisfields', {
        params: { sa_view: 1 }
      });
      store.dispatch('alertCreate/setAlertFormListData', {
        key: 'analysis-field-map',
        value: data
      });
    } catch {
      //
    }
  };

  const fetchReferenceName = async (params: Record<string, any>) => {
    try {
      const { data } = await $api.get('analyst.alertreferencename', {
        params: params
      });
      return data;
    } catch (error) {
      return error;
    }
  };

  const fetchHandlingInstructions = async () => {
    try {
      const { data } = await $api.get('analyst.alertformhandlinginstructions', {
        params: { is_active: true }
      });
      store.dispatch('alertCreate/setAlertFormListData', {
        key: 'handling-instructions',
        value: data
      });
    } catch {
      //
    }
  };

  const fetchUserGroups = async () => {
    try {
      const promises = [
        $api.get('analyst.alertformusergroups'),
        $api.get('analyst.alertformorgrg', { params: { all_data: true } })
      ];
      await Promise.all(promises).then((result) => {
        const data = [...(result[0]?.data || []), ...(result[1]?.data?.results || [])];
        store.dispatch('alertCreate/setAlertFormListData', {
          key: 'user-groups',
          value: transformUserGroupData(data)
        });
      });
    } catch {
      //
    }
  };

  const fetchUserGroupSet = async () => {
    try {
      const { data } = await $api.get('analyst.alertformusergroupset', {
        params: {
          all_data: true,
          is_active: true
        }
      });
      store.dispatch('alertCreate/setAlertFormListData', {
        key: 'user-group-set',
        value: data.results
      });
    } catch {
      //
    }
  };

  const fetchRecipientUsers = async (params: Record<string, any>) => {
    try {
      const { data } = await $api.get('analyst.alertformrecipientusers', {
        params: params
      });
      return { success: data.results };
    } catch (error) {
      return { error };
    }
  };

  const fetchSlas = async () => {
    try {
      const { data } = await $api.get('analyst.slas');
      store.dispatch('alertCreate/setAlertFormListData', {
        key: 'slas-list',
        value: data.results
      });
    } catch {
      //
    }
  };

  const fetchThreatAssessmentTemplates = async () => {
    try {
      const { data } = await $api.get('analyst.threatAssessmentTemplates', {
        params: { is_active: true, all_data: true }
      });
      store.dispatch('alertCreate/setAlertFormListData', {
        key: 'templates',
        value: data.results
      });
    } catch {
      //
    }
  };

  const uploadFileAndGetDocumentId = async (payload: Record<string, any>) => {
    try {
      const response = await $api.post('analyst.alertfileupload', payload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return { success: response };
    } catch (error) {
      return { error: error };
    }
  };

  const uploadFileToDocLibrary = async (payload: Record<string, any>) => {
    try {
      const response = await $api.put('analyst.alertdoclibupload', payload);
      return response;
    } catch (error: any) {
      return error;
    }
  };

  const fetchDocLibraryList = async (params: Record<string, any>) => {
    try {
      const { data } = await $api.get('analyst.alertdoclibrarylist', {
        params: params
      });
      return data;
    } catch (error: any) {
      return error;
    }
  };

  const extractIndicators = async (payload: Record<string, any>) => {
    try {
      const { code, data } = await $api.post('analyst.alertformextractindicators', payload);
      if (code === 200) {
        $notify.success({ title: 'Success', message: 'Indicators Extracted Successfully' });
      }
      return data;
    } catch (error: any) {
      return error;
    }
  };

  const fetchConferenceDetails = async (params: Record<string, any>) => {
    try {
      const { data } = await $api.get('analyst.alertConferenceDial', {
        params: params
      });
      return data;
    } catch (error: any) {
      return error;
    }
  };

  const fetchParsedIndicators = async (payload: Record<string, any> = {}, id: string) => {
    try {
      const { data } = await $api.post('analyst.alertformparseindicators', payload, { id: id });
      return { success: data };
    } catch (error: any) {
      return { error };
    }
  };

  const fetchTagsGroup = async (params: Record<string, any> = {}) => {
    try {
      const { data } = await $api.get('analyst.alertformtagsgroup', {
        params: params
      });
      return { success: data.results };
    } catch (error: any) {
      return { error };
    }
  };

  const fetchTags = async (params: Record<string, any>) => {
    try {
      const { data } = await $api.get('analyst.alertformtags', {
        params: params
      });
      return { success: data };
    } catch (error: any) {
      return { error };
    }
  };

  const addTags = async (params: Record<string, any>) => {
    params.tag_name = params.tag_name?.substring(params.tag_name?.indexOf(':') + 1).trim();
    try {
      const { data } = await $api.post('analyst.alertformtags', params);
      return { success: data };
    } catch (error: any) {
      return { error };
    }
  };

  const expireAlert = async (payload: Record<string, any>) => {
    try {
      const response = await $api.put('analyst.alertsubmitform', payload);
      return { success: response };
    } catch (error: any) {
      return { error };
    }
  };

  const submitAlertForm = async () => {
    try {
      const alertFormData = store.getters['alertCreate/getAlertFormData'];
      const url =
        alertFormData.update_post_published && alertFormData.status === 'PUBLISHED'
          ? 'analyst.editalert'
          : 'analyst.alertsubmitform';
      const response = await $api[alertFormData.short_id ? 'put' : 'post'](url, {
        ...alertFormData
      });
      store.dispatch('alertCreate/resetAlertFormData');
      store.dispatch('alertCreate/resetAlertTempData');
      return { success: response };
    } catch (error: any) {
      return error;
    }
  };

  const updateAlertFormStore = (key: string, value: any) => {
    store.dispatch('alertCreate/setAlertFormData', {
      key,
      value
    });
  };

  const fetchRecipientCount = async (payload: Record<string, any>) => {
    try {
      const { data } = await $api.post('analyst.alertRecipientCount', payload);
      return data;
    } catch {
      //
    }
  };

  const fetchRelatedAlertsCount = async (payload: Record<string, any>) => {
    try {
      const { data } = await $api.post('analyst.relatedAlertsCount', payload);
      return data;
    } catch {
      //
    }
  };

  const fetchRelatedAlerts = async (params: Record<string, any>) => {
    try {
      const { data } = await $api.get('analyst.relatedAlerts', {
        params: params
      });
      return data;
    } catch {
      //
    }
  };

  const fetchFilters = async (component: string, useNew: boolean = false) => {
    try {
      const { data } = await $api.get(useNew ? 'analyst.alertfiltersnew' : 'analyst.alertfilters', {
        params: { component: component }
      });
      let filters = data.map((item: any) => ({
        ...item,
        key: item.key,
        label: item.options,
        option_key: item.send,
        option_label: item.display,
        options: item.values,
        type: ['static', 'drop_down'].includes(item.field_type)
          ? item.sub_type === 'bool'
            ? 'select'
            : 'multi-select'
          : item.field_type,
        api: item.url
      }));
      return filters.filter((filter: Record<string, any>) => filter.key !== 'modified_date');
    } catch {
      //
    }
  };

  const fetchAlertTemplate = async (params: Record<string, any> = {}) => {
    try {
      const { data } = await $api.get('analyst.alertTemplate', {
        params: params
      });
      return data;
    } catch {
      //
    }
  };

  const fetchTdList = async (params: Record<string, any> = {}) => {
    try {
      const { data } = await $api.get('analyst.tdList', {
        params: params
      });
      return data;
    } catch {
      //
    }
  };

  const fetchParseUrls = async (payload: Record<string, any>) => {
    try {
      const { data } = await $api.post('analyst.alertParseUrls', payload);
      return data;
    } catch {
      //
    }
  };

  const fetchRegions = async (params: Record<string, any> = {}) => {
    try {
      const { data } = await $api.get('analyst.alertListRegions', {
        params: params
      });
      return data;
    } catch {
      //
    }
  };

  const fetchAlertData = async (params: Record<string, any> = {}) => {
    try {
      const { data } = await $api.get('analyst.alertlist', {
        params: params
      });
      return data;
    } catch (error: any) {
      return { error };
    }
  };

  const lockAlert = async (payload: Record<string, any>, lock = true) => {
    let type = 'post';
    if (!lock) type = 'put';
    try {
      const { data } = await $api[type]('analyst.alertLock', payload);
      return data;
    } catch {
      //
    }
  };

  const fetchIntelSubmissions = async (params: Record<string, any>) => {
    try {
      const { data } = await $api.get('analyst.intelList', {
        params: params
      });
      return data;
    } catch {
      //
    }
  };

  const fetchRFI = async (params: Record<string, any>) => {
    try {
      const { data } = await $api.get('analyst.rfiList', {
        params: params
      });
      return data;
    } catch {
      //
    }
  };

  const createAlertFromIntel = async (payload: Record<string, any>) => {
    try {
      const { data } = await $api.post('analyst.createAlertFromIntel', payload);
      return data;
    } catch {
      //
    }
  };

  const sendRemainder = async (type: string, short_id: string) => {
    const api = type === 'app' ? '/admin/card_notification/' : '/admin/card_email_notification/';
    try {
      const { data } = await $api.post(api, { short_id: short_id });
      $notify.success({ title: 'Successfully Sent' });
      return data;
    } catch {
      //
    }
  };

  const exportAlertFromTable = async (type: string, content: string, short_id: string) => {
    try {
      const { data } = await $api.get('admin/export/sa/' + type + `/${short_id}/`);
      return type === 'xml' ? data : JSON.stringify(data);
    } catch {
      //
    }
  };

  const fetchAttackMatrix = async () => {
    try {
      const { data } = await $api.get('analyst.attackMatrix');
      return data.result;
    } catch {
      //
    }
  };

  const fetchAttackTactic = async (domain: string) => {
    try {
      const { data } = await $api.get('analyst.attackTactic', {
        params: {
          all_data: true,
          domain: domain
        }
      });
      return data.results;
    } catch {
      //
    }
  };

  const fetchAttackSubTechnique = async (tactic_id: string, technique_id: string) => {
    try {
      const { data } = await $api.get(
        `admin/attack_framework/attack-subtechnique/${technique_id}/`,
        {
          params: {
            tactic_mitre_id: tactic_id,
            technique_mitre_id: technique_id
          }
        }
      );
      return data.result;
    } catch {
      //
    }
  };

  const fetchTZs = async () => {
    try {
      const { data } = await $api.get('analyst.timezoneList');
      return data.timeZonelist;
    } catch {
      //
    }
  };

  const createFolder = async (payload: Record<string, any>) => {
    try {
      const { data } = await $api.post('analyst.createFolder', payload);
      return data;
    } catch {
      //
    }
  };

  const openAlertDetailsView = (id: string) => {
    if ($session.openAlertDetails) {
      $session.openAlertDetails(id);
      return;
    }
    const { protocol, host } = window.location;
    const url = `${protocol}//${host}/dashboard/situational-awareness/details/${id}`;
    window.open(url, '_blank');
  };

  const disabledTlps = (selectedTlp: string) => {
    switch (selectedTlp) {
      case 'RED':
        return ['AMBER+STRICT', 'AMBER', 'GREEN', 'CLEAR', 'WHITE'];
      case 'AMBER+STRICT':
        return ['AMBER', 'GREEN', 'CLEAR', 'WHITE'];
      case 'AMBER':
        return ['GREEN', 'CLEAR', 'WHITE'];
      case 'GREEN':
        return ['CLEAR', 'WHITE'];
      default:
        return [];
    }
  };

  const tdlFiles = async (params: Record<string, any>) => {
    try {
      const { data } = await $api.get('analyst.tdlFilesAlert', {
        params: params
      });
      return data;
    } catch {
      //
    }
  };

  const communititesForAlert = async (params: Record<string, any>) => {
    try {
      const { data } = await $api.get('analyst.alertSharingCommuntiy', {
        params: params
      });
      return data;
    } catch {
      //
    }
  };

  const publishToCommunities = async (payload: Record<string, any>) => {
    try {
      const { data } = await $api.post('analyst.publishToCommunities', payload);
      return data;
    } catch {
      //
    }
  };

  const tlpEmailConfig = async (params: Record<string, any> = {}) => {
    try {
      const { data } = await $api.get('analyst.tlpEmailConfiguration', {
        params: params
      });
      return data;
    } catch {
      //
    }
  };

  async function fetchOptions({ filter, value }: Record<string, any>) {
    try {
      const { data }: Record<string, any> = await $api.get(`/admin/${filter.api}`, {
        params: filter.filters
      });
      return data.filter((val: Record<string, any>) => value.includes(val[filter.option_key]));
    } catch {
      //
    }
  }

  async function checkSpeedBump() {
    try {
      const alertFormData = store.getters['alertCreate/getAlertFormData'];
      const { data } = await $api.post('analyst.speedBumpCondition', {
        ...alertFormData,
        check_rules_for_alert: true,
        img_preview_path: null
      });
      return data;
    } catch {
      return {};
    }
  }

  async function fetchSharingRules() {
    try {
      const alertFormData = store.getters['alertCreate/getAlertFormData'];
      const { data } = await $api.post('analyst.checkSharingRules', {
        ...alertFormData,
        img_preview_path: null,
        ...(alertFormData['custom_fields']
          ? { custom_fields: alertFormData.custom_fields }
          : { custom_fields: {} })
      });
      return data;
    } catch {
      //
    }
  }

  async function fetchParentFolderRg(parentId: string) {
    try {
      const { data } = await $api.get('analyst.fetchFolderRg', {
        params: { id: parentId }
      });
      return data?.document_group;
    } catch (error: any) {
      return error;
    }
  }

  const fetchMCLStatement = async (params: Record<string, any>) => {
    const { created_from_intel, short_id } = params;
    if (!isPermittedToMe('view', 'mcl') || !created_from_intel) return;
    try {
      const { data } = await $api.get('analyst.mclstmtalert', { id: short_id });
      return data.result;
    } catch (error: any) {
      return error.error.detail;
    }
  };

  async function attachFilesToAlert(payload: Record<string, any>, short_id: string) {
    try {
      const { data } = await $api.put(`admin/card_sa/${short_id}/update-attachments/`, payload);
      return data;
    } catch (error: any) {
      return error;
    }
  }

  async function alertsBulkAction(payload: Record<string, any>) {
    try {
      const { data } = await $api.post('analyst.alertsBulkAction', payload);
      return { success: data };
    } catch (error: any) {
      return error;
    }
  }

  return {
    fetchAlerts,
    fetchAlertCategories,
    fetchAlertCampaign,
    setTlpList,
    fetchActiveCategory,
    fetchAnalysisFieldsMap,
    fetchReferenceName,
    fetchHandlingInstructions,
    fetchUserGroups,
    fetchUserGroupSet,
    fetchRecipientUsers,
    fetchSlas,
    fetchThreatAssessmentTemplates,
    uploadFileAndGetDocumentId,
    uploadFileToDocLibrary,
    fetchDocLibraryList,
    fetchParsedIndicators,
    extractIndicators,
    fetchTagsGroup,
    fetchTags,
    addTags,
    expireAlert,
    submitAlertForm,
    updateAlertFormStore,
    fetchConferenceDetails,
    fetchRecipientCount,
    fetchRelatedAlertsCount,
    fetchRelatedAlerts,
    fetchFilters,
    fetchAlertTemplate,
    fetchTdList,
    fetchParseUrls,
    fetchRegions,
    fetchAlertData,
    lockAlert,
    fetchIntelSubmissions,
    fetchRFI,
    createAlertFromIntel,
    sendRemainder,
    exportAlertFromTable,
    fetchAttackMatrix,
    fetchAttackTactic,
    fetchAttackSubTechnique,
    fetchTZs,
    createFolder,
    openAlertDetailsView,
    disabledTlps,
    tdlFiles,
    communititesForAlert,
    publishToCommunities,
    tlpEmailConfig,
    fetchOptions,
    checkSpeedBump,
    fetchSharingRules,
    fetchParentFolderRg,
    fetchMCLStatement,
    attachFilesToAlert,
    alertsBulkAction,
    fetchGroupsWithCategory
  };
};
