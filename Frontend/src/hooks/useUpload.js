import { useState, useCallback } from "react";
import { uploadFile } from "../api/file.js";

export default function useUpload(dirId, onUploadSuccess) {
  const [localFiles, setLocalFiles] = useState([]);
  const [localError, setLocalError] = useState("");
  const [uploadQueue, setUploadQueue] = useState([]);
  const [uploadAbortMap, setUploadAbortMap] = useState({});
  const [progressMap, setProgressMap] = useState({});
  const [isUploading, setIsUploading] = useState(false);

  const processUploadQueue = useCallback((queue) => {
    if (queue.length === 0) {
      setIsUploading(false);
      setUploadQueue([]);
      setLocalFiles([]);
      if (onUploadSuccess) onUploadSuccess();
      return;
    }

    const [currentItem, ...restQueue] = queue;
    setLocalFiles((prev) =>
      prev.map((f) => f._id === currentItem._id ? { ...f, isUploading: true } : f),
    );

    const { abort } = uploadFile(dirId, currentItem.file, {
      onProgress: (progress) => {
        setProgressMap((prev) => ({ ...prev, [currentItem._id]: progress }));
      },
      onLoad: () => { processUploadQueue(restQueue); },
      onError: (errMsg) => {
        setLocalFiles((prev) => prev.filter((f) => f._id !== currentItem._id));
        setProgressMap((prev) => { const { [currentItem._id]: _, ...rest } = prev; return rest; });
        setLocalError(errMsg);
        processUploadQueue(restQueue);
      },
    });
    setUploadAbortMap((prev) => ({ ...prev, [currentItem._id]: abort }));
  }, [dirId, onUploadSuccess]);

  const handleFileSelect = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    const newItems = selectedFiles.map((file) => {
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      return { file, name: file.name, _id: tempId, isUploading: false, isDirectory: false };
    });

    setLocalFiles((prev) => [...newItems, ...prev]);
    newItems.forEach((item) => {
      setProgressMap((prev) => ({ ...prev, [item._id]: 0 }));
    });
    setUploadQueue((prev) => [...prev, ...newItems]);
    e.target.value = "";

    if (!isUploading) {
      setIsUploading(true);
      processUploadQueue([...uploadQueue, ...newItems]);
    }
  }, [isUploading, uploadQueue, processUploadQueue]);

  const handleCancelUpload = useCallback((tempId) => {
    const abortFn = uploadAbortMap[tempId];
    if (abortFn) abortFn();
    setUploadQueue((prev) => prev.filter((item) => item._id !== tempId));
    setLocalFiles((prev) => prev.filter((f) => f._id !== tempId));
    setProgressMap((prev) => { const { [tempId]: _, ...rest } = prev; return rest; });
    setUploadAbortMap((prev) => { const copy = { ...prev }; delete copy[tempId]; return copy; });
  }, [uploadAbortMap]);

  return {
    localFiles,
    localError,
    setLocalError,
    isUploading,
    progressMap,
    handleFileSelect,
    handleCancelUpload,
  };
}
