import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FaArrowLeft, FaEye, FaEdit } from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";
import RenameModal from "./components/RenameModal";
import ShareModal from "./components/ShareModal";
import FileIcon from "./components/common/FileIcon";
import { getSharedWithMe } from "./api/share.js";
import { deleteFile, renameFile, getFileUrl } from "./api/file.js";
import { sanitizeText } from "./utils/sanitize.js";
import formatSize from "./utils/formatSize";
import useModals from "./hooks/useModals";
import useContextMenu from "./hooks/useContextMenu";

export default function SharedWithMePage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: sharedFiles = [], isLoading, error } = useQuery({
        queryKey: ["sharedWithMe"],
        queryFn: getSharedWithMe,
    });

    const invalidateShared = () => {
        queryClient.invalidateQueries({ queryKey: ["sharedWithMe"] });
    };

    const deleteMutation = useMutation({
        mutationFn: (fileId) => deleteFile(fileId),
        onSuccess: invalidateShared,
    });

    const renameMutation = useMutation({
        mutationFn: ({ id, name }) => renameFile(id, name),
        onSuccess: () => {
            invalidateShared();
            closeRename();
        }
    });

    const {
        activeContextMenu, contextMenuPos, handleContextMenu
    } = useContextMenu();

    const {
        showRename, showShare, modalData, openRename, closeRename, openShare, closeShare, setModalData
    } = useModals();

    const handleFileClick = (fileId) => {
        if (activeContextMenu) return;
        window.open(getFileUrl(fileId), "_blank");
    };

    const handleDeleteFile = (fileId) => {
        if (confirm("Delete this file?")) {
            deleteMutation.mutate(fileId);
        }
    };

    const handleRenameSubmit = (e) => {
        e.preventDefault();
        renameMutation.mutate({
            id: modalData.id,
            name: sanitizeText(modalData.name)
        });
    };

    const menuItemClass = "px-5 py-2 cursor-pointer whitespace-nowrap text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors";

    return (
        <div className="max-w-[800px] mx-auto p-5 transition-colors bg-white dark:bg-gray-900 min-h-screen">
            <header className="flex items-center gap-3 mb-6 border-b-2 border-gray-300 dark:border-gray-700 pb-3 transition-colors">
                <button className="bg-none border-none text-xl cursor-pointer text-blue-600 flex items-center p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => navigate("/app")}>
                    <FaArrowLeft />
                </button>
                <h1 className="m-0 text-3xl dark:text-white">Shared with Me</h1>
            </header>

            {(error || deleteMutation.error || renameMutation.error) && (
                <div className="text-red-500 mb-2">
                    {error?.message || deleteMutation.error?.message || renameMutation.error?.message}
                </div>
            )}

            {showRename && (
                <RenameModal
                    renameType="file"
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

            {isLoading ? (
                <p className="text-center text-gray-500 italic mt-10">Loading...</p>
            ) : sharedFiles.length === 0 ? (
                <p className="text-center text-gray-500 italic mt-10">No files have been shared with you yet.</p>
            ) : (
                <div className="flex flex-col gap-2">
                    {sharedFiles.map((entry, idx) => {
                        const fileId = entry.file?._id;
                        const fileName = entry.file?.name || "Unknown file";
                        const isEditor = entry.permission === "Edit";

                        return (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between py-3 px-4 border border-gray-200 dark:border-gray-700 rounded-md cursor-pointer bg-gray-50 dark:bg-gray-800 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                                    onClick={() => handleFileClick(fileId)}
                                    onContextMenu={(e) => handleContextMenu(e, fileId)}
                                >
                                    <div className="flex items-center gap-3">
                                        <FileIcon filename={fileName} isDirectory={false} className="text-xl shrink-0" />
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-800 dark:text-white transition-colors">{fileName}</span>
                                            <span className="text-[0.8rem] text-gray-500 dark:text-gray-400 transition-colors">{formatSize(entry.file?.size)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center gap-1 py-1 px-2.5 rounded-xl text-[0.8rem] font-medium bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 transition-colors">
                                            {isEditor ? (<><FaEdit /> Editor</>) : (<><FaEye /> Viewer</>)}
                                        </span>
                                        <div
                                            className="flex items-center justify-center text-lg cursor-pointer text-gray-500 dark:text-gray-400 rounded-full p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                            onClick={(e) => handleContextMenu(e, fileId)}
                                        >
                                            <BsThreeDotsVertical />
                                        </div>
                                    </div>

                                {activeContextMenu === fileId && (
                                    <div className="fixed bg-white dark:bg-gray-800 shadow-md rounded z-[999] py-1 border dark:border-gray-700 transition-colors" style={{ top: contextMenuPos.y, left: contextMenuPos.x }}>
                                        <div className={menuItemClass} onClick={(e) => { e.stopPropagation(); window.open(getFileUrl(fileId), "_blank"); }}>
                                            Download
                                        </div>
                                        {isEditor && (
                                            <>
                                                <div className={menuItemClass} onClick={(e) => { e.stopPropagation(); openRename("file", fileId, fileName); }}>
                                                    Rename
                                                </div>
                                                <div className={menuItemClass} onClick={(e) => { e.stopPropagation(); openShare(fileId, fileName); }}>
                                                    Share
                                                </div>
                                                <div className={menuItemClass} onClick={(e) => { e.stopPropagation(); handleDeleteFile(fileId); }}>
                                                    Delete
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
