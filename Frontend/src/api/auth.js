import { apiPost, apiPatch } from "./client.js";

export const sendLoginOtp = (email, password) => apiPost("/auth/login/send-otp", { email, password });

export const loginWithOtp = (email, otp) => apiPost("/auth/login", { email, otp });

export const sendRegisterOtp = (email) => apiPost("/auth/register/send-otp", { email });

export const registerWithOtp = (formData, otp) => apiPost("/auth/register", { ...formData, otp });

export const loginWithGoogle = (idToken) => apiPost("/auth/login/google", { idToken });

export const sendUpdatePasswordOtp = (email) => apiPost("/auth/update-password/send-otp", { email });

export const updateUserPassword = (email, otp, newPassword) => apiPatch("/auth/update-password", { email, otp, newPassword });
