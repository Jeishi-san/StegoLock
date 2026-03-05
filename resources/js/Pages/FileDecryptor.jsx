import React, { useState } from "react";

export default function FileDecryptor() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  const handleDecrypt = async () => {
    if (!file || !password) {
      setStatus("⚠️ Select encrypted file and enter password.");
      return;
    }

    setStatus("🔓 Decrypting...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("password", password);

      const response = await fetch("http://127.0.0.1:5000/decrypt", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Backend error:", text);
        throw new Error("Decryption failed");
      }

      const blob = await response.blob();

      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);

      // remove .enc if present
      const originalName = file.name.replace(".enc", "");
      link.download = originalName;

      link.click();

      setStatus("✅ Decryption complete. File downloaded.");
    } catch (err) {
      console.error("Decryption error:", err);
      setStatus("❌ Invalid password or corrupted file.");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "500px" }}>
      <h2>StegoLock Decrypt (Python Backend)</h2>

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

      <button onClick={handleDecrypt}>
        Decrypt
      </button>

      <p>{status}</p>
    </div>
  );
}
