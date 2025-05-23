<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import Highcharts from 'highcharts';

const props = defineProps({
  title: {
    default: '',
    type: String
  },
  innerRadius: {
    default: '0%',
    type: String
  },
  dataLabels: {
    default: {
      enabled: true
    },
    type: Object
  },
  value: {
    default: 'Value',
    type: String
  },
  data: {
    default: [],
    type: Array<Object>
  },
  series: {
    default: {}
  },
  legend: {
    default: {
      enabled: true,
      layout: 'vertical',
      align: 'right',
      verticalAlign: 'middle'
    },
    type: Object
  },
  width: { default: 200 },
  height: { default: 200 },
  events: {
    default: {}
  }
});

const chartContainer = ref<HTMLElement | null>(null);
let chartInstance: Highcharts.Chart | null = null;

const chartOptions: Highcharts.Options = {
  chart: {
    type: 'pie',
    width: props.width,
    height: props.height,
    events: props.events
  },
  title: {
    text: props.title
  },
  plotOptions: {
    pie: {
      innerSize: props.innerRadius, // Creates the donut chart effect
      dataLabels: props.dataLabels
    }
  },
  legend: props.legend,
  series: [
    {
      name: props.value,
      data: props.data,
      type: 'pie',
      ...props.series
    }
  ],
  credits: {
    enabled: false
  }
};

// Initialize the chart when the component is mounted
onMounted(() => {
  if (chartContainer.value) {
    chartInstance = Highcharts.chart(chartContainer.value, chartOptions);
  }
});

// Clean up the chart instance when the component is unmounted
onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.destroy();
  }
});
</script>

<template>
  <div ref="chartContainer"></div>
</template>
