from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from googleapiclient.errors import HttpError

# --- Config ---
SERVICE_ACCOUNT_FILE = "credentials/service_account.json"
SERVICE_ACCOUNT_FOLDER_NAME = "StegoLockUploads"  # folder in service account space
TEMP_FOLDER = "temp_uploads"
SCOPES = ["https://www.googleapis.com/auth/drive"]

os.makedirs(TEMP_FOLDER, exist_ok=True)

# --- Flask app ---
app = Flask(__name__)
CORS(app, origins=["http://127.0.0.1:8000"])

# --- Build Drive service ---
def build_service():
    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES
    )
    return build("drive", "v3", credentials=creds)

# --- Get or create folder in service account Drive space ---
def get_or_create_folder(service, folder_name):
    query = (
        f"name='{folder_name}' "
        "and mimeType='application/vnd.google-apps.folder' "
        "and trashed=false"
    )
    results = service.files().list(
        q=query,
        fields="files(id, name)",
        supportsAllDrives=True,
        includeItemsFromAllDrives=True
    ).execute()

    folders = results.get("files", [])
    if folders:
        return folders[0]["id"]

    # create folder if not exists
    metadata = {
        "name": folder_name,
        "mimeType": "application/vnd.google-apps.folder"
    }
    folder = service.files().create(
        body=metadata,
        fields="id",
        supportsAllDrives=True
    ).execute()

    return folder["id"]

# --- Upload file to service account folder ---
def upload_file(service, folder_id, filepath):
    metadata = {"name": os.path.basename(filepath), "parents": [folder_id]}
    media = MediaFileUpload(filepath, mimetype="application/octet-stream", resumable=True)
    file = service.files().create(
        body=metadata,
        media_body=media,
        fields="id",
        supportsAllDrives=True
    ).execute()
    return file.get("id")

# --- Flask route ---
@app.route("/upload", methods=["POST"])
def upload_route():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "File is required"}), 400

    try:
        # Save temporarily
        temp_path = os.path.join(TEMP_FOLDER, file.filename)
        file.save(temp_path)

        # Upload to service account folder
        service = build_service()
        folder_id = get_or_create_folder(service, SERVICE_ACCOUNT_FOLDER_NAME)
        file_id = upload_file(service, folder_id, temp_path)

        # Clean up
        os.remove(temp_path)

        return jsonify({"file_id": file_id})

    except HttpError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
