import { BASE_URL } from "../api/client";

function ContextMenu({
  item,
  contextMenuPos,
  isUploadingItem,
  handleCancelUpload,
  handleDeleteFile,
  handleDeleteDirectory,
  handleShowDetails,
  openRenameModal,
  onShare,
  onManageAccess,
}) {
  const menuClass = "fixed bg-white shadow-lg rounded-md border border-gray-200 z-[999] py-1.5 min-w-[160px]";
  const itemClass = "px-4 py-2 cursor-pointer text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors";

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
        <div className={itemClass} onClick={() => handleCancelUpload(item._id)}>
          Cancel Upload
        </div>
      );
    }

    return (
      <>
        <div className={itemClass} onClick={() => (window.open(`${BASE_URL}/file/${item._id}?action=download`, "_blank"))}>
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