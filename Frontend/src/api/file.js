import { apiDelete, apiPatch, BASE_URL } from "./client.js";

export async function deleteFile(fileId) {
  return apiDelete(`/file/${fileId}`);
}

export async function renameFile(fileId, newFilename) {
  return apiPatch(`/file/rename/${fileId}`, { newFilename });
}

export async function setFileAccess(fileId, permission) {
  return apiPatch(`/file/set-access/${fileId}`, { permission });
}

export function getFileUrl(fileId) {
  return `${BASE_URL}/file/${fileId}`;
}

export function getDownloadUrl(fileId) {
  return `${BASE_URL}/file/${fileId}?action=download`;
}

/**
 * Upload a file via XHR with progress tracking.
 * Returns the XHR instance so the caller can abort if needed.
 *
 * @param {string|null} dirId  - parent directory ID (null for root)
 * @param {File}        file   - the File object to upload
 * @param {object}      opts
 * @param {function}    opts.onProgress - called with percentage (0-100)
 * @param {function}    opts.onLoad     - called when upload finishes
 * @returns {XMLHttpRequest}
 */
export function uploadFile(dirId, file, { onProgress, onLoad } = {}) {
  const xhr = new XMLHttpRequest();
  xhr.open("POST", `${BASE_URL}/file/${dirId ?? ""}`, true);
  xhr.withCredentials = true;

  if (onProgress) {
    xhr.upload.addEventListener("progress", (evt) => {
      if (evt.lengthComputable) {
        onProgress((evt.loaded / evt.total) * 100);
      }
    });
  }

  if (onLoad) {
    xhr.addEventListener("load", onLoad);
  }

  const formData = new FormData();
  formData.append("uploadFile", file);
  xhr.send(formData);

  return xhr;
}
