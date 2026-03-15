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
import SelectAllControl from "./components/common/SelectAllControl";
import { getDirectory, createDirectory, deleteDirectory, renameDirectory } from "./api/directory.js";
import { deleteFile, renameFile, uploadFile } from "./api/file.js";
import { bulkDeleteItems } from "./api/item.js";
import { BASE_URL } from "./api/client.js";
import { sanitizeText } from "./utils/sanitize.js";
import { useState, useEffect, useRef, useMemo } from "react";
import useModals from "./hooks/useModals";
import useSelection from "./hooks/useSelection";
import useContextMenu from "./hooks/useContextMenu";
import useUpload from "./hooks/useUpload";

function DirectoryView() {
  const { dirId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const { data: directoryData, isLoading, error: queryError } = useQuery({
    queryKey: ["directory", dirId || "root"],
    queryFn: () => getDirectory(dirId),
    retry: false,
  });

  const [dirNotFound, setDirNotFound] = useState(false);
  useEffect(() => {
    setDirNotFound(queryError?.errorCode === "DIR_NOT_FOUND");
  }, [queryError]);

  const invalidateDirectory = () => {
    queryClient.invalidateQueries({ queryKey: ["directory", dirId || "root"] });
  };
  const invalidateUser = () => {
    queryClient.invalidateQueries({ queryKey: ["currentUser"] });
  };

  const {
    localFiles, localError, setLocalError, isUploading, progressMap,
    handleFileSelect, handleCancelUpload
  } = useUpload(dirId, () => {
    invalidateDirectory();
    invalidateUser();
  });

  const combinedItems = useMemo(() => [
    ...localFiles,
    ...(directoryData ? [
      ...directoryData.directories.map((d) => ({ ...d, isDirectory: true })),
      ...directoryData.files.map((f) => ({ ...f, isDirectory: false })),
    ].reverse() : []),
  ], [localFiles, directoryData]);

  const {
    selectedItems, selectedCount, toggleSelect, toggleSelectAll, clearSelection
  } = useSelection(combinedItems, dirId);

  const {
    activeContextMenu, contextMenuPos, handleContextMenu, closeContextMenu
  } = useContextMenu();

  const {
    showCreateDir, showRename, showShare, showAccess, showDetails,
    modalData, openCreateDir, closeCreateDir, openRename, closeRename,
    openShare, closeShare, openAccess, closeAccess, openDetails, closeDetails,
    setModalData
  } = useModals();

  // Mutations
  const createDirMutation = useMutation({
    mutationFn: (dirname) => createDirectory(dirId, dirname),
    onSuccess: () => {
      invalidateDirectory();
      invalidateUser();
      closeCreateDir();
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ type, id, name }) =>
      type === "file" ? renameFile(id, name) : renameDirectory(id, name),
    onSuccess: () => {
      invalidateDirectory();
      invalidateUser();
      closeRename();
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
      clearSelection();
    },
  });

  // Handlers
  const handleRowClick = (type, id) => {
    if (type === "directory") navigate(`/directory/${id}`);
    else window.location.href = `${BASE_URL}/file/${id}`;
  };

  const handleDeleteItem = (type, id, name) => {
    if (confirm(`Delete this ${type === "file" ? "File" : "Directory"}: ${name}?`)) {
      deleteMutation.mutate({ type, id });
    }
  };

  const handleBulkDelete = () => {
    if (selectedCount === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedCount} selected items?`)) {
      bulkDeleteMutation.mutate({ dirs: selectedItems.dirs, files: selectedItems.files });
    }
  };

  const handleCreateDirectory = (e) => {
    e.preventDefault();
    createDirMutation.mutate(sanitizeText(modalData.name || "New Folder"));
  };

  const handleRenameSubmit = (e) => {
    e.preventDefault();
    renameMutation.mutate({
      type: modalData.type,
      id: modalData.id,
      name: sanitizeText(modalData.name)
    });
  };

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

      <SelectAllControl
        itemsCount={combinedItems.length}
        selectedCount={selectedCount}
        onToggleSelectAll={toggleSelectAll}
      />

      <DirectoryHeader
        directoryName={directoryName}
        directoryPath={directoryPath}
        onCreateFolderClick={openCreateDir}
        onUploadFilesClick={() => fileInputRef.current.click()}
        fileInputRef={fileInputRef}
        handleFileSelect={handleFileSelect}
        disabled={dirNotFound}
      />

      {showCreateDir && (
        <CreateDirectoryModal
          newDirname={modalData.name || "New Folder"}
          setNewDirname={(name) => setModalData(prev => ({ ...prev, name }))}
          onClose={closeCreateDir}
          onCreateDirectory={handleCreateDirectory}
        />
      )}

      {showRename && (
        <RenameModal
          renameType={modalData.type}
          renameValue={modalData.name}
          setRenameValue={(name) => setModalData(prev => ({ ...prev, name }))}
          onClose={closeRename}
          onRenameSubmit={handleRenameSubmit}
        />
      )}

      {showShare && (
        <ShareModal
          fileId={modalData.id}
          fileName={modalData.name}
          onClose={closeShare}
        />
      )}

      {showAccess && (
        <AccessControlModal
          fileId={modalData.id}
          fileName={modalData.name}
          currentAccess={modalData.data}
          dirId={dirId}
          onClose={closeAccess}
          onAccessChanged={(newAccess) => setModalData(prev => ({ ...prev, data: newAccess }))}
        />
      )}

      {showDetails && modalData.data && (
        <DetailsModal
          item={modalData.data}
          directoryName={dirId ? directoryName : '/'}
          directoryPath={directoryPath}
          onClose={closeDetails}
        />
      )}

      {isLoading ? (
        <div className="flex justify-center mt-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : combinedItems.length === 0 ? (
        <p className="text-center italic mt-10 text-gray-500">
          {dirNotFound
            ? "Directory not found or you do not have access to it!"
            : "This folder is empty. Upload files or create a folder to see some data."}
        </p>
      ) : (
        <DirectoryList
          items={combinedItems}
          handleRowClick={handleRowClick}
          activeContextMenu={activeContextMenu}
          contextMenuPos={contextMenuPos}
          handleContextMenu={handleContextMenu}
          isUploading={isUploading}
          progressMap={progressMap}
          handleCancelUpload={handleCancelUpload}
          handleDeleteFile={(id, name) => handleDeleteItem("file", id, name)}
          handleDeleteDirectory={(id, name) => handleDeleteItem("directory", id, name)}
          handleShowDetails={openDetails}
          openRenameModal={openRename}
          onShare={openShare}
          onManageAccess={openAccess}
          BACKEND_URI={BASE_URL}
          selectedItems={selectedItems}
          handleToggleSelect={toggleSelect}
        />
      )}

      <FloatingActionBar
        selectedCount={selectedCount}
        onClear={clearSelection}
        onDelete={handleBulkDelete}
      />
    </div>
  );
}

export default DirectoryView;
