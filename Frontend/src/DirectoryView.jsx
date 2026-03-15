import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DirectoryHeader from "./components/DirectoryHeader";
import CreateDirectoryModal from "./components/CreateDirectoryModal";
import RenameModal from "./components/RenameModal";
import ShareModal from "./components/ShareModal";
import AccessControlModal from "./components/AccessControlModal";
import DetailsModal from "./components/DetailsModal";
import DirectoryList from "./components/DirectoryList";
import FloatingActionBar from "./components/FloatingActionBar";
import { getDirectory, createDirectory, deleteDirectory, renameDirectory } from "./api/directory.js";
import { deleteFile, renameFile, getFileUrl, uploadFile } from "./api/file.js";
import { bulkDeleteItems } from "./api/item.js";
import { BASE_URL } from "./api/client.js";
import { sanitizeText } from "./utils/sanitize.js";
import { useState, useEffect, useRef } from "react";

function DirectoryView() {
  const { dirId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: directoryData, isLoading, error: queryError } = useQuery({
    queryKey: ["directory", dirId || "root"],
    queryFn: () => getDirectory(dirId),
    retry: false,
  });

  const [dirNotFound, setDirNotFound] = useState(false);

  useEffect(() => {
    if (queryError?.errorCode === "DIR_NOT_FOUND") setDirNotFound(true);
    else setDirNotFound(false);
  }, [queryError]);

  const [localFiles, setLocalFiles] = useState([]); // For managing files during upload
  const [localError, setLocalError] = useState(""); // For transient errors (e.g. upload)
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

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsItem, setDetailsItem] = useState(null);

  const [selectedItems, setSelectedItems] = useState({ dirs: [], files: [] });

  // Reset selection on navigation
  useEffect(() => {
    setSelectedItems({ dirs: [], files: [] });
    setActiveContextMenu(null);
  }, [dirId]);

  const invalidateDirectory = () => {
    queryClient.invalidateQueries({ queryKey: ["directory", dirId || "root"] });
  };

  const invalidateUser = () => {
    queryClient.invalidateQueries({ queryKey: ["currentUser"] });
  };

  const createDirMutation = useMutation({
    mutationFn: (dirname) => createDirectory(dirId, dirname),
    onSuccess: () => {
      invalidateDirectory();
      invalidateUser();
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ type, id, name }) =>
      type === "file" ? renameFile(id, name) : renameDirectory(id, name),
    onSuccess: () => {
      invalidateDirectory();
      invalidateUser(); // Rename might affect path-based logic or counts
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ type, id }) =>
      type === "file" ? deleteFile(id) : deleteDirectory(id),
    onSuccess: () => {
      invalidateDirectory();
      invalidateUser();
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: ({ dirs, files }) => bulkDeleteItems(dirs, files),
    onSuccess: () => {
      invalidateDirectory();
      invalidateUser();
    },
  });


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
  }

  function processUploadQueue(queue) {
    if (queue.length === 0) {
      setIsUploading(false);
      setUploadQueue([]);
      setLocalFiles([]); // Clear local files after all uploads are done
      invalidateDirectory();
      invalidateUser();
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
  }

  function handleCancelUpload(tempId) {
    const abortFn = uploadAbortMap[tempId];
    if (abortFn) abortFn();
    setUploadQueue((prev) => prev.filter((item) => item._id !== tempId));
    setLocalFiles((prev) => prev.filter((f) => f._id !== tempId));
    setProgressMap((prev) => { const { [tempId]: _, ...rest } = prev; return rest; });
    setUploadAbortMap((prev) => { const copy = { ...prev }; delete copy[tempId]; return copy; });
  }

  function handleDeleteFile(id, name) {
    const confirmed = confirm(`Delete this File: ${name}?`);
    if (!confirmed) return;
    deleteMutation.mutate({ type: "file", id });
  }

  function handleDeleteDirectory(id, name) {
    const confirmed = confirm(`Delete this Directory: ${name}?`);
    if (!confirmed) return;
    deleteMutation.mutate({ type: "directory", id });
  }

  function handleToggleSelect(id, isDirectory) {
    setSelectedItems((prev) => {
      const key = isDirectory ? "dirs" : "files";
      const isSelected = prev[key].includes(id);
      if (isSelected) {
        return { ...prev, [key]: prev[key].filter((i) => i !== id) };
      } else {
        return { ...prev, [key]: [...prev[key], id] };
      }
    });
  }

  function handleToggleSelectAll() {
    const totalSelected = selectedItems.dirs.length + selectedItems.files.length;
    const totalItems = combinedItems.length;

    if (totalSelected === totalItems) {
      setSelectedItems({ dirs: [], files: [] });
    } else {
      setSelectedItems({
        dirs: combinedItems.filter(i => i.isDirectory).map((d) => d._id),
        files: combinedItems.filter(i => !i.isDirectory).map((f) => f._id),
      });
    }
  }

  function handleBulkDelete() {
    const totalCount = selectedItems.dirs.length + selectedItems.files.length;
    if (totalCount === 0) return;

    const confirmed = confirm(`Are you sure you want to delete ${totalCount} selected items?`);
    if (!confirmed) return;

    bulkDeleteMutation.mutate(
      { dirs: selectedItems.dirs, files: selectedItems.files },
      {
        onSuccess: () => {
          setSelectedItems({ dirs: [], files: [] });
        }
      }
    );
  }

  function handleCreateDirectory(e) {
    e.preventDefault();
    createDirMutation.mutate(sanitizeText(newDirname), {
      onSuccess: () => {
        setNewDirname("New Folder");
        setShowCreateDirModal(false);
      }
    });
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
    renameMutation.mutate(
      { type: renameType, id: renameId, name: sanitizedValue },
      {
        onSuccess: () => {
          setShowRenameModal(false);
          setRenameValue("");
          setRenameType(null);
          setRenameId(null);
        }
      }
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

  function handleShowDetails(item) {
    setDetailsItem({ ...item });
    setShowDetailsModal(true);
    setActiveContextMenu(null);
  }

  useEffect(() => {
    function handleDocumentClick() { setActiveContextMenu(null); }
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  const combinedItems = [
    ...localFiles,
    ...(directoryData ? [
      ...directoryData.directories.map((d) => ({ ...d, isDirectory: true })),
      ...directoryData.files.map((f) => ({ ...f, isDirectory: false })),
    ].reverse() : []),
  ];

  const errorMessage = localError ||
    queryError?.message ||
    createDirMutation.error?.message ||
    renameMutation.error?.message ||
    deleteMutation.error?.message ||
    bulkDeleteMutation.error?.message;

  const directoryName = dirId ? directoryData?.name : "My Drive";
  const directoryPath = dirId && directoryData?.path ? directoryData.path : [];

  return (
    <div className="px-2.5 max-w-[1000px] mx-auto">
      {errorMessage && !dirNotFound && (
        <div className="text-red-500 mb-2">{errorMessage}</div>
      )}

      {combinedItems.length > 0 && (
        <div className="flex items-center gap-2 mb-4 px-2 py-1 bg-gray-50 rounded-md border border-gray-200 w-fit">
          <input
            type="checkbox"
            checked={
              combinedItems.length > 0 &&
              selectedItems.dirs.length + selectedItems.files.length === combinedItems.length
            }
            onChange={handleToggleSelectAll}
            className="w-4 h-4 cursor-pointer accent-blue-600"
          />
          <span className="text-sm text-gray-600 font-medium select-none">Select All</span>
        </div>
      )}

      <DirectoryHeader
        directoryName={directoryName}
        directoryPath={directoryPath}
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
          dirId={dirId}
          onClose={() => setShowAccessModal(false)}
          onAccessChanged={(newAccess) => {
            setAccessCurrentPermission(newAccess);
          }}
        />
      )}

      {showDetailsModal && detailsItem && (
        <DetailsModal
          item={detailsItem}
          directoryName={dirId ? directoryName : '/'}
          directoryPath={directoryPath}
          onClose={() => { setShowDetailsModal(false); setDetailsItem(null); }}
        />
      )}

      {isLoading ? (
        <div className="flex justify-center mt-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : combinedItems.length === 0 ? (
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
          handleShowDetails={handleShowDetails}
          openRenameModal={openRenameModal}
          onShare={handleOpenShare}
          onManageAccess={handleOpenAccessControl}
          BACKEND_URI={BASE_URL}
          selectedItems={selectedItems}
          handleToggleSelect={handleToggleSelect}
        />
      )}

      <FloatingActionBar
        selectedCount={selectedItems.dirs.length + selectedItems.files.length}
        onClear={() => setSelectedItems({ dirs: [], files: [] })}
        onDelete={handleBulkDelete}
      />
    </div>
  );
}

export default DirectoryView;
