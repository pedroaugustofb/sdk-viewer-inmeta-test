<template>
  <input type="file" @change="onFileChange" />
</template>

<script setup lang="ts">
const model = defineModel<File | null>({ required: true });

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    model.value = file;
  }
}
</script>
