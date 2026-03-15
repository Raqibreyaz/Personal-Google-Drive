import { apiGet, apiPost, apiPatch, apiDelete } from "./client.js";

export const getCurrentUser = () => apiGet("/user");

export const getAllUsers = () => apiGet("/user/all");

export const logoutSelf = () => apiPost("/user/logout");

export const logoutAllDevices = () => apiPost("/user/logout/all");

export const logoutUser = (userId) => apiPost(`/user/logout/${userId}`);

export const softDeleteUser = (userId) => apiDelete(`/user/${userId}`);

export const hardDeleteUser = (userId) => apiDelete(`/user/${userId}?permanent=true`);

export const recoverUser = (userId) => apiPatch(`/user/recover/${userId}`);

export const changeUserRole = (userId, role) => apiPatch(`/user/role/${userId}`, { role });
