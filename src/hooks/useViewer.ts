import { ref } from "vue";
import ViewerService, { GetUploadSignedDataRequest, UploadFileToBucketRequest } from "../services/ViewerService";
import useValidateLocalStorage from "./useValidateLocalStorage";

type useViewerParams = {
  viewerDivId: string;
};

export type LoadModelParams = {
  documentId?: string; // caso undefined, significa que para esse user inmeta ainda não existe um bucket, então deve ser criado
  bucketKey?: string; // caso undefined, significa que o usuário ainda não tem um bucket, então deve ser criado
  file: File | null; // arquivo a ser carregado
};

type TranslateDocumentParams = {
  file: File;
  bucketKey?: string;
};

export default function useViewer({ viewerDivId }: useViewerParams) {
  let viewer: Autodesk.Viewing.Viewer3D | Autodesk.Viewing.GuiViewer3D | null = null;
  let vDocument: Autodesk.Viewing.Document | null = null;

  const viewables = ref<any[]>([]);

  // service do sdk
  const service = new ViewerService();

  // para guardar o token de acesso no localStorage com validade de tempo
  const storage = useValidateLocalStorage();

  // chave para armazenar o token de acesso no localStorage
  // no contexto INMETA, esse token pode ser resgatado do backend
  const tokenKey = "sdk_access_token";

  // padrão para o bucketKey, ex: sdk-bucket-<inmeta-userId>
  const defaultBucketKey = "sdk-bucket-project-test-inmeta-2";

  async function configAccessToViewer() {
    // pega um token de acesso Forge para ser utilizado nas API's de Translate JOB
    // esse token é um token para a INMETA em sí, e não para o usuário final
    // na falta de um backend da aplicação nesse exemplo entretanto
    // estamos utilizando o token de acesso do usuário final
    // existem outras opções de se obter autenticação para servicos da Autodesk
    // veja mais em: https://aps.autodesk.com/en/docs/oauth/v2/developers_guide/overview/
    // o token tem validade de 1 hora

    const item = storage.getItem(tokenKey);

    if (item && item.token) {
      service.setToken(item.token);

      return item;
    }

    const { access_token: token, expires_in } = await service.getAccessToken();

    if (!token) {
      throw new Error("Could not get access token");
    }

    // seta o token no serviço
    // para que ele possa ser utilizado nas requisições
    service.setToken(token);

    const tokenData = {
      token,
      expires_in,
    };

    storage.setItem(tokenKey, tokenData, expires_in);

    return tokenData;
  }

  async function createBucket(): Promise<string> {
    try {
      const createdBucket = await service.createBucket({ bucketKey: defaultBucketKey });

      if (!createdBucket.bucketKey) {
        throw new Error("Could not create bucket");
      }

      return createdBucket.bucketKey;
    } catch (error: any) {
      if (error.response.data.reason === "Bucket already exists") return defaultBucketKey;

      throw error;
    }
  }

  async function getUploadSignedData(params: GetUploadSignedDataRequest) {
    const data = await service.getUploadSignedData(params);

    return {
      signedUrl: data.urls[0],
      uploadKey: data.uploadKey,
    };
  }

  async function postFileToBucket(params: UploadFileToBucketRequest) {
    return await service.uploadFileToBucket(params);
  }

  async function awaitTranslateJob(urn: string, miliseconds: number = 5000) {
    // progress pode ser "pending", "<number>% complete", "complete"

    while (true) {
      const { progress: p, status: s } = await service.getTranslateJobStatus({ urn });

      if (p === "complete") {
        if (s !== "success") {
          throw new Error("Could not translate file");
        }

        break;
      }

      await new Promise((resolve) => setTimeout(resolve, miliseconds));
    }
  }

  async function loadDocument(documentId: string) {
    Autodesk.Viewing.Document.load(documentId, onDocumentLoadSuccess, () => {
      console.error("Failed fetching Forge manifest");
    });
  }

  function onDocumentLoadSuccess(viewerDocument: Autodesk.Viewing.Document) {
    vDocument = viewerDocument;

    viewables.value = viewerDocument.getRoot().search({ type: "geometry" });

    if (viewables.value.length === 0) {
      throw new Error("Document has no viewables");
    }

    const defaultModel = viewerDocument.getRoot().getDefaultGeometry();

    return loadViewable(defaultModel);
  }

  async function translateDocument(params: TranslateDocumentParams) {
    let bucketKey = params.bucketKey;

    if (!bucketKey) {
      // nesse caso o usuário ainda não tem um bucket criado
      // então vamos criar um bucket para ele
      bucketKey = await createBucket();
    }

    // arquivo a ser traduzido para SVF/SVF2
    const { file } = params;

    if (!file) {
      throw new Error("File not provided");
    }

    // obtemos a URL assinada e a chave para upload do arquivo
    const { uploadKey, signedUrl } = await getUploadSignedData({ bucketKey, fileName: file.name });

    // fazemos o upload do arquivo para o bucket
    const { objectId } = await postFileToBucket({ signedURL: signedUrl, bucketKey, uploadKey, file });

    // a urn é a base64 do objectId
    const urn = btoa(objectId);

    const fileExtension: string = file.name.split(".").pop() || "";

    // começamos o job de tradução do arquivo
    const { result } = await service.startTranslateJob({ urn, fileExtension });

    if (result !== "success") {
      throw new Error("Could not start translate job");
    }

    // nesse momento temos que esperar o job de tradução terminar
    await awaitTranslateJob(urn);

    const documentId = "urn:" + urn;

    return documentId;
  }

  async function initViewer() {
    const viewerDiv = document.getElementById(viewerDivId);

    if (!viewerDiv) {
      throw new Error("Could not find container element");
    }

    const { token, expires_in } = await configAccessToViewer();

    // essa configuração de options é a que está na documentação para ser usada com SVF2
    const options = {
      env: "AutodeskProduction2",
      api: "streamingV2",
      getAccessToken: function (onTokenReady: any) {
        onTokenReady(token, expires_in);
      },
    };

    // if (viewer) {
    //   viewer.finish();
    //   viewer = null;
    // }

    await Autodesk.Viewing.Initializer(options, () => {
      viewer = new Autodesk.Viewing.GuiViewer3D(viewerDiv);

      var startedCode = viewer.start();

      if (startedCode > 0) {
        console.error("Failed to create a Viewer: WebGL not supported.");

        viewer.finish();

        return;
      }

      console.info("Initialization complete");
    });
  }

  async function loadModel(params: LoadModelParams) {
    await initViewer();

    let documentId: string = params.documentId || "";

    if (!params.documentId) {
      if (!params.file) {
        throw new Error("File not provided");
      }

      documentId = await translateDocument({ file: params.file, bucketKey: params.bucketKey });
    }

    if (documentId) await loadDocument(documentId);
  }

  async function loadViewable(viewable: any) {
    if (!viewer) {
      await initViewer();
    }

    if (!vDocument) {
      throw new Error("Document not loaded");
    }

    if (!viewer) {
      throw new Error("Viewer not initialized");
    }

    const options = {
      keepCurrentModels: true,
    };

    console.log(viewable);

    viewer.loadDocumentNode(vDocument, viewable, options);
  }

  return { loadModel, loadViewable, viewables };
}
