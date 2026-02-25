import DirectoryItem from "./DirectoryItem";

function DirectoryList({
  items,
  handleRowClick,
  activeContextMenu,
  contextMenuPos,
  handleContextMenu,
  getFileIcon,
  isUploading,
  progressMap,
  handleCancelUpload,
  handleDeleteFile,
  handleDeleteDirectory,
  openRenameModal,
  onShare,
  onManageAccess,
  BACKEND_URI,
}) {
  return (
    <div className="flex flex-col gap-2.5 mt-5">
      {items.map((item) => {
        const uploadProgress = progressMap[item._id] || 0;
        return (
          <DirectoryItem
            key={item._id}
            item={item}
            handleRowClick={handleRowClick}
            activeContextMenu={activeContextMenu}
            contextMenuPos={contextMenuPos}
            handleContextMenu={handleContextMenu}
            getFileIcon={getFileIcon}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            handleCancelUpload={handleCancelUpload}
            handleDeleteFile={handleDeleteFile}
            handleDeleteDirectory={handleDeleteDirectory}
            openRenameModal={openRenameModal}
            onShare={onShare}
            onManageAccess={onManageAccess}
            BACKEND_URI={BACKEND_URI}
          />
        );
      })}
    </div>
  );
}

export default DirectoryList;
