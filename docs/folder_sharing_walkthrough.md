# Walkthrough - Recursive Folder Sharing

## Feature Overview
Users can now share an entire folder tree. The system discovers all nested documents owned by the user and prepares them for the recipient.

## How to Use
1. **Share**: Right-click any folder in "My Folders" or the dashboard.
2. **Review Warnings**: Confirm the snapshot policy and recursive scope in the modal.
3. **Recipient Accept**: The recipient visits "Shared With Me" and clicks "Accept" on the folder.
4. **Access**: All files within the folder structure become unlocked and ready for use.

## Technical Details
- **Recursion**: Uses a recursive helper to collect all `user_id == Auth::id()` document IDs.
- **Batching**: Links individual `document_shares` to a single `folder_share_id` for atomic acceptance.
- **UI**: Indigo-themed folder icons differentiate shared folders from standard file shares.

## Completed Tasks
- [x] Database Migration
- [x] Backend Controller Logic
- [x] Share Folder Modal
- [x] Shared Documents UI Updates
- [x] Folder List Integration
