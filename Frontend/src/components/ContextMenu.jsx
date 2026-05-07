import { getFileUrl } from "../api/file";

function ContextMenu({
  item,
  contextMenuPos,
  isUploadingItem,
  cancelUpload,
  handleDeleteFile,
  handleDeleteDirectory,
  handleShowDetails,
  openRenameModal,
  onShare,
  onManageAccess,
}) {
  const menuClass = "fixed bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 z-[999] py-1.5 min-w-[160px] transition-colors";
  const itemClass = "px-4 py-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400 transition-colors";

  const renderContent = () => {
    if (item.isDirectory) {
      return (
        <>
          <div className={itemClass} onClick={() => openRenameModal("directory", item._id, item.name)}>
            Rename
          </div>
          <div className={itemClass} onClick={() => handleDeleteDirectory(item._id, item.name)}>
            Delete
          </div>
          <div className={itemClass} onClick={() => handleShowDetails(item)}>
            Details
          </div>
        </>
      );
    }

    if (isUploadingItem && item.isUploading) {
      return (
        <div className={itemClass} onClick={cancelUpload}>
          Cancel Upload
        </div>
      );
    }

    return (
      <>
        <div className={itemClass} onClick={() => window.open(getFileUrl(item._id) + "?action=download", "_blank")}>
          Download
        </div>
        <div className={itemClass} onClick={() => openRenameModal("file", item._id, item.name)}>
          Rename
        </div>
        <div className={itemClass} onClick={() => onShare(item._id, item.name)}>
          Share
        </div>
        <div className={itemClass} onClick={() => onManageAccess(item._id, item.name, item.allowAnyoneAccess)}>
          Manage Access
        </div>
        <div className={itemClass} onClick={() => handleDeleteFile(item._id, item.name)}>
          Delete
        </div>
        <div className={itemClass} onClick={() => handleShowDetails(item)}>
          Details
        </div>
      </>
    );
  };

  return (
    <div className={menuClass} style={{ top: contextMenuPos.y, left: contextMenuPos.x }} onClick={(e) => e.stopPropagation()}>
      {renderContent()}
    </div>
  );
}

export default ContextMenu;
