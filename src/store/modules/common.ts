import { Module } from 'vuex';

// Define the state type
export interface CommonState {
  userDetails: Record<string, any>;
  tenantDetails: Record<string, any>;
  formDetails: Record<string, any>;
  locations: Record<string, any>[];
  communitySharing: Record<string, any>[];
}

// Initial state
const state: CommonState = {
  userDetails: {},
  tenantDetails: {},
  formDetails: {},
  locations: [],
  communitySharing: []
};

// Define the alert module
const common: Module<CommonState, unknown> = {
  namespaced: true,
  state,
  getters: {
    getUserDetails: (state) => state.userDetails,
    getTenantDetails: (state) => state.tenantDetails,
    getFormDetails: (state) => state.formDetails,
    getLocations: (state) => state.locations,
    getCommunitySharing: (state) => state.communitySharing,
    getDefaultPageSize: (state) => state.userDetails?.dashboard_default_page_size || 10
  },
  mutations: {
    updateUserDetails(state, dataObject: Record<string, any>) {
      state.userDetails = dataObject;
    },
    updateTenantDetails(state, dataObject: Record<string, any>) {
      state.tenantDetails = dataObject;
    },
    updateFormDetails(state, dataObject: Record<string, any>) {
      state.formDetails = { ...state.formDetails, ...dataObject };
    },
    updateLocations(state, dataObject: Record<string, any>[]) {
      state.locations = dataObject;
    },
    updateCommunitySharing(state, dataObject: Record<string, any>[]) {
      state.communitySharing = dataObject;
    }
  },
  actions: {
    setUserDetails({ commit }, dataObject: Record<string, any>) {
      const { tenant } = dataObject;
      commit('updateUserDetails', dataObject);
      commit('updateTenantDetails', tenant);
    },
    setFormDetails({ commit }, dataObject: Record<string, any>) {
      commit('updateFormDetails', dataObject);
    },
    setLocations({ commit }, dataObject: Record<string, any>[]) {
      commit('updateLocations', dataObject);
    },
    setCommunitySharing({ commit }, dataObject: Record<string, any>[]) {
      commit('updateCommunitySharing', dataObject);
    }
  }
};

export default common;
