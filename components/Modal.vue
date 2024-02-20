<script setup lang="ts">

import {onMounted, ref, watch} from "vue";

const dialog = ref(null);

const props = defineProps({
  title: {
    type: String,
    default: ""
  },
  component: {
    type: Object,
    required: true
  },
  isShow: {
    type: Boolean,
    default: false
  },
  payload: {
    type: Object,
    default: {}
  }
});

const emit = defineEmits(['update:isShow']);

const open = (emiting = false) => {
  dialog.value.showModal();
  if(emiting) { emit('update:isShow', true); }
};

const close = (emiting = false) => {
  dialog.value.close();
  if(emiting) { emit('update:isShow', false); }
};

watch(()=> props.isShow, (value) => {
  value ? open() : close();
});

onMounted(() => {
  props.isShow ? open() : close();
});

</script>

<template>
  <dialog ref="dialog">
    <div class="closebtn" @click="close(true)">x</div>
    <div v-if="title !== ''" class="title">{{ title }}</div>
    <div v-if="isShow" class="content">
      <component :is="component" :close-popup="close" :payload="payload"/>
    </div>
  </dialog>
</template>

<style scoped>
.title {
  font-size: 24px;
  text-align: center;
  padding: 1rem 0;
}

.content {
  padding: 10px 0;
}

dialog {
  position: relative;
  padding: 1rem;
  margin: auto;
  border-radius: 2rem;
  min-width: 300px;
  /* From https://css.glass */
  background: rgba(255, 255, 255, 0.12);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(7.3px);
  -webkit-backdrop-filter: blur(7.3px);
  border: 1px solid rgba(255, 255, 255, 0.61);
}

dialog:focus-visible {
  outline: none;
}

dialog::backdrop {
  background-color: #00000077;
}

.closebtn {
  position: absolute;
  right: 10px;
  top: 10px;
  cursor: pointer;
  border-radius: 100%;
  width: 20px;
  height: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: Arial;
}
.closebtn:hover {
  background-color: #aaaaaa;
}
</style>