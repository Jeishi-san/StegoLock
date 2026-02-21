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

    setStatus("🔒 Encrypting...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("password", password);

      const response = await fetch("http://127.0.0.1:5000/encrypt", {
        method: "POST",
        body: formData,
        // mode: "cors" is default in fetch, but can explicitly set if needed
      });

      if (!response.ok) {
        // log the backend response for debugging
        const text = await response.text();
        console.error("Backend error response:", text);
        throw new Error(`Encryption failed: ${response.status}`);
      }

      const blob = await response.blob();

      // trigger download
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = file.name + ".enc";
      link.click();

      setStatus("✅ Encryption complete. File downloaded.");
    } catch (err) {
      console.error("Encryption error:", err);
      setStatus("❌ Error during encryption. Check console for details.");
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
