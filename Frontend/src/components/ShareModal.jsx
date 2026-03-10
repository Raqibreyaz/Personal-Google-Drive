import { useState, useEffect } from "react";
import { FaTrash } from "react-icons/fa";
import { getSharedUsers, shareFile, revokeShare } from "../api/share.js";
import useApiCall from "../hooks/useApiCall.js";

function ShareModal({ fileId, fileName, onClose }) {
    const [userEmail, setUserEmail] = useState("");
    const [permission, setPermission] = useState("View");
    const [sharedUsers, setSharedUsers] = useState([]);
    const [successMsg, setSuccessMsg] = useState("");
    const { execute, loading, error, setError } = useApiCall();

    async function fetchSharedUsersList() {
        try {
            const data = await getSharedUsers(fileId);
            setSharedUsers(data);
        } catch (err) {
            // silently fail — modal still usable
        }
    }

    useEffect(() => { fetchSharedUsersList(); }, [fileId]);

    function handleShare(e) {
        e.preventDefault();
        setSuccessMsg("");
        execute(
            () => shareFile(fileId, userEmail, permission),
            () => {
                setSuccessMsg(`Shared with ${userEmail}!`);
                setUserEmail("");
                fetchSharedUsersList();
            },
        );
    }

    function handleRevoke(email) {
        const confirmed = confirm(`Revoke access for ${email}?`);
        if (!confirmed) return;
        execute(
            () => revokeShare(fileId, email),
            () => fetchSharedUsersList(),
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[999]" onClick={onClose}>
            <div className="bg-white p-5 w-[90%] max-w-[480px] rounded" onClick={(e) => e.stopPropagation()}>
                <h2 className="mt-0">Share "{fileName}"</h2>

                <form onSubmit={handleShare} className="flex flex-col gap-2">
                    <input
                        type="email"
                        className="p-3 mt-2.5 mb-2.5 border border-gray-300 rounded"
                        placeholder="Enter email address"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        required
                    />
                    <div className="flex gap-2 items-center">
                        <select
                            className="py-2 px-3 border border-gray-300 rounded bg-white text-[0.9rem] cursor-pointer"
                            value={permission}
                            onChange={(e) => setPermission(e.target.value)}
                        >
                            <option value="View">Viewer</option>
                            <option value="Edit">Editor</option>
                        </select>
                        <button
                            className="bg-blue-600 text-white border-none rounded py-2 px-4 cursor-pointer hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? "Sharing..." : "Share"}
                        </button>
                    </div>
                </form>

                {error && <p className="text-red-700 text-[0.85rem] mt-2">{error}</p>}
                {successMsg && <p className="text-green-700 text-[0.85rem] mt-2">{successMsg}</p>}

                {sharedUsers.length > 0 && (
                    <div className="mt-4 border-t border-gray-100 pt-3">
                        <h3 className="m-0 mb-2 text-[0.95rem] text-gray-500">People with access</h3>
                        {sharedUsers.map((entry) => (
                            <div key={entry._id} className="flex items-center justify-between py-1.5 border-b border-gray-100">
                                <div className="flex flex-col">
                                    <span className="font-medium text-[0.9rem]">{entry.user?.name || "Unknown"}</span>
                                    <span className="text-[0.8rem] text-gray-500">{entry.user?.email || ""}</span>
                                </div>
                                <span className="text-[0.8rem] text-sky-700 capitalize">{entry.permission}</span>
                                <button
                                    className="bg-none border-none text-red-700 cursor-pointer text-[0.85rem] py-1 px-2 rounded hover:bg-red-50"
                                    title="Revoke access"
                                    onClick={() => handleRevoke(entry.user?.email)}
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex justify-end gap-2.5 mt-4">
                    <button className="bg-gray-300 text-gray-700 border-none rounded py-2 px-4 cursor-pointer hover:bg-gray-400" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ShareModal;
