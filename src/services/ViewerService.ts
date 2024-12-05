import axios from "axios";

// essas constantes se referem ao app registrado na conta da Autodesk
// é um app para o sistema INMETA, não para o usuário final
// em uma aplicação real, essas constantes não devem ser expostas
// utilizar .env
const FORGE_CLIENT_ID = "FtumAfWa4GuUVx2FGpZSXzZ4km5pKrkYIVvaG4wrlA4VT2hF";
const FORGE_CLIENT_SECRET = "AaGm9j6izGr0NzwAf2G1MxUspZ8Uuynf3wNpcSqZ09BVwHkes0ypJCl7aGjATAGC";

export type GetAccessTokenResponse = {
  access_token: string;
  expires_in: number;
};

export type CreateBucketRequest = {
  bucketKey: string;
};

export type CreateBucketResponse = {
  bucketKey: string;
};

export type GetUploadSignedDataRequest = {
  bucketKey: string;
  fileName: string;
};

export type GetUploadSignedDataResponse = {
  urls: string[];
  uploadKey: string;
};

export type UploadFileToBucketRequest = {
  signedURL: string;
  bucketKey: string;
  uploadKey: string;
  file: File;
};

export type UploadFileToBucketResponse = {
  objectId: string;
};

export type StartTranslateJobRequest = {
  urn: string;
  fileExtension: string;
};

export type StartTranslateJobResponse = {
  result: string;
};

export type GetTranslateJobStatusRequest = {
  urn: string;
};

export type GetTranslateJobStatusResponse = {
  status: string;
  progress: string;
};

export default class ViewerService {
  private token: string = "";

  setToken(token: string) {
    this.token = token;
  }

  private ensureToken() {
    if (!this.token) {
      throw new Error("Token não definido. Por favor, defina o token antes de chamar este método.");
    }
  }

  private getOutputFormatByExtension(extension: string) {
    switch (extension) {
      // adicionar formatos de saída para outras extensões
      // veja mais em:
      // https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/jobs/job-POST/
      case "dwg":
      case "dxf": {
        return [
          {
            type: "svf2",
            views: ["2d", "3d"],
          },
        ];
      }
      case "ifc": {
        return [
          {
            type: "svf2",
            views: ["2d", "3d"],
          },
        ];
      }
      default: {
        console.warn(`Configuração de formato de saída para a extensão ${extension} não encontrada. Utilizando configuração para outros.`);
        return [
          {
            type: "obj",
          },
        ];
      }
    }
  }

  async getAccessToken(): Promise<GetAccessTokenResponse> {
    const response = await axios.post(
      "https://developer.api.autodesk.com/authentication/v2/token",
      {
        grant_type: "client_credentials", // required, existe outra opção para esse campo
        scope: "data:write data:read bucket:create bucket:delete", // required, define o escopo de acesso do token
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${FORGE_CLIENT_ID}:${FORGE_CLIENT_SECRET}`)}`,
        },
      }
    );

    return response.data;
  }

  async createBucket({ bucketKey }: CreateBucketRequest): Promise<CreateBucketResponse> {
    this.ensureToken();

    const response = await axios.post(
      "https://developer.api.autodesk.com/oss/v2/buckets",
      {
        bucketKey,
        policyKey: "transient",
        access: "full",
      },
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
          "x-ads-region": "US",
        },
      }
    );

    return response.data;
  }

  async getUploadSignedData({ bucketKey, fileName }: GetUploadSignedDataRequest): Promise<GetUploadSignedDataResponse> {
    this.ensureToken();

    const response = await axios.get(`https://developer.api.autodesk.com/oss/v2/buckets/${bucketKey}/objects/${fileName}/signeds3upload?minutesExpiration=${10}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  }

  async uploadFileToBucket({ signedURL, file, bucketKey, uploadKey }: UploadFileToBucketRequest): Promise<UploadFileToBucketResponse> {
    this.ensureToken();

    await axios.put(signedURL, file, {
      headers: {
        "Content-Type": "application/octet-stream",
      },
    });

    const response = await axios.post(
      `https://developer.api.autodesk.com/oss/v2/buckets/${bucketKey}/objects/${file.name}/signeds3upload`,
      {
        ossbucketKey: bucketKey,
        ossSourceFileObjectKey: file.name,
        access: "full",
        uploadKey: uploadKey,
      },
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  }

  async startTranslateJob({ urn, fileExtension }: StartTranslateJobRequest): Promise<StartTranslateJobResponse> {
    const formats = this.getOutputFormatByExtension(fileExtension);

    const response = await axios.post(
      "https://developer.api.autodesk.com/modelderivative/v2/designdata/job",
      {
        input: {
          urn: urn,
        },
        output: {
          formats,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
          "x-ads-force": true,
        },
      }
    );

    return response.data;
  }

  async getTranslateJobStatus({ urn }: GetTranslateJobStatusRequest): Promise<GetTranslateJobStatusResponse> {
    const response = await axios.get(`https://developer.api.autodesk.com/modelderivative/v2/designdata/${urn}/manifest`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  }
}
