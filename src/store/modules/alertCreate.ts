import { Module } from 'vuex';
import { REQUIRED_FILEDS_MODEL } from '@/components/alertCreate/config';

// Define the state type
export interface AlertCreateState {
  alertFormData: Record<string, any>;
  alertFormListData: Record<string, any>;
  formValid: Record<string, any>;
  alertTempData: Record<string, any>;
}

const EXTRA_FIELDS: Record<string, any> = {
  card_kiq_primary: [],
  card_kiq_secondary: [],
  card_kit_primary: null,
  card_kit_secondary: null,
  content_te: '',
  title_te: ''
};

// Initial state
const state: AlertCreateState = {
  alertFormData: {
    ...EXTRA_FIELDS,
    ...REQUIRED_FILEDS_MODEL
  },
  alertFormListData: {},
  alertTempData: {},
  formValid: {
    basic: {},
    additional: {},
    sending: {}
  }
};

// Define the alert module
const alertCreate: Module<AlertCreateState, unknown> = {
  namespaced: true,
  state,
  getters: {
    getAlertFormData: (state) => state.alertFormData,
    getAlertFormListData: (state) => state.alertFormListData,
    getFormValid: (state) => state.formValid,
    getAlertTempData: (state) => state.alertTempData,
    editAlertMode: (state) =>
      state.alertFormData?.status === 'PUBLISHED' && state.alertFormData?.published_time,
  },
  mutations: {
    updateAlertFormData(state, dataObject: Record<string, any>) {
      state.alertFormData[dataObject.key] = dataObject.value;
    },
    updateAlertForm(state, dataObject: Record<string, any>) {
      state.alertFormData = { ...state.alertFormData, ...dataObject };
    },
    pristineAlertFormData(state) {
      state.alertFormData = {
        ...EXTRA_FIELDS,
        ...REQUIRED_FILEDS_MODEL
      };
      state.alertFormListData = {};
    },
    updateAlertFormListData(state, dataObject: Record<string, any>) {
      state.alertFormListData[dataObject.key] = dataObject.value;
    },
    updateFormValid(state, dataObject: Record<string, any>) {
      const [form] = Object.keys(dataObject);
      state.formValid[form] = { ...state.formValid[form], ...dataObject[form] };
    },
    updateAlertTempData(state, dataObject: Record<string, any>) {
      state.alertTempData = { ...state.alertTempData, ...dataObject };
    },
    pristineAlertTempData(state) {
      state.alertTempData = {};
    }
  },
  actions: {
    setAlertFormData({ commit }, dataObject: Record<string, any>) {
      commit('updateAlertFormData', dataObject);
    },
    setAlertForm({ commit }, dataObject: Record<string, any>) {
      commit('updateAlertForm', dataObject);
    },
    resetAlertFormData({ commit }) {
      commit('pristineAlertFormData');
    },
    setAlertFormListData({ commit }, dataObject: Record<string, any>) {
      commit('updateAlertFormListData', dataObject);
    },
    setFormValid({ commit }, dataObject: Record<string, any>) {
      commit('updateFormValid', dataObject);
    },
    setAlertTempData({ commit }, dataObject: Record<string, any>) {
      commit('updateAlertTempData', dataObject);
    },
    resetAlertTempData({ commit }) {
      commit('pristineAlertTempData');
    }
  }
};

export default alertCreate;
