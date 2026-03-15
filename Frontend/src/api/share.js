import { apiGet, apiPost, apiDelete } from "./client.js";

export const getSharedWithMe = () => apiGet("/share/");

export const getSharedUsers = (fileId) => apiGet(`/share/${fileId}`);

export const shareFile = (fileId, userEmail, permission) => apiPost(`/share/${fileId}`, { userEmail, permission });

export const revokeShare = (fileId, userEmail) => apiDelete(`/share/${fileId}`, { userEmail });
