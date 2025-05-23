<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, defineProps } from 'vue';
import Highcharts from 'highcharts';

// Define props for customization
const props = defineProps({
  title: {
    type: String,
    default: 'Title'
  },
  value: {
    default: 'Value',
    type: String
  },
  categories: {
    type: Array as () => string[],
    default: () => []
  },
  data: {
    type: Array as () => { y: number; color: string }[],
    default: () => []
  },
  width: {
    type: Number,
    default: 400
  },
  height: {
    type: Number,
    default: 150
  },
  legend: {
    default: {
      enabled: true,
      layout: 'vertical',
      align: 'right',
      verticalAlign: 'middle'
    },
    type: Object
  }
});

const chartContainer = ref<HTMLElement | null>(null);
let chartInstance: Highcharts.Chart | null = null;

// Highcharts configuration
const chartOptions: Highcharts.Options = {
  chart: {
    type: 'bar',

    height: props.height
  },
  title: {
    text: props.title,
    align: 'left',
    style: {
      fontWeight: 'bold'
    }
  },
  xAxis: {
    categories: props.categories,
    title: {
      text: props.title
    }
  },
  yAxis: {
    min: 0,
    visible: false
  },
  legend: props.legend,
  plotOptions: {
    series: {
      dataLabels: {
        enabled: true
      }
    }
  },
  series: [
    {
      type: 'bar',
      name: props.value,
      data: props.data,
      dataLabels: {
        enabled: true,
        inside: true
      }
    }
  ],
  tooltip: {
    enabled: false
  },
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
