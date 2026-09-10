import { apiFetch } from "@/components/api/fetch";

export const api = {
  get: <DataType>(
    url: string,
    config?: {
      apiKey?: string;
      token?: string;
      options?: RequestInit;
    }
  ) =>
    apiFetch<DataType>(
      url,
      config?.options,
      config?.token,
      config?.apiKey
    ),

  post: <DataType>(
    url: string,
    body: any,
    config?: {
      apiKey?: string;
      token?: string;
      options?: RequestInit;
    }
  ) =>
    apiFetch<DataType>(
      url,
      {
        method: "POST",
        body: JSON.stringify(body),
        ...config?.options,
      },
      config?.token,
      config?.apiKey
    ),

  put: <DataType>(
    url: string,
    body: any,
    config?: {
      apiKey?: string;
      token?: string;
      options?: RequestInit;
    }
  ) =>
    apiFetch<DataType>(
      url,
      {
        method: "PUT",
        body: JSON.stringify(body),
        ...config?.options,
      },
      config?.token,
      config?.apiKey
    ),

  patch: <DataType>(
    url: string,
    body: any,
    config?: {
      apiKey?: string;
      token?: string;
      options?: RequestInit;
    }
  ) =>
    apiFetch<DataType>(
      url,
      {
        method: "PATCH",
        body: JSON.stringify(body),
        ...config?.options,
      },
      config?.token,
      config?.apiKey
    ),

  delete: <DataType>(
    url: string,
    config?: {
      apiKey?: string;
      token?: string;
      options?: RequestInit;
    }
  ) =>
    apiFetch<DataType>(
      url,
      {
        method: "DELETE",
        ...config?.options,
      },
      config?.token,
      config?.apiKey
    ),
};