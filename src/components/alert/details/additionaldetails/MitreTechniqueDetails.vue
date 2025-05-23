<script setup lang="ts">
import { initTestId } from '@/utils/testid';

const props = defineProps({
  pairsData: {
    type: Array as PropType<Record<string, any>[]>,
    default: () => []
  },
  dataTestid: {
    type: String,
    default: 'mitre-tech'
  }
});
const testId = initTestId(props.dataTestid, 'mitre-attck');
</script>
<template>
  <div class="cyw-mb-5 cyw-position-relative" v-bind="testId()">
    <div class="cyw-mb-3 cyw-flex-align-center">
      <h6 class="alert-details-subtitle-box">
        {{ $t('alerts.form-interactions.mitre-techniques-title') }}
      </h6>
      <hr class="cyw-flex-grow-1" />
    </div>
    <div
      v-for="(pair, index) in props?.pairsData"
      :key="index"
      class="cyw-flex-col cyw-my-3"
      v-bind="testId(`${index}-data`)"
    >
      <CyTag
        class="cyw-w-fit cyw-my-2"
        :text="pair?.attack_tactic?.domain?.name"
        :rounded="false"
        v-bind="testId(`${index}-matrix`)"
      />
      <div class="mitre-tactic-container">
        <CyTag
          class="cyw-w-fit cyw-my-2 mitre-tactic"
          :text="`${pair.attack_tactic.mitre_id}: ${pair.attack_tactic.title}`"
          :rounded="false"
          v-bind="testId(`${index}-tactic`)"
        />
      </div>
      <div class="mitre-technique-container">
        <CyTag
          class="cyw-w-fit mitre-technique ttp-tag-color-technique cyw-my-2"
          :text="`${pair.attack_technique.mitre_id}: ${pair.attack_technique.title}`"
          :rounded="false"
          v-bind="testId(`${index}-technique`)"
        />
        <div v-for="(subTech, idx) in pair.attack_subtechnique" :key="idx">
          <CyTag
            class="cyw-w-fit ttp-tag-color-subtechnique cyw-my-2"
            :text="`${subTech.mitre_id}: ${subTech.title}`"
            :rounded="false"
            v-bind="testId(`${index}-${idx}-subtechnique`)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.mitre-tactic-container {
  position: relative;
}

.mitre-technique-container {
  position: relative;
  margin-left: 4rem;

  &::before {
    content: '';
    position: absolute;
    top: -0.4rem;
    left: -2rem;
    width: 0.2rem;
    height: 2rem;
    background-color: var(--N400);
  }

  &::after {
    content: '';
    position: absolute;
    top: 1.5rem;
    left: -2rem;
    width: 2.2rem;
    height: 0.2rem;
    background-color: var(--N400);
  }
}
.ttp-tag-color {
  &-technique {
    background: var(--B200);
  }
  &-subtechnique {
    background: var(--B100);
  }
}
</style>
