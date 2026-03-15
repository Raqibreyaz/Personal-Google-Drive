import { apiGet, apiPost, apiPatch, apiDelete } from "./client.js";

export const getDirectory = (dirId) => apiGet(`/directory/${dirId || ""}`);

export const createDirectory = (parentDirId, dirname) => apiPost(`/directory/${parentDirId ?? ""}`, { dirname });

export const deleteDirectory = (dirId) => apiDelete(`/directory/${dirId}`);

export const renameDirectory = (dirId, newDirname) => apiPatch(`/directory/${dirId}`, { newDirname });

export const getDirectoryCounts = (dirId) => apiGet(`/directory/${dirId}/descendants/count`);
