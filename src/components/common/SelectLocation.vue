<script setup lang="ts">
import { reactive, computed, onMounted } from 'vue';
import store from '@/store';

const props = defineProps({
  selected: {
    default: {}
  },
  disabled: {
    default: false
  },
  dataTestid: {
    default: ''
  }
});

const emit = defineEmits(['selectedLocation']);

const KEYS = ['country', 'state', 'city', 'site'] as Array<string>;

const state = reactive({
  location: {
    country: [] as Record<string, any>[],
    state: [] as Record<string, any>[],
    city: [] as Record<string, any>[],
    site: [] as Record<string, any>[]
  } as Record<string, any>
});

const locations = computed(() => store.getters['common/getLocations']);

const updateLocations = (index: number, event: any) => {
  KEYS.slice(index).forEach((key, i) => {
    state.location[KEYS[index + i]] = [];
  });
  state.location[KEYS[index]] = event;
  emit('selectedLocation', state.location);
};

const openNextSelect = (index: number) => {
  if (state.location?.[KEYS[index]]?.length > 1) return false;
  return state.location?.[KEYS[index]]?.[0]?.[KEYS[index + 1]]?.length;
};

onMounted(() => {
  state.location = props.selected;
});
</script>

<template>
  <cy-select
    :data="locations"
    multiple
    size="md"
    label="Country"
    placeholder="Select location"
    valueIdentifier="country_name"
    identifier="country_name"
    :showSearch="true"
    search-identifier="country_name"
    :model-value="state.location.country"
    @update:model-value="updateLocations(0, $event)"
    :disabled="props.disabled"
    :data-testid="`${props.dataTestid}-country`"
  />
  <cy-select
    v-if="openNextSelect(0)"
    :data="state.location.country[0].state"
    multiple
    label="State"
    size="md"
    valueIdentifier="state_name"
    identifier="state_name"
    :showSearch="true"
    search-identifier="state_name"
    :model-value="state.location.state"
    @update:model-value="updateLocations(1, $event)"
    :disabled="props.disabled"
    :data-testid="`${props.dataTestid}-state`"
  />
  <cy-select
    v-if="openNextSelect(1)"
    :data="state.location.state[0].city"
    multiple
    label="City"
    size="md"
    valueIdentifier="city_name"
    identifier="city_name"
    :showSearch="true"
    search-identifier="city_name"
    :model-value="state.location.city"
    @update:model-value="updateLocations(2, $event)"
    :disabled="props.disabled"
    :data-testid="`${props.dataTestid}-city`"
  />
  <cy-select
    v-if="openNextSelect(2)"
    :data="state.location.city[0].site"
    multiple
    label="Location"
    size="md"
    valueIdentifier="location_site"
    identifier="location_site"
    :showSearch="true"
    search-identifier="location_site"
    :model-value="state.location.site"
    @update:model-value="updateLocations(3, $event)"
    :disabled="props.disabled"
    :data-testid="`${props.dataTestid}-location`"
  />
</template>
