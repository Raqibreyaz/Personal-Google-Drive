import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaFileAlt,
    FaArrowLeft,
    FaEye,
    FaEdit,
} from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";
import RenameModal from "./components/RenameModal";
import ShareModal from "./components/ShareModal";

export default function SharedWithMePage() {
    const BACKEND_URI =
        import.meta.env.VITE_BACKEND_URI || "http://localhost:8080";
    const navigate = useNavigate();

    const [sharedFiles, setSharedFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [activeContextMenu, setActiveContextMenu] = useState(null);
    const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

    const [showRenameModal, setShowRenameModal] = useState(false);
    const [renameFileId, setRenameFileId] = useState(null);
    const [renameValue, setRenameValue] = useState("");

    const [showShareModal, setShowShareModal] = useState(false);
    const [shareFileId, setShareFileId] = useState(null);
    const [shareFileName, setShareFileName] = useState("");

    async function fetchSharedFiles() {
        try {
            const res = await fetch(`${BACKEND_URI}/share/`, { credentials: "include" });
            if (res.status === 401 || res.status === 400) { navigate("/login"); return; }
            if (!res.ok) { setError("Failed to load shared files."); return; }
            const data = await res.json();
            setSharedFiles(data);
        } catch (err) {
            setError("Something went wrong.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchSharedFiles(); }, []);

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
        window.open(`${BACKEND_URI}/file/${fileId}`, "_blank");
    }

    function handleContextMenu(e, fileId) {
        e.stopPropagation();
        e.preventDefault();
        if (activeContextMenu === fileId) setActiveContextMenu(null);
        else { setActiveContextMenu(fileId); setContextMenuPos({ x: e.clientX - 110, y: e.clientY }); }
    }

    async function handleDeleteFile(fileId) {
        const confirmed = confirm("Delete this file?");
        if (!confirmed) return;
        try {
            const res = await fetch(`${BACKEND_URI}/file/${fileId}`, { method: "DELETE", credentials: "include" });
            if (res.ok) setSharedFiles((prev) => prev.filter((entry) => entry.file?._id !== fileId));
            else { const data = await res.json(); setError(data.error || "Failed to delete file."); }
        } catch (err) { setError("Something went wrong."); }
        setActiveContextMenu(null);
    }

    function handleOpenRename(fileId, fileName) {
        setRenameFileId(fileId);
        setRenameValue(fileName);
        setShowRenameModal(true);
        setActiveContextMenu(null);
    }

    async function handleRenameSubmit(e) {
        e.preventDefault();
        try {
            const res = await fetch(`${BACKEND_URI}/file/rename/${renameFileId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ newFilename: renameValue }),
            });
            if (res.ok) { setShowRenameModal(false); setRenameValue(""); setRenameFileId(null); fetchSharedFiles(); }
            else { const data = await res.json(); setError(data.error || "Failed to rename file."); }
        } catch (err) { setError("Something went wrong."); }
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

            {error && <div className="text-red-500 mb-2">{error}</div>}

            {showRenameModal && (
                <RenameModal renameType="file" renameValue={renameValue} setRenameValue={setRenameValue} onClose={() => setShowRenameModal(false)} onRenameSubmit={handleRenameSubmit} />
            )}

            {showShareModal && (
                <ShareModal fileId={shareFileId} fileName={shareFileName} onClose={() => setShowShareModal(false)} BACKEND_URI={BACKEND_URI} />
            )}

            {loading ? (
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
                                        <div className={menuItemClass} onClick={(e) => { e.stopPropagation(); window.location.href = `${BACKEND_URI}/file/${fileId}?action=download`; }}>
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
