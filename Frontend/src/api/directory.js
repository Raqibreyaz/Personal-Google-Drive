import { apiGet, apiPost, apiPatch, apiDelete } from "./client.js";

export async function getDirectory(dirId) {
  return apiGet(`/directory/${dirId || ""}`);
}

export async function createDirectory(parentDirId, dirname) {
  return apiPost(`/directory/${parentDirId ?? ""}`, { dirname });
}

export async function deleteDirectory(dirId) {
  return apiDelete(`/directory/${dirId}`);
}

export async function renameDirectory(dirId, newDirname) {
  return apiPatch(`/directory/${dirId}`, { newDirname });
}
