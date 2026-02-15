import {
  FaFolder,
  FaFilePdf,
  FaFileImage,
  FaFileVideo,
  FaFileArchive,
  FaFileCode,
  FaFileAlt,
} from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";
import ContextMenu from "../components/ContextMenu";

function DirectoryItem({
  item,
  handleRowClick,
  activeContextMenu,
  contextMenuPos,
  handleContextMenu,
  getFileIcon,
  isUploading,
  uploadProgress,
  handleCancelUpload,
  handleDeleteFile,
  handleDeleteDirectory,
  openRenameModal,
  BACKEND_URI,
}) {
  // Convert the file icon string to the actual Icon component
  function renderFileIcon(iconString) {
    switch (iconString) {
      case "pdf":
        return <FaFilePdf />;
      case "image":
        return <FaFileImage />;
      case "video":
        return <FaFileVideo />;
      case "archive":
        return <FaFileArchive />;
      case "code":
        return <FaFileCode />;
      case "alt":
      default:
        return <FaFileAlt />;
    }
  }

  const isUploadingItem = item._id.startsWith("temp-");

  return (
    <div
      className="list-item hoverable-row"
      onClick={() =>
        !(activeContextMenu || isUploading)
          ? handleRowClick(item.isDirectory ? "directory" : "file", item._id)
          : null
      }
      onContextMenu={(e) => handleContextMenu(e, item._id)}
    >
      <div className="item-left-container">
        <div className="item-left">
          {item.isDirectory ? (
            <FaFolder className="folder-icon" />
          ) : (
            renderFileIcon(getFileIcon(item.name))
          )}
          <span>{item.name}</span>
        </div>

        {/* Three dots for context menu */}
        <div
          className="context-menu-trigger"
          onClick={(e) => handleContextMenu(e, item._id)}
        >
          <BsThreeDotsVertical />
        </div>
      </div>

      {/* PROGRESS BAR: shown if an item is in queue or actively uploading */}
      {isUploadingItem && (
        <div className="progress-container">
          <span className="progress-value">{Math.floor(uploadProgress)}%</span>
          <div
            className="progress-bar"
            style={{
              width: `${uploadProgress}%`,
              backgroundColor: uploadProgress === 100 ? "#039203" : "#007bff",
            }}
          ></div>
        </div>
      )}

      {/* Context menu, if active */}
      {activeContextMenu === item._id && (
        <ContextMenu
          item={item}
          contextMenuPos={contextMenuPos}
          isUploadingItem={isUploadingItem}
          handleCancelUpload={handleCancelUpload}
          handleDeleteFile={handleDeleteFile}
          handleDeleteDirectory={handleDeleteDirectory}
          openRenameModal={openRenameModal}
          BACKEND_URI={BACKEND_URI}
        />
      )}
    </div>
  );
}

export default DirectoryItem;
