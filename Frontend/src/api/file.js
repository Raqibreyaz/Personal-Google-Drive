import {
  apiDelete,
  apiPatch,
  apiPost,
  BASE_URL,
  client,
  ApiError,
} from "./client.js";

export const deleteFile = (fileId) => apiDelete(`/file/${fileId}`);

export const renameFile = (fileId, newFilename) =>
  apiPatch(`/file/rename/${fileId}`, { newFilename });

export const setFileAccess = (fileId, permission) =>
  apiPatch(`/file/set-access/${fileId}`, { permission });

export function getFileUrl(fileId) {
  return `${BASE_URL}/file/${fileId}`;
}

/**
 * Two-step presigned upload flow:
 *  1. POST /file/initiate/:parentDirId  →  { fileId, signedUrl }
 *  2. PUT file to signedUrl (direct to S3)
 *  3. POST /file/complete/:fileId
 *
 * @param {string|null} dirId  - parent directory ID (null/undefined for root)
 * @param {File}        file   - the File object to upload
 * @param {object}      opts
 * @param {function}    opts.onProgress - called with percentage (0-100)
 * @param {function}    opts.onLoad     - called when upload completes successfully
 * @param {function}    opts.onError    - called with error message string on failure
 * @returns {{ abort: Function }}
 */
export function uploadFile(dirId, file, { onProgress, onLoad, onError } = {}) {
  const controller = new AbortController();

  (async () => {
    try {
      // Step 1: Initiate — get presigned URL from backend
      const { fileId, signedUrl } = await client.post(
        `/file/initiate/${dirId ?? ""}`,
        { fileName: file.name, fileSize: file.size, fileType: file.type },
        { signal: controller.signal },
      );

      // Step 2: Upload directly to S3 via presigned URL
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", signedUrl);
      xhr.setRequestHeader("Content-Type", file.type);

      // Wire up abort
      const onAbort = () => xhr.abort();
      controller.signal.addEventListener("abort", onAbort);

      await new Promise((resolve, reject) => {
        xhr.upload.onprogress = (evt) => {
          if (onProgress && evt.lengthComputable) {
            onProgress((evt.loaded / evt.total) * 100);
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`S3 upload failed (${xhr.status})`));
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.onabort = () =>
          reject(new DOMException("Upload cancelled", "AbortError"));
        xhr.send(file);
      });

      controller.signal.removeEventListener("abort", onAbort);

      // Step 3: Confirm upload with backend
      await client.post(
        `/file/complete/${fileId}`,
        {},
        {
          signal: controller.signal,
        },
      );

      if (onLoad) onLoad();
    } catch (err) {
      // Cancelled by user — not an error
      if (err.name === "AbortError" || err.code === "ERR_CANCELED") return;

      const errMsg =
        err instanceof ApiError ? err.message : err.message || "Upload failed";
      if (onError) onError(errMsg);
    }
  })();

  return { abort: () => controller.abort() };
}
