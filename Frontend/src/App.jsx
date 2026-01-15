import { useState, useEffect } from "react";
import FilesList from "./components/FilesList.jsx";

function App() {
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(null);

  const update_files = () => {
    fetch("http://[2409:40e3:319a:291b:4c32:5064:8e0f:f468]:8080", {
      method: "GET",
    })
      .then((res) => res.json())
      .then(setFiles);
  };

  useEffect(() => {
    update_files();
  }, [setFiles]);

  const handle_change = (event) => {
    const file = event.target.files[0];
    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      "http://[2409:40e3:319a:291b:4c32:5064:8e0f:f468]:8080",
      true
    );
    xhr.setRequestHeader("filename", file.name);
    xhr.addEventListener("load", () => {
      alert(xhr.response);
      setUploadProgress(100);
      update_files();
    });

    xhr.upload.addEventListener("progress", (e) => {
      const total_progress = (e.loaded / e.total) * 100;
      const pct = total_progress.toFixed(2);
      setUploadProgress(pct);

      console.log("progress: ", pct);
    });

    xhr.send(file);
  };

  return (
    <div className="p-2">
      <h1 className="text-xl">My Files</h1>
      <div>
        <div className="space-y-1.5 flex gap-x-1 items-center">
          <input
            className=""
            type="file"
            id="file-input"
            onChange={handle_change}
          />
          <label
            htmlFor="file-input"
            className="cursor-pointer border rounded-md p-1 "
          >
            Upload File
          </label>
          {uploadProgress !== null && <p>Upload Progress: {uploadProgress}%</p>}
        </div>
        <FilesList files={files} update_files={update_files} />
      </div>
    </div>
  );
}

export default App;
