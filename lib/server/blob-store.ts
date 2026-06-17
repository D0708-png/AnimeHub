import { getStore } from "@netlify/blobs";

export async function readJsonBlob<T>(storeName: string, key: string, fallback: T): Promise<T> {
  const store = getStore(storeName);
  const value = await store.get(key, { type: "json" });

  return value === null ? fallback : (value as T);
}

export async function writeJsonBlob<T>(storeName: string, key: string, value: T) {
  const store = getStore(storeName);
  await store.setJSON(key, value);
}
