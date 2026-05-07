import { useState } from "react";
import { FaCopy, FaCheck } from "react-icons/fa";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setFileAccess, getFileUrl } from "../api/file.js";

function AccessControlModal({
    fileId,
    fileName,
    currentAccess,
    onClose,
    onAccessChanged,
    dirId,
}) {
    const [permission, setPermission] = useState(currentAccess || "");
    const [copied, setCopied] = useState(false);
    const queryClient = useQueryClient();

    const accessMutation = useMutation({
        mutationFn: () => setFileAccess(fileId, permission || null),
        onSuccess: () => {
            if (onAccessChanged) onAccessChanged(permission || null);
            // Invalidate directory to refresh counts/details if needed
            queryClient.invalidateQueries({ queryKey: ["directory", dirId || "root"] });
            onClose();
        },
    });

    const fileLink = getFileUrl(fileId);

    function handleSave() {
        accessMutation.mutate();
    }

    function handleCopyLink() {
        navigator.clipboard.writeText(fileLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[999]" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 p-5 w-[90%] max-w-[480px] rounded transition-colors" onClick={(e) => e.stopPropagation()}>
                <h2 className="mt-0 dark:text-white">Manage Access</h2>
                <p className="text-gray-500 dark:text-gray-400 text-[0.9rem] mt-1 mb-4">{fileName}</p>

                <div className="flex flex-col gap-1.5 mb-3">
                    <label className="font-medium text-[0.9rem] text-gray-700 dark:text-gray-300">Anyone with the link:</label>
                    <select
                        className="py-2 px-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-[0.9rem] text-gray-900 dark:text-white cursor-pointer transition-colors"
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
                            className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded text-[0.85rem] text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 transition-colors"
                            value={fileLink}
                            readOnly
                        />
                        <button
                            className="bg-none border border-gray-300 dark:border-gray-600 rounded py-2 px-2.5 cursor-pointer text-blue-600 flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            onClick={handleCopyLink}
                            title="Copy link"
                        >
                            {copied ? <FaCheck /> : <FaCopy />}
                        </button>
                    </div>
                )}

                {accessMutation.error && <p className="text-red-700 text-[0.85rem] mt-2">{accessMutation.error.message}</p>}

                <div className="flex justify-end gap-2.5 mt-4">
                    <button
                        className="bg-blue-600 text-white border-none rounded py-2 px-4 cursor-pointer hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                        onClick={handleSave}
                        disabled={accessMutation.isPending}
                    >
                        {accessMutation.isPending ? "Saving..." : "Save"}
                    </button>
                    <button className="bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-none rounded py-2 px-4 cursor-pointer hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors" onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AccessControlModal;
