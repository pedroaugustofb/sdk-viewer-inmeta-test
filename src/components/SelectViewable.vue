<template>
  <div class="select-viweable-container">
    <label for="viewable">Select an Viewable:</label>
    <select @change="onSelectChange">
      <option v-for="option in options" :value="option.value" :key="option.id">{{ option.data.viewableID }}</option>
    </select>
  </div>
</template>
<script lang="ts" setup>
type Props = {
  options: any[];
};

const model = defineModel<any>({ required: true });

const props = defineProps<Props>();

function onSelectChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  const value = target.value;

  const option = props.options.find((option) => option.data.viewableID === value);

  model.value = option;
}
</script>
<style scoped>
.select-viweable-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
