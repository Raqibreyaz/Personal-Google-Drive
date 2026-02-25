import { apiGet, apiPost, apiPatch, apiDelete } from "./client.js";

export async function getCurrentUser() {
  return apiGet("/user");
}

export async function getAllUsers() {
  return apiGet("/user/all");
}

export async function logoutUser(userId) {
  return apiPost(`/user/logout/${userId}`);
}

export async function softDeleteUser(userId) {
  return apiDelete(`/user/${userId}`);
}

export async function hardDeleteUser(userId) {
  return apiDelete(`/user/${userId}?permanent=true`);
}

export async function recoverUser(userId) {
  return apiPatch(`/user/recover/${userId}`);
}

export async function changeUserRole(userId, role) {
  return apiPatch(`/user/role/${userId}`, { role });
}
