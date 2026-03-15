import { apiDelete, apiPatch, BASE_URL, client, ApiError } from "./client.js";

export const deleteFile = (fileId) => apiDelete(`/file/${fileId}`);

export const renameFile = (fileId, newFilename) => apiPatch(`/file/rename/${fileId}`, { newFilename });

export const setFileAccess = (fileId, permission) => apiPatch(`/file/set-access/${fileId}`, { permission });

export function getFileUrl(fileId) {
  return `${BASE_URL}/file/${fileId}`;
}

export function getDownloadUrl(fileId) {
  return `${BASE_URL}/file/${fileId}?action=download`;
}

/**
 * Upload a file via axios with progress tracking.
 * Returns an AbortController so the caller can cancel if needed.
 *
 * @param {string|null} dirId  - parent directory ID (null for root)
 * @param {File}        file   - the File object to upload
 * @param {object}      opts
 * @param {function}    opts.onProgress - called with percentage (0-100)
 * @param {function}    opts.onLoad     - called when upload succeeds
 * @param {function}    opts.onError    - called with error message string on failure
 * @returns {{ abort: Function }}
 */
export function uploadFile(dirId, file, { onProgress, onLoad, onError } = {}) {
  const controller = new AbortController();

  client
    .post(`/file/${dirId ?? ""}`, file, {
      headers: {
        "Content-Type": file.type,
        filename: file.name,
        filesize: file.size,
      },
      signal: controller.signal,
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          onProgress((evt.loaded / evt.total) * 100);
        }
      },
    })
    .then(() => {
      if (onLoad) onLoad();
    })
    .catch((err) => {
      // Cancelled by user — not an error
      if (err.code === "ERR_CANCELED") return;

      const errMsg =
        err instanceof ApiError ? err.message : "Network error during upload";
      if (onError) onError(errMsg);
    });

  return { abort: () => controller.abort() };
}
