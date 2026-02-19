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
  // Directory context menu
  if (item.isDirectory) {
    return (
      <div
        className="context-menu"
        style={{ top: contextMenuPos.y, left: contextMenuPos.x }}
      >
        <div
          className="context-menu-item"
          onClick={() => openRenameModal("directory", item._id, item.name)}
        >
          Rename
        </div>
        <div
          className="context-menu-item"
          onClick={() => handleDeleteDirectory(item._id)}
        >
          Delete
        </div>
      </div>
    );
  } else {
    // File context menu
    if (isUploadingItem && item.isUploading) {
      // Only show "Cancel"
      return (
        <div
          className="context-menu"
          style={{ top: contextMenuPos.y, left: contextMenuPos.x }}
        >
          <div
            className="context-menu-item"
            onClick={() => handleCancelUpload(item._id)}
          >
            Cancel
          </div>
        </div>
      );
    } else {
      // Normal file
      return (
        <div
          className="context-menu"
          style={{ top: contextMenuPos.y, left: contextMenuPos.x }}
        >
          <div
            className="context-menu-item"
            onClick={() =>
              (window.location.href = `${BACKEND_URI}/file/${item._id}?action=download`)
            }
          >
            Download
          </div>
          <div
            className="context-menu-item"
            onClick={() => openRenameModal("file", item._id, item.name)}
          >
            Rename
          </div>
          <div
            className="context-menu-item"
            onClick={() => onShare(item._id, item.name)}
          >
            Share
          </div>
          <div
            className="context-menu-item"
            onClick={() => onManageAccess(item._id, item.name, item.allowAnyoneAccess)}
          >
            Manage Access
          </div>
          <div
            className="context-menu-item"
            onClick={() => handleDeleteFile(item._id)}
          >
            Delete
          </div>
        </div>
      );
    }
  }
}

export default ContextMenu;