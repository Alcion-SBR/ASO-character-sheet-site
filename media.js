const DB_NAME = "aso-character-sheet-media";
const STORE_NAME = "images";
const IMAGE_SLOTS = ["machine", "pilot"];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

let databasePromise;

function openDatabase() {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME, { keyPath: "slot" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("画像保存領域を開けませんでした。"));
  });
  return databasePromise;
}

function runRequest(mode, callback) {
  return openDatabase().then((database) => new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const request = callback(transaction.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("画像保存に失敗しました。"));
  }));
}

function validateSlot(slot) {
  if (!IMAGE_SLOTS.includes(slot)) throw new Error("画像の保存先が不正です。");
}

export async function getStoredImage(slot) {
  validateSlot(slot);
  return runRequest("readonly", (store) => store.get(slot));
}

export async function getStoredImages() {
  const entries = await Promise.all(IMAGE_SLOTS.map(async (slot) => [slot, await getStoredImage(slot)]));
  return Object.fromEntries(entries);
}

export async function saveStoredImage(slot, file) {
  validateSlot(slot);
  if (!file?.type?.startsWith("image/")) throw new Error("画像ファイルを選択してください。");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("画像は1枚8MB以下にしてください。");
  const record = { slot, blob: file, name: file.name, type: file.type, updatedAt: new Date().toISOString() };
  await runRequest("readwrite", (store) => store.put(record));
  return record;
}

export async function removeStoredImage(slot) {
  validateSlot(slot);
  await runRequest("readwrite", (store) => store.delete(slot));
}

export async function clearStoredImages() {
  await runRequest("readwrite", (store) => store.clear());
}

export function imageRecordToUrl(record) {
  return record?.blob ? URL.createObjectURL(record.blob) : "";
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("画像を書き出せませんでした。"));
    reader.readAsDataURL(blob);
  });
}

export async function getEmbeddedImages() {
  const images = await getStoredImages();
  const entries = await Promise.all(IMAGE_SLOTS.map(async (slot) => [slot, images[slot]?.blob ? await blobToDataUrl(images[slot].blob) : ""]));
  return Object.fromEntries(entries);
}
