<script setup lang="ts">
import { computed } from 'vue';
import { createAvatar } from '@usenavii/core';

const props = withDefaults(defineProps<{
  seed: string;
  title?: string;
  size?: number;
}>(), {
  title: 'Player avatar',
  size: 48,
});

const avatarSrc = computed(() => {
  const svg = createAvatar(props.seed, {
    size: props.size * 2,
    background: 'ring',
    mood: 'happy',
    tileBg: '#0a0a0a',
    title: props.title,
  });

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
});
</script>

<template>
  <img
    :src="avatarSrc"
    :alt="title"
    :width="size"
    :height="size"
    loading="lazy"
    decoding="async"
    class="shrink-0 rounded-full border border-dc-yellow/20 bg-dc-dark object-cover"
  >
</template>
