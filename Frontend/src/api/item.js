import { apiDelete } from "./client.js";

/**
 * Delete directories and files in bulk
 * @param {string[]} selectedDirs - Array of directory IDs
 * @param {string[]} selectedFiles - Array of file IDs
 */
export const bulkDeleteItems = async (selectedDirs = [], selectedFiles = []) => {
  return apiDelete("/item/bulk-delete", { selectedDirs, selectedFiles });
};
