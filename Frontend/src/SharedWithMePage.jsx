import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaFileAlt,
    FaArrowLeft,
    FaEye,
    FaEdit,
} from "react-icons/fa";
import "./SharedWithMe.css";

export default function SharedWithMePage() {
    const BACKEND_URI =
        import.meta.env.VITE_BACKEND_URI || "http://localhost:8080";
    const navigate = useNavigate();

    const [sharedFiles, setSharedFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
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

        fetchSharedFiles();
    }, []);

    function formatSize(bytes) {
        if (!bytes) return "—";
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    function handleFileClick(fileId) {
        window.open(`${BACKEND_URI}/file/${fileId}`, "_blank");
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

            {loading ? (
                <p className="shared-loading">Loading...</p>
            ) : sharedFiles.length === 0 ? (
                <p className="shared-empty">No files have been shared with you yet.</p>
            ) : (
                <div className="shared-list">
                    {sharedFiles.map((entry, idx) => (
                        <div
                            key={idx}
                            className="shared-item"
                            onClick={() => handleFileClick(entry.file?._id)}
                        >
                            <div className="shared-item-left">
                                <FaFileAlt className="shared-file-icon" />
                                <div className="shared-file-info">
                                    <span className="shared-file-name">
                                        {entry.file?.name || "Unknown file"}
                                    </span>
                                    <span className="shared-file-size">
                                        {formatSize(entry.file?.size)}
                                    </span>
                                </div>
                            </div>
                            <div className="shared-item-right">
                                <span className="shared-permission-badge">
                                    {entry.permission === "editor" ? (
                                        <>
                                            <FaEdit /> Editor
                                        </>
                                    ) : (
                                        <>
                                            <FaEye /> Viewer
                                        </>
                                    )}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
