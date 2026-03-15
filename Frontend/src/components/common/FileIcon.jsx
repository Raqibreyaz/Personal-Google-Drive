import {
  FaFolder,
  FaFilePdf,
  FaFileImage,
  FaFileVideo,
  FaFileArchive,
  FaFileCode,
  FaFileAlt,
} from "react-icons/fa";

export function getFileIcon(filename) {
  if (!filename) return "alt";
  const ext = filename.split(".").pop().toLowerCase();
  switch (ext) {
    case "pdf": return "pdf";
    case "png": case "jpg": case "jpeg": case "gif": return "image";
    case "mp4": case "mov": case "avi": return "video";
    case "zip": case "rar": case "tar": case "gz": return "archive";
    case "js": case "jsx": case "ts": case "tsx": case "html": case "css": case "py": case "java": return "code";
    default: return "alt";
  }
}

export default function FileIcon({ filename, isDirectory, className = "" }) {
  if (isDirectory) {
    return <FaFolder className={`text-orange-500 ${className}`} />;
  }

  const iconType = getFileIcon(filename);
  const colorClass = "text-blue-500";

  switch (iconType) {
    case "pdf": return <FaFilePdf className={`${colorClass} ${className}`} />;
    case "image": return <FaFileImage className={`${colorClass} ${className}`} />;
    case "video": return <FaFileVideo className={`${colorClass} ${className}`} />;
    case "archive": return <FaFileArchive className={`${colorClass} ${className}`} />;
    case "code": return <FaFileCode className={`${colorClass} ${className}`} />;
    default: return <FaFileAlt className={`${colorClass} ${className}`} />;
  }
}
