import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDirectoryCounts } from "../api/directory";
import formatSize from '../utils/formatSize';
import { formatDate } from "../utils/date";

function DetailsModal({ item, directoryName, directoryPath, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const { data: counts, isLoading: loadingCounts } = useQuery({
    queryKey: ["directoryCounts", item._id],
    queryFn: () => getDirectoryCounts(item._id),
    enabled: item.isDirectory,
  });

  const rows = useMemo(() => {
    const pathNotExists = !directoryPath.length;
    const currPath = directoryName !== '/' 
      ? `${pathNotExists ? '' : '/'}${directoryPath.slice(1).map(({ name }) => name).join('/')}/${directoryName}` 
      : '';
    const itemPath = `${currPath}/${item.name}`;

    const res = [
      { label: "Name", value: item.name },
      { label: "Path", value: itemPath },
      { label: "Size", value: formatSize(item.size) },
    ];

    if (item.isDirectory) {
      res.push({
        label: "Contents",
        value: loadingCounts
          ? "Loading..."
          : counts
            ? `${counts.fileCount} Files, ${counts.dirCount} Folders`
            : "—"
      });
    }

    res.push(
      { label: "Created", value: formatDate(item.createdAt) },
      { label: "Updated", value: formatDate(item.updatedAt) }
    );

    return res;
  }, [item, directoryName, directoryPath, counts, loadingCounts]);

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[999]" onClick={onClose}>
      <div className="bg-white p-5 w-[90%] max-w-[420px] rounded shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="mt-0 mb-4 text-lg font-semibold text-gray-800">
          {item.isDirectory ? "Folder" : "File"} Details
        </h2>
        <table className="w-full text-sm">
          <tbody>
            {rows.map(({ label, value }) => (
              <tr key={label} className="border-b border-gray-100 last:border-0">
                <td className="py-2.5 pr-4 text-gray-500 font-medium whitespace-nowrap align-top">{label}</td>
                <td className="py-2.5 text-gray-800 break-all">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end mt-6">
          <button
            className="bg-gray-100 text-gray-700 border border-gray-300 rounded py-2 px-5 cursor-pointer hover:bg-gray-200 transition-colors font-medium"
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
