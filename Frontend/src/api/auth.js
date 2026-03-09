import { apiPost, apiPatch } from "./client.js";

export async function sendLoginOtp(email, password) {
  return apiPost("/auth/login/send-otp", { email, password });
}

export async function loginWithOtp(email, otp) {
  return apiPost("/auth/login", { email, otp });
}

export async function sendRegisterOtp(email) {
  return apiPost("/auth/register/send-otp", { email });
}

export async function registerWithOtp(formData, otp) {
  return apiPost("/auth/register", { ...formData, otp });
}

export async function loginWithGoogle(idToken) {
  return apiPost("/auth/login/google", { idToken });
}

export async function sendUpdatePasswordOtp(email) {
  return apiPost("/auth/update-password/send-otp", { email });
}

export async function updateUserPassword(email, otp, newPassword) {
  return apiPatch("/auth/update-password", { email, otp, newPassword });
}
