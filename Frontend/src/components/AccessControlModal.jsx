import { useState } from "react";
import { FaCopy, FaCheck } from "react-icons/fa";
import { setFileAccess, getFileUrl } from "../api/file.js";

function AccessControlModal({
    fileId,
    fileName,
    currentAccess,
    onClose,
    onAccessChanged,
}) {
    const [permission, setPermission] = useState(currentAccess || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    const fileLink = getFileUrl(fileId);

    async function handleSave() {
        setLoading(true);
        setError("");
        try {
            const res = await setFileAccess(fileId, permission || null);
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
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[999]" onClick={onClose}>
            <div className="bg-white p-5 w-[90%] max-w-[480px] rounded" onClick={(e) => e.stopPropagation()}>
                <h2 className="mt-0">Manage Access</h2>
                <p className="text-gray-500 text-[0.9rem] mt-1 mb-4">{fileName}</p>

                <div className="flex flex-col gap-1.5 mb-3">
                    <label className="font-medium text-[0.9rem] text-gray-700">Anyone with the link:</label>
                    <select
                        className="py-2 px-3 border border-gray-300 rounded bg-white text-[0.9rem] cursor-pointer"
                        value={permission}
                        onChange={(e) => setPermission(e.target.value)}
                    >
                        <option value="">No access (restricted)</option>
                        <option value="View">Can view</option>
                        <option value="Edit">Can edit</option>
                    </select>
                </div>

                {permission && (
                    <div className="flex gap-2 items-center mt-2">
                        <input
                            type="text"
                            className="flex-1 p-3 border border-gray-300 rounded text-[0.85rem] text-gray-500"
                            value={fileLink}
                            readOnly
                        />
                        <button
                            className="bg-none border border-gray-300 rounded py-2 px-2.5 cursor-pointer text-blue-600 flex items-center hover:bg-gray-100"
                            onClick={handleCopyLink}
                            title="Copy link"
                        >
                            {copied ? <FaCheck /> : <FaCopy />}
                        </button>
                    </div>
                )}

                {error && <p className="text-red-700 text-[0.85rem] mt-2">{error}</p>}

                <div className="flex justify-end gap-2.5 mt-4">
                    <button
                        className="bg-blue-600 text-white border-none rounded py-2 px-4 cursor-pointer hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? "Saving..." : "Save"}
                    </button>
                    <button className="bg-gray-300 text-gray-700 border-none rounded py-2 px-4 cursor-pointer hover:bg-gray-400" onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AccessControlModal;
