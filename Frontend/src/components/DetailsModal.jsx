import { useEffect, useState } from "react";
import { getDirectoryCounts } from "../api/directory";
import formatSize from '../utils/formatSize'

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString();
}

function DetailsModal({ item, directoryName, directoryPath, onClose }) {
  console.log(directoryPath)
  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const [counts, setCounts] = useState(null);
  const [loadingCounts, setLoadingCounts] = useState(false);

  useEffect(() => {
    if (item.isDirectory) {
      setLoadingCounts(true);
      getDirectoryCounts(item._id)
        .then(data => setCounts(data))
        .catch(err => console.error("Failed to fetch directory counts:", err))
        .finally(() => setLoadingCounts(false));
    }
  }, [item]);

  const pathNotExists = !directoryPath.length

  const currPath = directoryName !== '/' ? `${pathNotExists ? '' : '/'}${directoryPath.slice(1).map(({ name }) => name).join('/')}/${directoryName}` : ''

  const itemPath = `${currPath}/${item.name}`

  const rows = [
    { label: "Name", value: item.name },
    { label: "Path", value: itemPath },
    { label: "Size", value: formatSize(item.size) },
  ];

  if (item.isDirectory) {
    rows.push({
      label: "Contents",
      value: loadingCounts
        ? "Loading..."
        : counts
          ? `${counts.fileCount} Files, ${counts.dirCount} Folders`
          : "—"
    });
  }

  rows.push(
    { label: "Created", value: formatDate(item.createdAt) },
    { label: "Updated", value: formatDate(item.updatedAt) }
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[999]" onClick={onClose}>
      <div className="bg-white p-5 w-[90%] max-w-[420px] rounded" onClick={(e) => e.stopPropagation()}>
        <h2 className="mt-0 mb-4 text-lg font-semibold">
          {item.isDirectory ? "Folder" : "File"} Details
        </h2>
        <table className="w-full text-sm">
          <tbody>
            {rows.map(({ label, value }) => (
              <tr key={label} className="border-b border-gray-100 last:border-0">
                <td className="py-2 pr-4 text-gray-500 font-medium whitespace-nowrap">{label}</td>
                <td className="py-2 text-gray-800 break-all">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end mt-4">
          <button
            className="bg-gray-300 text-gray-700 border-none rounded py-2 px-4 cursor-pointer hover:bg-gray-400"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default DetailsModal;
