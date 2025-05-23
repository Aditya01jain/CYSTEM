import { Module } from 'vuex';

// Define the state type
export interface AlertState {
  alertDetails: Record<string, any>;
  list: Record<string, any>;
  filters: Record<string, any>;
  appliedFilters: Record<string, any>;
}

// Initial state
const state: AlertState = {
  list: {},
  filters: {},
  appliedFilters: {},
  alertDetails: {},
};

// Define the alert module
const alert: Module<AlertState, unknown> = {
  namespaced: true,
  state,
  getters: {
    getFilters: (state) => state.filters,
    getAppliedFilters: (state) => state.appliedFilters,
    getList: (state) => (component: string) => state.list[component],
    getAlertDetails: (state) => state.alertDetails
  },
  mutations: {
    updateList(state, data: Record<string, any>) {
      state.list[data.component] = data.data;
    },
    updateFilter(state, data: Record<string, any>) {
      state.filters = { ...state.filters, ...data };
    },
    updateAppliedFilter(state, data: Record<string, any>) {
      state.appliedFilters = data;
    },
    removeFilterByKey(state, key: string) {
      const { [key]: _, ...rest } = state.filters;
      state.filters = rest;
    },
    removeAllFilter(state: Record<string, any>) {
      if(state.filters?.tab_id) {
        state.filters = { tab_id: state.filters.tab_id }
        return;
      }
      state.filters = {};
    },
    updateAlertDetails(state, dataObject: Record<string, any>) {
      state.alertDetails = dataObject
    }
  },
  actions: {
    setAlertDetails({ commit }, dataObject: Record<string, any>) {
      commit('updateAlertDetails', dataObject);
    },
    setList({ commit }, data: Record<string, any>) {
      commit('updateList', data);
    },
    setFilter({ commit }, data: Record<string, any>) {
      commit('updateFilter', data);
    },
    setAppliedFilter({ commit }, data: Record<string, any>) {
      commit('updateAppliedFilter', data);
    },
    removeSingleFilter({ commit }, key: string) {
      commit('removeFilterByKey', key);
    },
    removeAllFilter({ commit }) {
      commit('removeAllFilter');
    }
  }
};

export default alert;
