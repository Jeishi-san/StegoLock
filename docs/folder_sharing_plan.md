# Implementation Plan - Recursive Folder Sharing

## Goal
Enable users to share entire folder structures recursively, using a snapshot-based approach for security and a bulk acceptance flow for better UX.

## Proposed Changes

### Database
- **New Table**: `folder_shares` (share_id, folder_id, sender_id, recipient_id, status, expires_at)
- **Modified Table**: `document_shares` (add `folder_share_id` foreign key)

### Backend (`DocumentController.php`)
- `shareFolder`: Recursive traversal to find owned documents, bulk DEK wrapping, and batch insertion.
- `acceptFolderShare`: Bulk status update for all linked document shares.
- `sharedIndex`: Include `pendingFolderShares` and `acceptedFolderShares`.

### Frontend
- **Modals**: `ShareFolderModal.jsx` with security warnings.
- **Pages**: `SharedDocuments.jsx` with grouped sections for folders and files.
- **Navigation**: Integrated share triggers in `MyFolders.jsx` and `MyDocuments.jsx`.

## Security Considerations
- **Snapshot Mode**: Only shares files present at the time of sharing.
- **Ownership Filter**: Prevents transitive sharing of files not owned by the user.
- **DEK Wrapping**: Maintains end-to-end security via the system share key.
