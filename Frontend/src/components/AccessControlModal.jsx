import { useState } from "react";
import { FaCopy, FaCheck } from "react-icons/fa";

function AccessControlModal({
    fileId,
    fileName,
    currentAccess,
    onClose,
    onAccessChanged,
    BACKEND_URI,
}) {
    const [permission, setPermission] = useState(currentAccess || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    const fileLink = `${BACKEND_URI}/file/${fileId}`;

    async function handleSave() {
        setLoading(true);
        setError("");

        try {
            const res = await fetch(`${BACKEND_URI}/file/set-access/${fileId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    permission: permission || null,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Failed to update access.");
                return;
            }

            if (onAccessChanged) onAccessChanged(permission || null);
            onClose();
        } catch (err) {
            setError("Something went wrong.");
        } finally {
            setLoading(false);
        }
    }

    function handleCopyLink() {
        navigator.clipboard.writeText(fileLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content access-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <h2>Manage Access</h2>
                <p className="access-filename">{fileName}</p>

                <div className="access-control-group">
                    <label className="access-label">Anyone with the link:</label>
                    <select
                        className="permission-select"
                        value={permission}
                        onChange={(e) => setPermission(e.target.value)}
                    >
                        <option value="">No access (restricted)</option>
                        <option value="viewer">Can view</option>
                        <option value="editor">Can edit</option>
                    </select>
                </div>

                {permission && (
                    <div className="link-copy-row">
                        <input
                            type="text"
                            className="modal-input link-input"
                            value={fileLink}
                            readOnly
                        />
                        <button
                            className="copy-btn"
                            onClick={handleCopyLink}
                            title="Copy link"
                        >
                            {copied ? <FaCheck /> : <FaCopy />}
                        </button>
                    </div>
                )}

                {error && <p className="share-error">{error}</p>}

                <div className="modal-buttons" style={{ marginTop: "16px" }}>
                    <button
                        className="primary-button"
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? "Saving..." : "Save"}
                    </button>
                    <button className="secondary-button" onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AccessControlModal;
