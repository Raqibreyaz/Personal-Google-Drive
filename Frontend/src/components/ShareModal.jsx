import { useState } from "react";
import { FaTrash } from "react-icons/fa";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSharedUsers, shareFile, revokeShare } from "../api/share.js";

function ShareModal({ fileId, fileName, onClose }) {
    const [userEmail, setUserEmail] = useState("");
    const [permission, setPermission] = useState("View");
    const [successMsg, setSuccessMsg] = useState("");
    const queryClient = useQueryClient();

    const { data: sharedUsers = [], isLoading, error } = useQuery({
        queryKey: ["sharedUsers", fileId],
        queryFn: () => getSharedUsers(fileId),
    });

    const invalidateSharedUsers = () => {
        queryClient.invalidateQueries({ queryKey: ["sharedUsers", fileId] });
    };

    const shareMutation = useMutation({
        mutationFn: () => shareFile(fileId, userEmail, permission),
        onSuccess: () => {
            setSuccessMsg(`Shared with ${userEmail}!`);
            setUserEmail("");
            invalidateSharedUsers();
        },
    });

    const revokeMutation = useMutation({
        mutationFn: (email) => revokeShare(fileId, email),
        onSuccess: invalidateSharedUsers,
    });

    function handleShare(e) {
        e.preventDefault();
        setSuccessMsg("");
        shareMutation.mutate();
    }

    function handleRevoke(email) {
        if (!confirm(`Revoke access for ${email}?`)) return;
        revokeMutation.mutate(email);
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[999]" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 p-5 w-[90%] max-w-[480px] rounded transition-colors" onClick={(e) => e.stopPropagation()}>
                <h2 className="mt-0 dark:text-white">Share "{fileName}"</h2>

                <form onSubmit={handleShare} className="flex flex-col gap-2">
                    <input
                        type="email"
                        className="p-3 mt-2.5 mb-2.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                        placeholder="Enter email address"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        required
                    />
                    <div className="flex gap-2 items-center">
                        <select
                            className="py-2 px-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-[0.9rem] text-gray-900 dark:text-white cursor-pointer transition-colors"
                            value={permission}
                            onChange={(e) => setPermission(e.target.value)}
                        >
                            <option value="View">Viewer</option>
                            <option value="Edit">Editor</option>
                        </select>
                        <button
                            className="bg-blue-600 text-white border-none rounded py-2 px-4 cursor-pointer hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                            type="submit"
                            disabled={shareMutation.isPending}
                        >
                            {shareMutation.isPending ? "Sharing..." : "Share"}
                        </button>
                    </div>
                </form>

                {(error || shareMutation.error || revokeMutation.error) && (
                    <p className="text-red-700 text-[0.85rem] mt-2">
                        {error?.message || shareMutation.error?.message || revokeMutation.error?.message}
                    </p>
                )}
                {successMsg && <p className="text-green-700 text-[0.85rem] mt-2">{successMsg}</p>}

                {sharedUsers.length > 0 && (
                    <div className="mt-4 border-t border-gray-100 dark:border-gray-700 pt-3 transition-colors">
                        <h3 className="m-0 mb-2 text-[0.95rem] text-gray-500 dark:text-gray-400">People with access</h3>
                        {sharedUsers.map((entry) => (
                            <div key={entry._id} className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-700 transition-colors">
                                <div className="flex flex-col">
                                    <span className="font-medium text-[0.9rem] dark:text-white">{entry.user?.name || "Unknown"}</span>
                                    <span className="text-[0.8rem] text-gray-500 dark:text-gray-400">{entry.user?.email || ""}</span>
                                </div>
                                <span className="text-[0.8rem] text-sky-700 capitalize">{entry.permission}</span>
                                <button
                                    className="bg-none border-none text-red-700 dark:text-red-400 cursor-pointer text-[0.85rem] py-1 px-2 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
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
                    <button className="bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-none rounded py-2 px-4 cursor-pointer hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ShareModal;
