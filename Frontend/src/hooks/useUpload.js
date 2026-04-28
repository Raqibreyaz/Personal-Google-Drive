import { useState, useCallback, useRef } from "react";
import { uploadFile } from "../api/file.js";

export default function useUpload(dirId, onUploadSuccess) {
  const [uploadingFile, setUploadingFile] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const abortRef = useRef(null);

  const handleFileSelect = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = "";
      
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const tempItem = {
        file,
        name: file.name,
        _id: tempId,
        isUploading: true,
        isDirectory: false,
      };

      setUploadingFile(tempItem);
      setProgress(0);
      setIsUploading(true);
      setUploadError("");

      const { abort } = uploadFile(dirId, file, {
        onProgress: (p) => setProgress(p),
        onLoad: () => {
          setUploadingFile(null);
          setIsUploading(false);
          setProgress(0);
          abortRef.current = null;
          if (onUploadSuccess) onUploadSuccess();
        },
        onError: (errMsg) => {
          setUploadingFile(null);
          setIsUploading(false);
          setProgress(0);
          abortRef.current = null;
          setUploadError(errMsg);
        },
      });
      abortRef.current = abort;
    },
    [dirId, onUploadSuccess],
  );

  const cancelUpload = useCallback(() => {
    if (abortRef.current) abortRef.current();
    setUploadingFile(null);
    setIsUploading(false);
    setProgress(0);
    abortRef.current = null;
  }, []);

  return {
    uploadingFile,
    uploadError,
    isUploading,
    progress,
    handleFileSelect,
    cancelUpload,
  };
}
