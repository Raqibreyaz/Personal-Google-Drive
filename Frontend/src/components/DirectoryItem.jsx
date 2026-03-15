import { BsThreeDotsVertical } from "react-icons/bs";
import ContextMenu from "../components/ContextMenu";
import formatSize from "../utils/formatSize";
import { formatDate } from "../utils/date";
import FileIcon from "./common/FileIcon";

function DirectoryItem({
  item,
  handleRowClick,
  activeContextMenu,
  contextMenuPos,
  handleContextMenu,
  isUploading,
  uploadProgress,
  handleCancelUpload,
  handleDeleteFile,
  handleDeleteDirectory,
  handleShowDetails,
  openRenameModal,
  onShare,
  onManageAccess,
  BACKEND_URI,
  isSelected,
  onToggleSelect,
}) {
  const isUploadingItem = item._id.startsWith("temp-");

  return (
    <div
      className={`flex flex-col relative gap-1 border rounded cursor-pointer transition-all duration-200 ${
        isSelected 
          ? "border-blue-500 bg-blue-50 shadow-sm" 
          : "border-gray-200 bg-gray-50 hover:bg-white hover:border-blue-300 hover:shadow-md"
      }`}
      onClick={() =>
        !(activeContextMenu || isUploading)
          ? handleRowClick(item.isDirectory ? "directory" : "file", item._id)
          : null
      }
      onContextMenu={(e) => handleContextMenu(e, item._id)}
    >
      <div className="flex items-center gap-2" title={`size: ${formatSize(item.size)}\ncreatedAt: ${formatDate(item.createdAt)}`}>
        <div className="flex items-center gap-3 p-2.5 flex-1 min-w-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelect();
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 cursor-pointer accent-blue-600 shrink-0"
          />
          <FileIcon 
            filename={item.name} 
            isDirectory={item.isDirectory} 
            className="text-xl shrink-0" 
          />
          <span className={`truncate text-sm font-medium ${isSelected ? "text-blue-900" : "text-gray-700"}`}>
            {item.name}
          </span>
        </div>

        <div
          className="flex items-center justify-center text-xl cursor-pointer ml-auto text-gray-700 rounded-full p-2 mr-1 hover:bg-gray-200"
          onClick={(e) => handleContextMenu(e, item._id)}
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
          handleCancelUpload={handleCancelUpload}
          handleDeleteFile={handleDeleteFile}
          handleDeleteDirectory={handleDeleteDirectory}
          handleShowDetails={handleShowDetails}
          openRenameModal={openRenameModal}
          onShare={onShare}
          onManageAccess={onManageAccess}
          BACKEND_URI={BACKEND_URI}
        />
      )}
    </div>
  );
}

export default DirectoryItem;
