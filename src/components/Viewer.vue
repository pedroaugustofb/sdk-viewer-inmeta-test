<template>
  <div class="viewer-container">
    <SelectViewable v-if="viewables.length" v-model="viewable" :options="viewables" />
    <div :id="viewerDivId" class="viewer" />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from "vue";
import useViewer, { LoadModelParams } from "../hooks/useViewer";
import SelectViewable from "./SelectViewable.vue";

type Props = {
  bucketKey?: string; // "pasta" de arquivos no Forge
  documentId?: string; // ID do arquivo no Forge, deve ser do tipo 'urn:BASE64_OBJECTID'
  file: File | null;
};

const props = defineProps<Props>();

const viewable = ref<any>(null);

const viewerDivId = "forgeViewer2";

const { loadModel, viewables, loadViewable } = useViewer({ viewerDivId });

watch(
  () => viewable.value,
  (newViewable) => {
    if (newViewable) {
      loadViewable(newViewable);
    }
  },
  { deep: true }
);

watch(
  () => props.file,
  (newFile) => {
    if (newFile) {
      const params: LoadModelParams = {
        bucketKey: props.bucketKey,
        documentId: props.documentId,
        file: newFile,
      };

      loadModel(params);
    }
  }
);

watch(
  () => props.documentId,
  (newDocumentId) => {
    if (newDocumentId) {
      const params: LoadModelParams = {
        bucketKey: props.bucketKey,
        documentId: newDocumentId,
        file: null,
      };

      loadModel(params);
    }
  }
);

const ifc_complicado = "urn:dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c2RrLWJ1Y2tldC1wcm9qZWN0LXRlc3QtaW5tZXRhLTIvQVJRX0FMVl9PbmVTdHVkaW9zLmlmYw";
const ifc_basico = "urn:dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c2RrLWJ1Y2tldC1wcm9qZWN0LXRlc3QtaW5tZXRhLTIvTW9kZWxvX0VOR19DYXNhX0VMRS5pZmM";

onMounted(() => {
  if (props.documentId) {
    // loadModel({
    //   bucketKey: props.bucketKey,
    //   documentId: props.documentId,
    //   file: null,
    // });

    loadModel({
      bucketKey: props.bucketKey,
      documentId: ifc_complicado,
      file: null,
    });

    loadModel({
      bucketKey: props.bucketKey,
      documentId: ifc_basico,
      file: null,
    });
  }
});
</script>
<style scoped>
.viewer {
  width: 80%;
  height: 80%;
  margin: 0;
}

.viewer-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
