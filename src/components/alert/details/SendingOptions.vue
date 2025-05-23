<script lang="ts" setup>
import { reactive, onMounted } from 'vue';
import SendingOptions from '@/components/alertCreate/preview/SendingOptions.vue';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';

const { fetchRecipientCount } = useAlertBasicsData();
const props = defineProps({
  details: {
    type: Object,
    default: () => ({}),
    required: true
  },
  dataTestid: {
    type: String,
    default: 'sending-options'
  }
});

const state = reactive({
  stats: {}
});

onMounted(async () => {
  const {
    card_group,
    card_location_json,
    card_locations,
    card_organization,
    card_organization_types,
    regions,
    short_id
  } = props.details;
  state.stats = await fetchRecipientCount({
    card_group,
    card_location_json,
    card_locations,
    card_organization,
    card_organization_types,
    regions,
    short_id
  });
});
</script>

<template>
  <SendingOptions
    :stats="state.stats"
    :data="props.details"
    :data-testid="props.dataTestid"
    class="cyw-m-4"
  ></SendingOptions>
</template>
