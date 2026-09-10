const BASE_URL = "http://127.0.0.1:8000/api/v1";

export async function apiFetch<DataType>(
  endpoint: string,
  options?: RequestInit,
  token?: string,
  apiKey?: string
): Promise<DataType> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(apiKey && { "x-api-key": apiKey }),
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    throw new Error(`Error: ${res.status}`);
  }

  return res.json();
}
