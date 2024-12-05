<template>
  <main class="page">
    <section class="page-title-section">
      <h3>Viewer SDK Test</h3>
      <p>This is a test of the Forge Viewer SDK. Upload a file to see it in action.</p>
    </section>

    <InputFile v-model="file" />

    <select @change="onSelectChange">
      <option :value="ifc_complicado">IFC Complicado</option>
      <option :value="ifc_basico">IFC Básico</option>
      <option :value="dwg">DWG</option>
    </select>

    <!-- <Viewer :file="file" /> -->
    <!-- <Viewer :file="file" :bucket-key="bucketKey" /> -->
    <Viewer :file="file" :document-id="documentId" />
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import InputFile from "./components/InputFile.vue";
import Viewer from "./components/Viewer.vue";

const ifc_complicado = "urn:dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c2RrLWJ1Y2tldC1wcm9qZWN0LXRlc3QtaW5tZXRhLTIvQVJRX0FMVl9PbmVTdHVkaW9zLmlmYw";
const ifc_basico = "urn:dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c2RrLWJ1Y2tldC1wcm9qZWN0LXRlc3QtaW5tZXRhLTIvTW9kZWxvX0VOR19DYXNhX0VMRS5pZmM";
const dwg = "urn:dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c2RrLWJ1Y2tldC1wcm9qZWN0LXRlc3QtaW5tZXRhLTIvQUNBRC0wMzYzX1RQX1JldjAwLmR3Zw";

const file = ref<File | null>(null);
const documentId = ref<string>(dwg);

// urn:btoa(objectId)
const bucketKey = "sdk-bucket-project-test-inmeta-2";

function onSelectChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  const value = target.value;

  documentId.value = value;
}
</script>
<style scoped>
.page {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-title-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
