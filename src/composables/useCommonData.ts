import { computed, inject } from 'vue';
import { useStore } from '@/store';
import { isEmpty } from 'lodash';
import { TLP_LIST, TLP_LIST_V2 } from '@/components/common/config';

export const useCommonData = () => {
  const store: Record<string, any> = useStore();
  const $api: any = inject('$api');
  const $notify: any = inject('$notify');

  const userDetails = computed(() => store.getters['common/getUserDetails']);

  const fetchUserDetails = async () => {
    try {
      const { data } = await $api.get('analyst.userdetails');
      store.dispatch('common/setUserDetails', data);
    } catch {
      //
    }
  };

  const isPermittedToMe = (type: string, module: string) => {
    if (!isEmpty(userDetails.value)) {
      const index = userDetails.value?.permissions?.indexOf(type + '_' + module);
      return index !== -1;
    }
    return false;
  };

  const isComponentAccessableToMe = (module: string) => {
    if (!isEmpty(userDetails.value)) {
      const index = userDetails.value?.component?.findIndex(
        (component: any) => component.slug === module
      );
      return index !== -1;
    }
    return false;
  };

  const isFieldAccessableToMe = (field: string) => {
    if (!isEmpty(userDetails.value)) {
      let find = false;
      userDetails.value?.component_field?.forEach((component: any) => {
        if (field === component.field_slug) {
          find = true;
          return;
        }
      });
      return find;
    }
    return false;
  };

  const isFlagAccessableToTenant = (flag: string) => {
    if (!isEmpty(userDetails.value)) {
      return userDetails.value?.tenant?.[flag];
    }
  };

  const isComponentAccessableToTenant = (module: string) => {
    if (!isEmpty(userDetails.value)) {
      const index = userDetails.value?.tenant?.component?.forEach(
        (component: any) => component.slug === module
      );
      return index != -1;
    }
  };

  const fetchLocations = async (params: Record<string, any> = {}) => {
    if (!isPermittedToMe('view', 'user_location')) return;
    if (!!store.getters['common/getLocations']?.length) return;
    try {
      const { data } = await $api.get('analyst.locations', {
        params: params
      });
      return store.dispatch('common/setLocations', data);
    } catch (error: any) {
      setToasterMsg('error', { title: 'Unable to Fetch Locations' });
    }
  };

  const fetchCommunitites = async () => {
    if (!isPermittedToMe('view', 'entity_sharing')) return;
    if (!!store.getters['common/getCommunitySharing']?.length) return;
    try {
      const { data } = await $api.get('analyst.alertCommunities', {
        params: {
          share_with_members: false,
          sortby: 'app_name'
        }
      });
      return store.dispatch('common/setCommunitySharing', data);
    } catch {
      //
    }
  };

  const tlpList = ($t: any) =>
    store.getters['common/getTenantDetails']?.tlp_version === 'v2' ? TLP_LIST_V2($t) : TLP_LIST($t);

  const setToasterMsg = (status: string, data = {}) => {
    $notify[status](data);
  };

  return {
    isPermittedToMe,
    isComponentAccessableToMe,
    isFieldAccessableToMe,
    isFlagAccessableToTenant,
    isComponentAccessableToTenant,
    fetchUserDetails,
    fetchLocations,
    setToasterMsg,
    fetchCommunitites,
    tlpList
  };
};
