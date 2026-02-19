import { useEffect, useState, useRef } from "react";
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
import "./SharedWithMe.css";

export default function SharedWithMePage() {
    const BACKEND_URI =
        import.meta.env.VITE_BACKEND_URI || "http://localhost:8080";
    const navigate = useNavigate();

    const [sharedFiles, setSharedFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Context menu state
    const [activeContextMenu, setActiveContextMenu] = useState(null);
    const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

    // Rename modal state
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [renameFileId, setRenameFileId] = useState(null);
    const [renameValue, setRenameValue] = useState("");

    // Share modal state
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareFileId, setShareFileId] = useState(null);
    const [shareFileName, setShareFileName] = useState("");

    async function fetchSharedFiles() {
        try {
            const res = await fetch(`${BACKEND_URI}/share/`, {
                credentials: "include",
            });

            if (res.status === 401 || res.status === 400) {
                navigate("/login");
                return;
            }

            if (!res.ok) {
                setError("Failed to load shared files.");
                return;
            }

            const data = await res.json();
            setSharedFiles(data);
        } catch (err) {
            setError("Something went wrong.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchSharedFiles();
    }, []);

    // Close context menu on document click
    useEffect(() => {
        function handleDocumentClick() {
            setActiveContextMenu(null);
        }
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
        if (activeContextMenu === fileId) {
            setActiveContextMenu(null);
        } else {
            setActiveContextMenu(fileId);
            setContextMenuPos({ x: e.clientX - 110, y: e.clientY });
        }
    }

    // File operations
    async function handleDeleteFile(fileId) {
        const confirmed = confirm("Delete this file?");
        if (!confirmed) return;

        try {
            const res = await fetch(`${BACKEND_URI}/file/${fileId}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (res.ok) {
                setSharedFiles((prev) =>
                    prev.filter((entry) => entry.file?._id !== fileId),
                );
            } else {
                const data = await res.json();
                setError(data.error || "Failed to delete file.");
            }
        } catch (err) {
            setError("Something went wrong.");
        }
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
            const res = await fetch(
                `${BACKEND_URI}/file/rename/${renameFileId}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ newFilename: renameValue }),
                },
            );
            if (res.ok) {
                setShowRenameModal(false);
                setRenameValue("");
                setRenameFileId(null);
                fetchSharedFiles();
            } else {
                const data = await res.json();
                setError(data.error || "Failed to rename file.");
            }
        } catch (err) {
            setError("Something went wrong.");
        }
    }

    function handleOpenShare(fileId, fileName) {
        setShareFileId(fileId);
        setShareFileName(fileName);
        setShowShareModal(true);
        setActiveContextMenu(null);
    }

    return (
        <div className="shared-page">
            <header className="shared-header">
                <button className="back-btn" onClick={() => navigate("/")}>
                    <FaArrowLeft />
                </button>
                <h1>Shared with Me</h1>
            </header>

            {error && <div className="error-message">{error}</div>}

            {/* Rename Modal */}
            {showRenameModal && (
                <RenameModal
                    renameType="file"
                    renameValue={renameValue}
                    setRenameValue={setRenameValue}
                    onClose={() => setShowRenameModal(false)}
                    onRenameSubmit={handleRenameSubmit}
                />
            )}

            {/* Share Modal */}
            {showShareModal && (
                <ShareModal
                    fileId={shareFileId}
                    fileName={shareFileName}
                    onClose={() => setShowShareModal(false)}
                    BACKEND_URI={BACKEND_URI}
                />
            )}

            {loading ? (
                <p className="shared-loading">Loading...</p>
            ) : sharedFiles.length === 0 ? (
                <p className="shared-empty">No files have been shared with you yet.</p>
            ) : (
                <div className="shared-list">
                    {sharedFiles.map((entry, idx) => {
                        const fileId = entry.file?._id;
                        const fileName = entry.file?.name || "Unknown file";
                        const isEditor = entry.permission === "Edit";

                        return (
                            <div
                                key={idx}
                                className="shared-item"
                                onClick={() => handleFileClick(fileId)}
                                onContextMenu={(e) => handleContextMenu(e, fileId)}
                            >
                                <div className="shared-item-left">
                                    <FaFileAlt className="shared-file-icon" />
                                    <div className="shared-file-info">
                                        <span className="shared-file-name">{fileName}</span>
                                        <span className="shared-file-size">
                                            {formatSize(entry.file?.size)}
                                        </span>
                                    </div>
                                </div>
                                <div className="shared-item-right">
                                    <span className="shared-permission-badge">
                                        {isEditor ? (
                                            <>
                                                <FaEdit /> Editor
                                            </>
                                        ) : (
                                            <>
                                                <FaEye /> Viewer
                                            </>
                                        )}
                                    </span>
                                    <div
                                        className="shared-context-trigger"
                                        onClick={(e) => handleContextMenu(e, fileId)}
                                    >
                                        <BsThreeDotsVertical />
                                    </div>
                                </div>

                                {/* Context menu */}
                                {activeContextMenu === fileId && (
                                    <div
                                        className="context-menu"
                                        style={{
                                            top: contextMenuPos.y,
                                            left: contextMenuPos.x,
                                        }}
                                    >
                                        <div
                                            className="context-menu-item"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.location.href = `${BACKEND_URI}/file/${fileId}?action=download`;
                                            }}
                                        >
                                            Download
                                        </div>
                                        {isEditor && (
                                            <>
                                                <div
                                                    className="context-menu-item"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenRename(fileId, fileName);
                                                    }}
                                                >
                                                    Rename
                                                </div>
                                                <div
                                                    className="context-menu-item"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenShare(fileId, fileName);
                                                    }}
                                                >
                                                    Share
                                                </div>
                                                <div
                                                    className="context-menu-item"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteFile(fileId);
                                                    }}
                                                >
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
