import { memo, useState } from "react";

const FilesList = memo(({ files, update_files }) => {
  const BACKEND_URL = "http://localhost:8080";

  const [renaming, set_renaming] = useState(null);

  const handleRename = async (event) => {
    event.preventDefault();

    if (!event.target.length || !event.target[0].value) return;

    const res = await fetch(`${BACKEND_URL}/${renaming.filename}`, {
      method: "PATCH",
      body: JSON.stringify({
        new_filename: event.target[0].value,
      }),
      headers: { "Content-Type": "application/json" },
    });

    const text = await res.json();
    alert(text.message);
    set_renaming(null);
    update_files();
  };

  const handleDelete = async (filename) => {
    const res = await fetch(`${BACKEND_URL}/${filename}`, {
      method: "DELETE",
    });

    const text = await res.json();
    alert(text.message);
    update_files();
  };

  return (
    <div>
      {files.map((file, index) => (
        <div key={file.name}>
          <div className="flex gap-1.5">
            <span>{file.name}</span>
            <a
              className="text-blue-600"
              href={`${BACKEND_URL}/${file.name}?action=open`}
            >
              Open
            </a>
            <button
              className="text-blue-600"
              onClick={() => set_renaming({ filename: file.name })}
            >
              Rename
            </button>
            <button
              className="text-blue-600"
              onClick={() => handleDelete(file.name)}
            >
              Delete
            </button>
            {file.is_directory ? null : (
              <a
                className="text-green-500"
                href={`${BACKEND_URL}/${file.name}?action=download`}
              >
                Download
              </a>
            )}
          </div>
          {renaming && renaming.filename === file.name && (
            <form onSubmit={handleRename} className="space-x-2">
              <input
                type="text"
                name="new_filename"
                className="border rounded"
                defaultValue={renaming.filename}
              />
              <button type="submit" className="border">
                Update
              </button>
            </form>
          )}
        </div>
      ))}
    </div>
  );
});

export default FilesList;
