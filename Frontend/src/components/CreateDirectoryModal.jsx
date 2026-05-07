import { useEffect, useRef } from "react";

function CreateDirectoryModal({
  newDirname,
  setNewDirname,
  onClose,
  onCreateDirectory,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
    const handleKeyDown = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[999]" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 p-5 w-[90%] max-w-[400px] rounded transition-colors" onClick={(e) => e.stopPropagation()}>
        <h2 className="mt-0 text-gray-900 dark:text-gray-100">Create a new directory</h2>
        <form onSubmit={onCreateDirectory} className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="text"
            className="p-3 mt-2.5 mb-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter folder name"
            value={newDirname}
            onChange={(e) => setNewDirname(e.target.value)}
          />
          <div className="flex justify-end gap-2.5">
            <button className="bg-blue-600 text-white border-none rounded py-2 px-4 cursor-pointer hover:bg-blue-700" type="submit">
              Create
            </button>
            <button className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 border-none rounded py-2 px-4 cursor-pointer hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors" type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateDirectoryModal;
