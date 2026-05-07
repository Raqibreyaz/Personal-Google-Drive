import { BsThreeDotsVertical } from "react-icons/bs";
import ContextMenu from "../components/ContextMenu";
import formatSize from "../utils/formatSize";
import { formatDate } from "../utils/date";
import FileIcon from "./common/FileIcon";

function DirectoryItem({
  item,
  onItemClick,
  onItemDoubleClick,
  activeContextMenu,
  contextMenuPos,
  handleContextMenu,
  isUploading,
  uploadProgress,
  cancelUpload,
  handleDeleteFile,
  handleDeleteDirectory,
  handleShowDetails,
  openRenameModal,
  onShare,
  onManageAccess,
  isSelected,
}) {
  const isUploadingItem = item._id.startsWith("temp-");

  const handleClick = (e) => {
    if (activeContextMenu || isUploading) return;
    e.stopPropagation();
    onItemClick(item._id, item.isDirectory, e.ctrlKey || e.metaKey);
  };

  const handleDoubleClick = (e) => {
    if (activeContextMenu || isUploading) return;
    e.stopPropagation();
    onItemDoubleClick(item.isDirectory ? "directory" : "file", item._id);
  };

  return (
    <div
      className={`flex flex-col relative gap-1 border rounded cursor-pointer transition-all duration-200 select-none ${
        isSelected
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-sm"
          : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md"
      }`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e) => handleContextMenu(e, item._id)}
    >
      <div className="flex items-center gap-2" title={`size: ${formatSize(item.size)}\ncreatedAt: ${formatDate(item.createdAt)}`}>
        <div className="flex items-center gap-3 p-2.5 flex-1 min-w-0">
          <FileIcon
            filename={item.name}
            isDirectory={item.isDirectory}
            className="text-xl shrink-0"
          />
          <span className={`truncate text-sm font-medium ${isSelected ? "text-blue-900 dark:text-blue-100" : "text-gray-700 dark:text-gray-300"}`}>
            {item.name}
          </span>
        </div>

        <div
          className="flex items-center justify-center text-xl cursor-pointer ml-auto text-gray-700 dark:text-gray-400 rounded-full p-2 mr-1 hover:bg-gray-200 dark:hover:bg-gray-600"
          onClick={(e) => {
            e.stopPropagation();
            handleContextMenu(e, item._id);
          }}
        >
          <BsThreeDotsVertical />
        </div>
      </div>

      {isUploadingItem && (
        <div className="bg-gray-500 rounded mt-1 mb-2 overflow-hidden relative mx-2.5">
          <span className="absolute text-xs left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white">
            {Math.floor(uploadProgress)}%
          </span>
          <div
            className="bg-blue-600 rounded h-4"
            style={{
              width: `${uploadProgress}%`,
              backgroundColor: uploadProgress === 100 ? "#039203" : undefined,
            }}
          ></div>
        </div>
      )}

      {activeContextMenu === item._id && (
        <ContextMenu
          item={item}
          contextMenuPos={contextMenuPos}
          isUploadingItem={isUploadingItem}
          cancelUpload={cancelUpload}
          handleDeleteFile={handleDeleteFile}
          handleDeleteDirectory={handleDeleteDirectory}
          handleShowDetails={handleShowDetails}
          openRenameModal={openRenameModal}
          onShare={onShare}
          onManageAccess={onManageAccess}
        />
      )}
    </div>
  );
}

export default DirectoryItem;
