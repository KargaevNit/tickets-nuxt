<script setup lang="ts">
import {useRoute} from "vue-router";

const route = useRoute();
const paymentId = route.params.id;
</script>

<template>
  <h1 class="title">Ждем вас!</h1>
</template>

<style scoped>
  .title {
    text-align: center;
  }
</style>