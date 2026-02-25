import { apiGet, apiPost, apiDelete } from "./client.js";

export async function getSharedWithMe() {
  return apiGet("/share/");
}

export async function getSharedUsers(fileId) {
  return apiGet(`/share/${fileId}`);
}

export async function shareFile(fileId, userEmail, permission) {
  return apiPost(`/share/${fileId}`, { userEmail, permission });
}

export async function revokeShare(fileId, userEmail) {
  return apiDelete(`/share/${fileId}`, { userEmail });
}
