function ContextMenu({
  item,
  contextMenuPos,
  isUploadingItem,
  handleCancelUpload,
  handleDeleteFile,
  handleDeleteDirectory,
  openRenameModal,
  onShare,
  onManageAccess,
  BACKEND_URI,
}) {
  const menuClass = "fixed bg-white shadow-md rounded z-[999] py-1";
  const itemClass = "px-5 py-2 cursor-pointer whitespace-nowrap text-gray-700 hover:bg-gray-100";

  if (item.isDirectory) {
    return (
      <div className={menuClass} style={{ top: contextMenuPos.y, left: contextMenuPos.x }}>
        <div className={itemClass} onClick={() => openRenameModal("directory", item._id, item.name)}>
          Rename
        </div>
        <div className={itemClass} onClick={() => handleDeleteDirectory(item._id)}>
          Delete
        </div>
      </div>
    );
  } else {
    if (isUploadingItem && item.isUploading) {
      return (
        <div className={menuClass} style={{ top: contextMenuPos.y, left: contextMenuPos.x }}>
          <div className={itemClass} onClick={() => handleCancelUpload(item._id)}>
            Cancel
          </div>
        </div>
      );
    } else {
      return (
        <div className={menuClass} style={{ top: contextMenuPos.y, left: contextMenuPos.x }}>
          <div className={itemClass} onClick={() => (window.location.href = `${BACKEND_URI}/file/${item._id}?action=download`)}>
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
          <div className={itemClass} onClick={() => handleDeleteFile(item._id)}>
            Delete
          </div>
        </div>
      );
    }
  }
}

export default ContextMenu;