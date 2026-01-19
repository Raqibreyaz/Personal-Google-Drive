import { memo, useState } from "react";
import { Link } from "react-router-dom";

const FilesList = memo(({ files, update_files }) => {
  const BACKEND_URL = "http://localhost:8080";

  const [renaming, set_renaming] = useState(null);

  const handleRename = async (event) => {
    event.preventDefault();

    if (!event.target.length || !event.target[0].value) return;

    const new_name = event.target[0].value;

    const route = renaming.isDirectory ? "directory" : "file";

    const body = {};
    if (renaming.isDirectory) body.new_dirname = new_name;
    else body.new_filename = new_name;

    const res = await fetch(`${BACKEND_URL}/${route}/${renaming.id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

    const text = await res.json();
    alert(text.message);
    set_renaming(null);
    update_files();
  };

  const handleDelete = async (id, isDirectory = false) => {
    const route = isDirectory ? "directory" : "file";
    const res = await fetch(`${BACKEND_URL}/${route}/${id}`, {
      method: "DELETE",
    });

    const text = await res.json();
    alert(text.message);
    update_files();
  };

  return (
    <div>
      {files.directories?.map((dir, index) => (
        <div key={dir.id}>
          <div className="flex gap-1.5">
            <span>{dir.name}</span>
            <Link className="text-blue-600" to={`/directory/${dir.id}`}>
              Open
            </Link>
            <button
              className="text-blue-600"
              onClick={() => set_renaming({ id: dir.id, isDirectory: true })}
            >
              Rename
            </button>
            <button
              className="text-blue-600"
              onClick={() => handleDelete(dir.id, true)}
            >
              Delete
            </button>
          </div>
          {renaming && renaming.id === dir.id && (
            <form onSubmit={handleRename} className="space-x-2">
              <input
                type="text"
                name="new_filename"
                className="border rounded"
                defaultValue={dir.name}
              />
              <button type="submit" className="border">
                Update
              </button>
            </form>
          )}
        </div>
      ))}
      {files.files?.map((file, index) => (
        <div key={file.id}>
          <div className="flex gap-1.5">
            <span>{file.name}</span>
            <a
              className="text-blue-600"
              href={`${BACKEND_URL}/file/${file.id}`}
            >
              Open
            </a>
            <button
              className="text-blue-600"
              onClick={() => set_renaming({ id: file.id, isDirectory: false })}
            >
              Rename
            </button>
            <button
              className="text-blue-600"
              onClick={() => handleDelete(file.id, false)}
            >
              Delete
            </button>
            <a
              className="text-green-500"
              href={`${BACKEND_URL}/file/${file.id}?action=download`}
            >
              Download
            </a>
          </div>
          {renaming && renaming.id === file.id && (
            <form onSubmit={handleRename} className="space-x-2">
              <input
                type="text"
                name="new_filename"
                className="border rounded"
                defaultValue={file.name}
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
