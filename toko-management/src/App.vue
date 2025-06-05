<!-- src/App.vue -->
<template>
  <component :is="layout">
    <router-view />
  </component>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MainLayout from './layouts/MainLayout.vue'
import AuthLayout from './layouts/AuthLayout.vue'

const route = useRoute()

const layout = computed(() => {
  const layoutName = route.meta.layout || 'main'
  return layoutName === 'main' ? MainLayout : AuthLayout
})
</script>

<style>
@import 'bootstrap/dist/css/bootstrap.min.css';
@import '../node_modules/bootstrap-icons/font/bootstrap-icons.css';

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
</style>