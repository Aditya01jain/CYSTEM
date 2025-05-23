<script setup lang="ts">
import { useAttrs, computed } from 'vue';
import { baseUrl } from '@/shared/utils';

const $attrs = useAttrs();

const transformTags = computed(() => {
  return {
    img: (tag: string, attrs: Record<string, any>) => {
      if (attrs.src && attrs['data-image-id']) {
        attrs.src = `${baseUrl()}/api/admin/file-stream/alert-featured-image/${
          attrs['data-image-id']
        }/`;
      }
      return {
        tagName: 'img',
        attribs: attrs
      };
    }
  };
});
</script>

<template>
  <cy-sanitize-html v-bind="$attrs" class="cyw-lh-normal" :transformTags="transformTags"></cy-sanitize-html>
</template>
