import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DirectoryHeader from "./components/DirectoryHeader";
import CreateDirectoryModal from "./components/CreateDirectoryModal";
import RenameModal from "./components/RenameModal";
import ShareModal from "./components/ShareModal";
import AccessControlModal from "./components/AccessControlModal";
import DirectoryList from "./components/DirectoryList";

function DirectoryView() {
  const BACKEND_URI =
    import.meta.env.VITE_BACKEND_URI || "http://localhost:8080";
  const { dirId } = useParams();
  const navigate = useNavigate();

  const [directoryName, setDirectoryName] = useState("My Drive");
  const [directoriesList, setDirectoriesList] = useState([]);
  const [filesList, setFilesList] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

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
  const [uploadXhrMap, setUploadXhrMap] = useState({});
  const [progressMap, setProgressMap] = useState({});
  const [isUploading, setIsUploading] = useState(false);

  const [activeContextMenu, setActiveContextMenu] = useState(null);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

  async function handleFetchErrors(response) {
    if (!response.ok) {
      let errMsg = `Request failed with status ${response.status}`;
      try {
        const data = await response.json();
        if (data.error) errMsg = data.error;
      } catch (_) { }
      throw new Error(errMsg);
    }
    return response;
  }

  async function getDirectoryItems() {
    setErrorMessage("");
    try {
      const response = await fetch(`${BACKEND_URI}/directory/${dirId || ""}`, {
        credentials: "include",
      });
      if (response.status === 400) { navigate("/login"); return; }
      await handleFetchErrors(response);
      const data = await response.json();
      setDirectoryName(dirId ? data.name : "My Drive");
      setDirectoriesList([...data.directories].reverse());
      setFilesList([...data.files].reverse());
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  useEffect(() => {
    getDirectoryItems();
    setActiveContextMenu(null);
  }, [dirId]);

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
    else window.location.href = `${BACKEND_URI}/file/${id}`;
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

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BACKEND_URI}/file/${dirId ?? ""}`, true);
    xhr.withCredentials = true;
    xhr.upload.addEventListener("progress", (evt) => {
      if (evt.lengthComputable) {
        const progress = (evt.loaded / evt.total) * 100;
        setProgressMap((prev) => ({ ...prev, [currentItem._id]: progress }));
      }
    });
    xhr.addEventListener("load", () => { processUploadQueue(restQueue); });
    setUploadXhrMap((prev) => ({ ...prev, [currentItem._id]: xhr }));

    const formData = new FormData();
    formData.append("uploadFile", currentItem.file);
    xhr.send(formData);
  }

  function handleCancelUpload(tempId) {
    const xhr = uploadXhrMap[tempId];
    if (xhr) xhr.abort();
    setUploadQueue((prev) => prev.filter((item) => item._id !== tempId));
    setFilesList((prev) => prev.filter((f) => f._id !== tempId));
    setProgressMap((prev) => { const { [tempId]: _, ...rest } = prev; return rest; });
    setUploadXhrMap((prev) => { const copy = { ...prev }; delete copy[tempId]; return copy; });
  }

  async function handleDeleteFile(id) {
    setErrorMessage("");
    try {
      const response = await fetch(`${BACKEND_URI}/file/${id}`, { method: "DELETE", credentials: "include" });
      await handleFetchErrors(response);
      getDirectoryItems();
    } catch (error) { setErrorMessage(error.message); }
  }

  async function handleDeleteDirectory(id) {
    setErrorMessage("");
    try {
      const response = await fetch(`${BACKEND_URI}/directory/${id}`, { method: "DELETE", credentials: "include" });
      await handleFetchErrors(response);
      getDirectoryItems();
    } catch (error) { setErrorMessage(error.message); }
  }

  async function handleCreateDirectory(e) {
    e.preventDefault();
    setErrorMessage("");
    try {
      const response = await fetch(`${BACKEND_URI}/directory/${dirId ?? ""}`, {
        method: "POST",
        body: JSON.stringify({ dirname: newDirname }),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      await handleFetchErrors(response);
      setNewDirname("New Folder");
      setShowCreateDirModal(false);
      getDirectoryItems();
    } catch (error) { setErrorMessage(error.message); }
  }

  function openRenameModal(type, id, currentName) {
    setRenameType(type);
    setRenameId(id);
    setRenameValue(currentName);
    setShowRenameModal(true);
  }

  async function handleRenameSubmit(e) {
    e.preventDefault();
    setErrorMessage("");
    try {
      const url = renameType === "file"
        ? `${BACKEND_URI}/file/rename/${renameId}`
        : `${BACKEND_URI}/directory/${renameId}`;
      const response = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(renameType === "file" ? { newFilename: renameValue } : { newDirname: renameValue }),
        credentials: "include",
      });
      await handleFetchErrors(response);
      setShowRenameModal(false);
      setRenameValue("");
      setRenameType(null);
      setRenameId(null);
      getDirectoryItems();
    } catch (error) { setErrorMessage(error.message); }
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
      {errorMessage &&
        errorMessage !== "Directory not found or you do not have access to it!" && (
          <div className="text-red-500 mb-2">{errorMessage}</div>
        )}

      <DirectoryHeader
        directoryName={directoryName}
        onCreateFolderClick={() => setShowCreateDirModal(true)}
        onUploadFilesClick={() => fileInputRef.current.click()}
        fileInputRef={fileInputRef}
        handleFileSelect={handleFileSelect}
        disabled={errorMessage === "Directory not found or you do not have access to it!"}
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
          BACKEND_URI={BACKEND_URI}
        />
      )}

      {showAccessModal && (
        <AccessControlModal
          fileId={accessFileId}
          fileName={accessFileName}
          currentAccess={accessCurrentPermission}
          onClose={() => setShowAccessModal(false)}
          onAccessChanged={() => getDirectoryItems()}
          BACKEND_URI={BACKEND_URI}
        />
      )}

      {combinedItems.length === 0 ? (
        errorMessage === "Directory not found or you do not have access to it!" ? (
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
          BACKEND_URI={BACKEND_URI}
        />
      )}
    </div>
  );
}

export default DirectoryView;
