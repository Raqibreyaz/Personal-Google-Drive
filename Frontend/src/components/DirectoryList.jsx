import DirectoryItem from "./DirectoryItem";

function DirectoryList({
  items,
  handleRowClick,
  activeContextMenu,
  contextMenuPos,
  handleContextMenu,
  isUploading,
  progressMap,
  handleCancelUpload,
  handleDeleteFile,
  handleDeleteDirectory,
  handleShowDetails,
  openRenameModal,
  onShare,
  onManageAccess,
  BACKEND_URI,
  selectedItems,
  handleToggleSelect,
}) {
  return (
    <div className="flex flex-col gap-2.5 mt-5">
      {items.map((item) => {
        const uploadProgress = progressMap[item._id] || 0;
        const isSelected = item.isDirectory
          ? selectedItems.dirs.includes(item._id)
          : selectedItems.files.includes(item._id);

        return (
          <DirectoryItem
            key={item._id}
            item={item}
            handleRowClick={handleRowClick}
            activeContextMenu={activeContextMenu}
            contextMenuPos={contextMenuPos}
            handleContextMenu={handleContextMenu}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            handleCancelUpload={handleCancelUpload}
            handleDeleteFile={handleDeleteFile}
            handleDeleteDirectory={handleDeleteDirectory}
            handleShowDetails={handleShowDetails}
            openRenameModal={openRenameModal}
            onShare={onShare}
            onManageAccess={onManageAccess}
            BACKEND_URI={BACKEND_URI}
            isSelected={isSelected}
            onToggleSelect={() => handleToggleSelect(item._id, item.isDirectory)}
          />
        );
      })}
    </div>
  );
}

export default DirectoryList;
