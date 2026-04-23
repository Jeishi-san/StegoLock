from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
import io

SERVICE_ACCOUNT_FILE = "credentials/service_account.json"
SCOPES = ["https://www.googleapis.com/auth/drive"]

FOLDER_ID = "19ZRXP_r-CtDAWOiqQE6-st6T5xh95AZI"  # replace with your folder id

def build_service():
    credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE,
        scopes=SCOPES
    )
    return build("drive", "v3", credentials=credentials)

def upload_bytes_to_drive(filename: str, file_bytes: bytes):
    service = build_service()

    file_metadata = {
        "name": filename,
        "parents": [FOLDER_ID]
    }

    media = MediaIoBaseUpload(
        io.BytesIO(file_bytes),
        mimetype="application/octet-stream",
        resumable=True
    )

    file = service.files().create(
        body=file_metadata,
        media_body=media,
        fields="id",
        supportsAllDrives=True
    ).execute()

    return file.get("id")
