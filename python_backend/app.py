from flask import Flask, request, send_file
from flask_cors import CORS
import io
from encryption.aes_module import encrypt_file

app = Flask(__name__)
CORS(app, origins=["http://127.0.0.1:8000"])

@app.route("/encrypt", methods=["POST"])
def encrypt():
    file = request.files.get("file")
    password = request.form.get("password")

    if not file or not password:
        return {"error": "File and password required"}, 400

    content = file.read()
    encrypted_blob = encrypt_file(content, password)

    return send_file(
        io.BytesIO(encrypted_blob),
        download_name=file.filename + ".enc",
        as_attachment=True
    )

if __name__ == "__main__":
    app.run(debug=True)
