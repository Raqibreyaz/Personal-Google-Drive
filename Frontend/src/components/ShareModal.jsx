import { useState, useEffect } from "react";
import { FaTrash } from "react-icons/fa";

function ShareModal({ fileId, fileName, onClose, BACKEND_URI }) {
    const [userEmail, setUserEmail] = useState("");
    const [permission, setPermission] = useState("viewer");
    const [sharedUsers, setSharedUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // Fetch users who have access to this file
    async function fetchSharedUsers() {
        try {
            const res = await fetch(`${BACKEND_URI}/share/${fileId}`, {
                credentials: "include",
            });
            if (res.ok) {
                const data = await res.json();
                setSharedUsers(data);
            }
        } catch (err) {
            console.error("Failed to fetch shared users:", err);
        }
    }

    useEffect(() => {
        fetchSharedUsers();
    }, [fileId]);

    // Share file with a user
    async function handleShare(e) {
        e.preventDefault();
        setError("");
        setSuccessMsg("");
        setLoading(true);

        try {
            const res = await fetch(`${BACKEND_URI}/share/${fileId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ userEmail, permission }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to share file.");
                return;
            }

            setSuccessMsg(`Shared with ${userEmail}!`);
            setUserEmail("");
            fetchSharedUsers();
        } catch (err) {
            setError("Something went wrong.");
        } finally {
            setLoading(false);
        }
    }

    // Revoke access from a user
    async function handleRevoke(email) {
        const confirmed = confirm(
            `Revoke access for ${email}?`,
        );
        if (!confirmed) return;

        try {
            const res = await fetch(`${BACKEND_URI}/share/${fileId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ userEmail: email }),
            });

            if (res.ok) {
                fetchSharedUsers();
            } else {
                const data = await res.json();
                setError(data.error || "Failed to revoke access.");
            }
        } catch (err) {
            setError("Something went wrong.");
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content share-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <h2>Share "{fileName}"</h2>

                <form onSubmit={handleShare} className="share-form">
                    <input
                        type="email"
                        className="modal-input"
                        placeholder="Enter email address"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        required
                    />
                    <div className="share-controls">
                        <select
                            className="permission-select"
                            value={permission}
                            onChange={(e) => setPermission(e.target.value)}
                        >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                        </select>
                        <button
                            className="primary-button"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? "Sharing..." : "Share"}
                        </button>
                    </div>
                </form>

                {error && <p className="share-error">{error}</p>}
                {successMsg && <p className="share-success">{successMsg}</p>}

                {/* List of users with access */}
                {sharedUsers.length > 0 && (
                    <div className="shared-users-list">
                        <h3>People with access</h3>
                        {sharedUsers.map((entry) => (
                            <div key={entry._id} className="shared-user-row">
                                <div className="shared-user-info">
                                    <span className="shared-user-name">
                                        {entry.user?.name || "Unknown"}
                                    </span>
                                    <span className="shared-user-email">
                                        {entry.user?.email || ""}
                                    </span>
                                </div>
                                <span className="shared-user-permission">
                                    {entry.permission}
                                </span>
                                <button
                                    className="revoke-btn"
                                    title="Revoke access"
                                    onClick={() => handleRevoke(entry.user?.email)}
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="modal-buttons" style={{ marginTop: "16px" }}>
                    <button className="secondary-button" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ShareModal;
