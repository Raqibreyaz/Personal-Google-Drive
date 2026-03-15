import { client } from "./client.js";

/**
 * Delete directories and files in bulk
 * @param {string[]} selectedDirs - Array of directory IDs
 * @param {string[]} selectedFiles - Array of file IDs
 */
export const bulkDeleteItems = async (selectedDirs = [], selectedFiles = []) => {
  const response = await client.delete("/item/bulk-delete", {
    data: { selectedDirs, selectedFiles },
  });
  return response.data;
};
