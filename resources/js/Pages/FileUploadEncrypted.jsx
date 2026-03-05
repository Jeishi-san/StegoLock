import React, { useState } from "react";

export default function FileEncryptor() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  const handleEncrypt = async () => {
    if (!file || !password) {
        setStatus("⚠️ Select a file and enter a password.");
        return;
    }

    setStatus("🔒 Encrypting & Uploading...");

    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("password", password);

        // 🔁 UPDATED ENDPOINT
        const response = await fetch("http://127.0.0.1:5000/encrypt-upload", {
        method: "POST",
        body: formData,
        });

        // 🔁 READ JSON INSTEAD OF BLOB
        const data = await response.json();

        if (!response.ok) {
        console.error("Backend error:", data);
        throw new Error(data.error || "Upload failed");
        }

        setStatus(`✅ Uploaded successfully! File ID: ${data.file_id}`);

    } catch (err) {
        console.error("Encryption error:", err);
        setStatus("❌ Error during encryption/upload. Check console.");
    }
    };

  return (
    <div style={{ padding: "20px", maxWidth: "500px" }}>
      <h2>StegoLock Encrypt (Python Backend)</h2>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <br /><br />

      <input
        type="password"
        placeholder="Enter password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br /><br />

      <button onClick={handleEncrypt}>
        Encrypt
      </button>

      <p>{status}</p>
    </div>
  );
}
