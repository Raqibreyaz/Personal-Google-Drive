import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DirectoryHeader from "./components/DirectoryHeader";
import CreateDirectoryModal from "./components/CreateDirectoryModal";
import RenameModal from "./components/RenameModal";
import ShareModal from "./components/ShareModal";
import AccessControlModal from "./components/AccessControlModal";
import DirectoryList from "./components/DirectoryList";
import { getDirectory, createDirectory, deleteDirectory, renameDirectory } from "./api/directory.js";
import { deleteFile, renameFile, getFileUrl, uploadFile } from "./api/file.js";
import { BASE_URL } from "./api/client.js";
import useApiCall from "./hooks/useApiCall.js";
import { sanitizeText } from "./utils/sanitize.js";

function DirectoryView() {
  const { dirId } = useParams();
  const navigate = useNavigate();
  const { execute, error: errorMessage, setError: setErrorMessage } = useApiCall();

  const [directoryName, setDirectoryName] = useState("My Drive");
  const [directoriesList, setDirectoriesList] = useState([]);
  const [filesList, setFilesList] = useState([]);
  const [dirNotFound, setDirNotFound] = useState(false);

  const [showCreateDirModal, setShowCreateDirModal] = useState(false);
  const [newDirname, setNewDirname] = useState("New Folder");

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameType, setRenameType] = useState(null);
  const [renameId, setRenameId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareFileId, setShareFileId] = useState(null);
  const [shareFileName, setShareFileName] = useState("");

  const [showAccessModal, setShowAccessModal] = useState(false);
  const [accessFileId, setAccessFileId] = useState(null);
  const [accessFileName, setAccessFileName] = useState("");
  const [accessCurrentPermission, setAccessCurrentPermission] = useState(null);

  const fileInputRef = useRef(null);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [uploadAbortMap, setUploadAbortMap] = useState({});
  const [progressMap, setProgressMap] = useState({});
  const [isUploading, setIsUploading] = useState(false);

  const [activeContextMenu, setActiveContextMenu] = useState(null);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

  const getDirectoryItems = useCallback(() => {
    execute(
      () => getDirectory(dirId),
      (data) => {
        setDirNotFound(false);
        setDirectoryName(dirId ? data.name : "My Drive");
        setDirectoriesList([...data.directories].reverse());
        setFilesList([...data.files].reverse());
      },
    );
  }, [dirId, execute]);

  useEffect(() => {
    getDirectoryItems();
    setActiveContextMenu(null);
  }, [getDirectoryItems]);

  // Check if directory was not found (by error code)
  useEffect(() => {
    if (errorMessage) {
      // Set dirNotFound based on the error — the hook stores err.message,
      // but we can check via a separate mechanism if needed
      setDirNotFound(errorMessage.includes("not found"));
    }
  }, [errorMessage]);

  function getFileIcon(filename) {
    const ext = filename.split(".").pop().toLowerCase();
    switch (ext) {
      case "pdf": return "pdf";
      case "png": case "jpg": case "jpeg": case "gif": return "image";
      case "mp4": case "mov": case "avi": return "video";
      case "zip": case "rar": case "tar": case "gz": return "archive";
      case "js": case "jsx": case "ts": case "tsx": case "html": case "css": case "py": case "java": return "code";
      default: return "alt";
    }
  }

  function handleRowClick(type, id) {
    if (type === "directory") navigate(`/directory/${id}`);
    else window.location.href = getFileUrl(id);
  }

  function handleFileSelect(e) {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    const newItems = selectedFiles.map((file) => {
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      return { file, name: file.name, _id: tempId, isUploading: false };
    });

    setFilesList((prev) => [...newItems, ...prev]);
    newItems.forEach((item) => {
      setProgressMap((prev) => ({ ...prev, [item._id]: 0 }));
    });
    setUploadQueue((prev) => [...prev, ...newItems]);
    e.target.value = "";

    if (!isUploading) {
      setIsUploading(true);
      processUploadQueue([...uploadQueue, ...newItems.reverse()]);
    }
  }

  function processUploadQueue(queue) {
    if (queue.length === 0) {
      setIsUploading(false);
      setUploadQueue([]);
      setTimeout(() => { getDirectoryItems(); }, 1000);
      return;
    }

    const [currentItem, ...restQueue] = queue;
    setFilesList((prev) =>
      prev.map((f) => f._id === currentItem._id ? { ...f, isUploading: true } : f),
    );

    const { abort } = uploadFile(dirId, currentItem.file, {
      onProgress: (progress) => {
        setProgressMap((prev) => ({ ...prev, [currentItem._id]: progress }));
      },
      onLoad: () => { processUploadQueue(restQueue); },
      onError: (errMsg) => {
        setFilesList((prev) => prev.filter((f) => f._id !== currentItem._id));
        setProgressMap((prev) => { const { [currentItem._id]: _, ...rest } = prev; return rest; });
        setErrorMessage(errMsg);
        processUploadQueue(restQueue);
      },
    });
    setUploadAbortMap((prev) => ({ ...prev, [currentItem._id]: abort }));
  }

  function handleCancelUpload(tempId) {
    const abortFn = uploadAbortMap[tempId];
    if (abortFn) abortFn();
    setUploadQueue((prev) => prev.filter((item) => item._id !== tempId));
    setFilesList((prev) => prev.filter((f) => f._id !== tempId));
    setProgressMap((prev) => { const { [tempId]: _, ...rest } = prev; return rest; });
    setUploadAbortMap((prev) => { const copy = { ...prev }; delete copy[tempId]; return copy; });
  }

  function handleDeleteFile(id) {
    execute(
      () => deleteFile(id),
      () => getDirectoryItems(),
    );
  }

  function handleDeleteDirectory(id) {
    execute(
      () => deleteDirectory(id),
      () => getDirectoryItems(),
    );
  }

  function handleCreateDirectory(e) {
    e.preventDefault();
    execute(
      () => createDirectory(dirId, sanitizeText(newDirname)),
      () => {
        setNewDirname("New Folder");
        setShowCreateDirModal(false);
        getDirectoryItems();
      },
    );
  }

  function openRenameModal(type, id, currentName) {
    setRenameType(type);
    setRenameId(id);
    setRenameValue(currentName);
    setShowRenameModal(true);
  }

  function handleRenameSubmit(e) {
    e.preventDefault();
    const sanitizedValue = sanitizeText(renameValue);
    execute(
      () => renameType === "file"
        ? renameFile(renameId, sanitizedValue)
        : renameDirectory(renameId, sanitizedValue),
      () => {
        setShowRenameModal(false);
        setRenameValue("");
        setRenameType(null);
        setRenameId(null);
        getDirectoryItems();
      },
    );
  }

  function handleOpenShare(fileId, fileName) {
    setShareFileId(fileId);
    setShareFileName(fileName);
    setShowShareModal(true);
    setActiveContextMenu(null);
  }

  function handleOpenAccessControl(fileId, fileName, currentAccess) {
    setAccessFileId(fileId);
    setAccessFileName(fileName);
    setAccessCurrentPermission(currentAccess);
    setShowAccessModal(true);
    setActiveContextMenu(null);
  }

  function handleContextMenu(e, id) {
    e.stopPropagation();
    e.preventDefault();
    const clickX = e.clientX;
    const clickY = e.clientY;
    if (activeContextMenu === id) setActiveContextMenu(null);
    else { setActiveContextMenu(id); setContextMenuPos({ x: clickX - 110, y: clickY }); }
  }

  useEffect(() => {
    function handleDocumentClick() { setActiveContextMenu(null); }
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  const combinedItems = [
    ...directoriesList.map((d) => ({ ...d, isDirectory: true })),
    ...filesList.map((f) => ({ ...f, isDirectory: false })),
  ];

  return (
    <div className="px-2.5 max-w-[1000px] mx-auto">
      {errorMessage && !dirNotFound && (
        <div className="text-red-500 mb-2">{errorMessage}</div>
      )}

      <DirectoryHeader
        directoryName={directoryName}
        onCreateFolderClick={() => setShowCreateDirModal(true)}
        onUploadFilesClick={() => fileInputRef.current.click()}
        fileInputRef={fileInputRef}
        handleFileSelect={handleFileSelect}
        disabled={dirNotFound}
      />

      {showCreateDirModal && (
        <CreateDirectoryModal
          newDirname={newDirname}
          setNewDirname={setNewDirname}
          onClose={() => setShowCreateDirModal(false)}
          onCreateDirectory={handleCreateDirectory}
        />
      )}

      {showRenameModal && (
        <RenameModal
          renameType={renameType}
          renameValue={renameValue}
          setRenameValue={setRenameValue}
          onClose={() => setShowRenameModal(false)}
          onRenameSubmit={handleRenameSubmit}
        />
      )}

      {showShareModal && (
        <ShareModal
          fileId={shareFileId}
          fileName={shareFileName}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {showAccessModal && (
        <AccessControlModal
          fileId={accessFileId}
          fileName={accessFileName}
          currentAccess={accessCurrentPermission}
          onClose={() => setShowAccessModal(false)}
          onAccessChanged={() => getDirectoryItems()}
        />
      )}

      {combinedItems.length === 0 ? (
        dirNotFound ? (
          <p className="text-center italic mt-10 text-gray-500">
            Directory not found or you do not have access to it!
          </p>
        ) : (
          <p className="text-center italic mt-10 text-gray-500">
            This folder is empty. Upload files or create a folder to see some data.
          </p>
        )
      ) : (
        <DirectoryList
          items={combinedItems}
          handleRowClick={handleRowClick}
          activeContextMenu={activeContextMenu}
          contextMenuPos={contextMenuPos}
          handleContextMenu={handleContextMenu}
          getFileIcon={getFileIcon}
          isUploading={isUploading}
          progressMap={progressMap}
          handleCancelUpload={handleCancelUpload}
          handleDeleteFile={handleDeleteFile}
          handleDeleteDirectory={handleDeleteDirectory}
          openRenameModal={openRenameModal}
          onShare={handleOpenShare}
          onManageAccess={handleOpenAccessControl}
          BACKEND_URI={BASE_URL}
        />
      )}
    </div>
  );
}

export default DirectoryView;
