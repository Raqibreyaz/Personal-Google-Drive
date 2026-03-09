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
 * @param {function}    opts.onLoad     - called when upload succeeds
 * @param {function}    opts.onError    - called with error message string on failure
 * @returns {XMLHttpRequest}
 */
export function uploadFile(dirId, file, { onProgress, onLoad, onError } = {}) {
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

  xhr.addEventListener("load", () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      if (onLoad) onLoad();
    } else {
      let errMsg = `Upload failed (${xhr.status})`;
      try {
        const data = JSON.parse(xhr.responseText);
        if (data.error) errMsg = data.error;
      } catch (_) {}
      if (onError) onError(errMsg);
    }
  });

  xhr.addEventListener("error", () => {
    if (onError) onError("Network error during upload");
  });

  const formData = new FormData();
  formData.append("uploadFile", file);
  xhr.send(formData);

  return xhr;
}
