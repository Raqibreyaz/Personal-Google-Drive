import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    FaFileAlt,
    FaArrowLeft,
    FaEye,
    FaEdit,
} from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";
import RenameModal from "./components/RenameModal";
import ShareModal from "./components/ShareModal";
import { getSharedWithMe } from "./api/share.js";
import { deleteFile, renameFile, getFileUrl, getDownloadUrl } from "./api/file.js";
import { sanitizeText } from "./utils/sanitize.js";

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
        onSuccess: invalidateShared,
    });

    const [activeContextMenu, setActiveContextMenu] = useState(null);
    const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

    const [showRenameModal, setShowRenameModal] = useState(false);
    const [renameFileId, setRenameFileId] = useState(null);
    const [renameValue, setRenameValue] = useState("");

    const [showShareModal, setShowShareModal] = useState(false);
    const [shareFileId, setShareFileId] = useState(null);
    const [shareFileName, setShareFileName] = useState("");

    useEffect(() => {
        function handleDocumentClick() { setActiveContextMenu(null); }
        document.addEventListener("click", handleDocumentClick);
        return () => document.removeEventListener("click", handleDocumentClick);
    }, []);

    function formatSize(bytes) {
        if (!bytes) return "—";
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    function handleFileClick(fileId) {
        if (activeContextMenu) return;
        window.open(getFileUrl(fileId), "_blank");
    }

    function handleContextMenu(e, fileId) {
        e.stopPropagation();
        e.preventDefault();
        if (activeContextMenu === fileId) setActiveContextMenu(null);
        else { setActiveContextMenu(fileId); setContextMenuPos({ x: e.clientX - 110, y: e.clientY }); }
    }

    function handleDeleteFile(fileId) {
        const confirmed = confirm("Delete this file?");
        if (!confirmed) return;
        deleteMutation.mutate(fileId);
        setActiveContextMenu(null);
    }

    function handleOpenRename(fileId, fileName) {
        setRenameFileId(fileId);
        setRenameValue(fileName);
        setShowRenameModal(true);
        setActiveContextMenu(null);
    }

    function handleRenameSubmit(e) {
        e.preventDefault();
        renameMutation.mutate(
            { id: renameFileId, name: sanitizeText(renameValue) },
            {
                onSuccess: () => {
                    setShowRenameModal(false);
                    setRenameValue("");
                    setRenameFileId(null);
                }
            }
        );
    }

    function handleOpenShare(fileId, fileName) {
        setShareFileId(fileId);
        setShareFileName(fileName);
        setShowShareModal(true);
        setActiveContextMenu(null);
    }

    const menuItemClass = "px-5 py-2 cursor-pointer whitespace-nowrap text-gray-700 hover:bg-gray-100";

    return (
        <div className="max-w-[800px] mx-auto p-5">
            <header className="flex items-center gap-3 mb-6 border-b-2 border-gray-300 pb-3">
                <button className="bg-none border-none text-xl cursor-pointer text-blue-600 flex items-center p-1.5 rounded-full hover:bg-gray-100" onClick={() => navigate("/")}>
                    <FaArrowLeft />
                </button>
                <h1 className="m-0 text-3xl">Shared with Me</h1>
            </header>

            {(error || deleteMutation.error || renameMutation.error) && (
                <div className="text-red-500 mb-2">
                    {error?.message || deleteMutation.error?.message || renameMutation.error?.message}
                </div>
            )}

            {showRenameModal && (
                <RenameModal renameType="file" renameValue={renameValue} setRenameValue={setRenameValue} onClose={() => setShowRenameModal(false)} onRenameSubmit={handleRenameSubmit} />
            )}

            {showShareModal && (
                <ShareModal fileId={shareFileId} fileName={shareFileName} onClose={() => setShowShareModal(false)} />
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
                                className="flex items-center justify-between py-3 px-4 border border-gray-200 rounded-md cursor-pointer bg-gray-50 transition-colors hover:bg-gray-100"
                                onClick={() => handleFileClick(fileId)}
                                onContextMenu={(e) => handleContextMenu(e, fileId)}
                            >
                                <div className="flex items-center gap-3">
                                    <FaFileAlt className="text-xl text-blue-600" />
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-800">{fileName}</span>
                                        <span className="text-[0.8rem] text-gray-500">{formatSize(entry.file?.size)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center gap-1 py-1 px-2.5 rounded-xl text-[0.8rem] font-medium bg-sky-100 text-sky-700">
                                        {isEditor ? (<><FaEdit /> Editor</>) : (<><FaEye /> Viewer</>)}
                                    </span>
                                    <div
                                        className="flex items-center justify-center text-lg cursor-pointer text-gray-500 rounded-full p-1.5 hover:bg-gray-200"
                                        onClick={(e) => handleContextMenu(e, fileId)}
                                    >
                                        <BsThreeDotsVertical />
                                    </div>
                                </div>

                                {activeContextMenu === fileId && (
                                    <div className="fixed bg-white shadow-md rounded z-[999] py-1" style={{ top: contextMenuPos.y, left: contextMenuPos.x }}>
                                        <div className={menuItemClass} onClick={(e) => { e.stopPropagation(); window.location.href = getDownloadUrl(fileId); }}>
                                            Download
                                        </div>
                                        {isEditor && (
                                            <>
                                                <div className={menuItemClass} onClick={(e) => { e.stopPropagation(); handleOpenRename(fileId, fileName); }}>
                                                    Rename
                                                </div>
                                                <div className={menuItemClass} onClick={(e) => { e.stopPropagation(); handleOpenShare(fileId, fileName); }}>
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
