import { getStore } from "@netlify/blobs";

type BlobConsistency = "eventual" | "strong";

export async function readJsonBlob<T>(
  storeName: string,
  key: string,
  fallback: T,
  options: { consistency?: BlobConsistency } = {}
): Promise<T> {
  const store = getStore(storeName);
  const value = await store.get(key, { type: "json", consistency: options.consistency });

  return value === null ? fallback : (value as T);
}

export async function readJsonBlobWithMetadata<T>(
  storeName: string,
  key: string,
  fallback: T,
  options: { consistency?: BlobConsistency } = {}
) {
  const store = getStore(storeName);
  const entry = await store.getWithMetadata(key, {
    type: "json",
    consistency: options.consistency
  });

  return {
    value: entry?.data === undefined || entry.data === null ? fallback : (entry.data as T),
    etag: entry?.etag
  };
}

export async function writeJsonBlob<T>(
  storeName: string,
  key: string,
  value: T,
  options: { onlyIfMatch?: string; onlyIfNew?: boolean } = {}
) {
  const store = getStore(storeName);

  if (options.onlyIfMatch) {
    return store.setJSON(key, value, { onlyIfMatch: options.onlyIfMatch });
  }

  if (options.onlyIfNew) {
    return store.setJSON(key, value, { onlyIfNew: true });
  }

  return store.setJSON(key, value);
}
