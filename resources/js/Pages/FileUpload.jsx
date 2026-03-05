import React, { useState } from "react";

export default function FileUpload() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setStatus("⚠️ Select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setStatus("Uploading...");

    try {
      const response = await fetch("http://127.0.0.1:5000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setStatus(`✅ Upload successful! File ID: ${data.file_id}`);
      } else {
        setStatus(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      setStatus(`❌ Error: ${err.message}`);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-2">Upload File to Drive</h2>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        className="mb-2"
      />

      <button
        onClick={handleUpload}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Upload
      </button>

      {status && <p className="mt-2">{status}</p>}
    </div>
  );
}
