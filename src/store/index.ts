import { createStore, Store as VuexStore, CommitOptions, DispatchOptions } from 'vuex';
import common, { CommonState } from './modules/common';
import alert, { AlertState } from './modules/alert';
import alertCreate, { AlertCreateState } from './modules/alertCreate';

// Define the root state type
export interface RootState {
  common: CommonState;
  alert: AlertState;
  alertCreate: AlertCreateState;
}

// Create the store
const store = createStore<RootState>({
  modules: {
    common,
    alert,
    alertCreate
  }
});

// Define types for store access in components
export type Store = Omit<VuexStore<RootState>, 'commit' | 'dispatch'> & {
  commit<
    K extends
      | keyof typeof common.mutations
      | keyof typeof alert.mutations
      | keyof typeof alertCreate.mutations,
    P extends Parameters<
      (keyof typeof common.mutations & typeof alert.mutations & typeof alertCreate.mutations)[K]
    >[1]
  >(
    key: K,
    payload?: P,
    options?: CommitOptions
  ): ReturnType<
    (typeof common.mutations & typeof alert.mutations & typeof alertCreate.mutations)[K]
  >;
} & {
  dispatch<
    K extends
      | keyof typeof common.actions
      | keyof typeof alert.actions
      | keyof typeof alertCreate.actions
  >(
    key: K,
    payload?: Parameters<
      (typeof common.actions & typeof alert.actions & typeof alertCreate.actions)[K]
    >[1],
    options?: DispatchOptions
  ): ReturnType<(typeof common.actions & typeof alert.actions & typeof alertCreate.actions)[K]>;
};

export function useStore(): Store {
  return store as Store;
}

export default store;
