import { memo, useState } from "react";

const FilesList = memo(({ files, update_files }) => {
  const BACKEND_URL = "http://[2409:40e3:319a:291b:4c32:5064:8e0f:f468]:8080";

  const [renaming, set_renaming] = useState(null);

  const handleRename = async (event) => {
    event.preventDefault();

    console.log(event.target[0].value);

    const res = await fetch(BACKEND_URL, {
      method: "PUT",
      headers: {
        new_filename: event.target[0].value,
        old_filename: renaming.filename,
      },
    });

    const text = await res.text();
    alert(text);
    set_renaming(null);
    update_files();
  };

  const handleDelete = async (filename) => {
    const res = await fetch(BACKEND_URL, {
      method: "DELETE",
      headers: { filename },
    });

    const text = await res.text();
    alert(text);
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
              href={`${BACKEND_URL}/${file.parent_path}/${file.name}/open`}
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
                href={`${BACKEND_URL}/${file.parent_path}/${file.name}/download`}
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
