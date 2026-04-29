# Stegolock Core Features Update Plan (Modernized Pipeline)

This document tracks the modernization of the Stegolock document processing pipeline and dashboard UI.

## Completed Milestones

### 1. Granular Pipeline State Machine
- [x] **Status Refinement:** Backend jobs now strictly adhere to database ENUM constraints (`mapped`, `embedded`, `stored`) to prevent SQL truncation.
- [x] **Cinematic Translation:** Implemented a high-fidelity mapping system in the frontend that translates technical DB states into active labels (e.g., `mapped` → `Embedding fragments...`).
- [x] **Audit Trail Expansion:** Added `DocumentActivity` logging for the entire unlocking lifecycle (`unlocking_started`, `unlocked`) to ensure system accountability.
- [x] **Python Extraction Fix:** Resolved a critical bug in `image/extract.py` where 4-channel (RGBA) PNGs were losing data during extraction.
- [x] **Resilience Tuning:** Increased job timeouts to 5 minutes and retry attempts to 5 to handle high-latency cloud synchronization (Backblaze B2).

### 2. Cinematic Frontend UI
- [x] **DocumentCard Refactor:** Centered the processing icon perfectly between the top border and filename. Reduced icon scale to `size-8` for a sharper look.
- [x] **Puzzle Reassembly:** Upgraded the unlocking animation to use **Puzzle Piece** icons that implode from the card borders to the center.
- [x] **Unified Animations:** Standardized the diagonal shimmer and fragment effects across both locking and unlocking workflows.
- [x] **Global Stacking Strategy:** Moved `UploadModal` to the `AuthenticatedLayout` root (`z-[100]`) to resolve "Stacking Traps" and ensure consistent visibility above headers.
- [x] **Reactive Status Sync:** Removed client-side timers in favor of real-time status polling with instant feedback upon action triggers.

### 3. "Midnight Void" Dashboard Architecture
- [x] **Global Theme:** Updated the primary dark mode background to `#0b1224` for a premium aesthetic.
- [x] **Independent Scroll Panes:** Split the document view into two separate scrollable areas (Documents on top, Folders on bottom).
- [x] **Sticky Navigation Headers:** Implemented solid-background sticky headers for both sections to prevent content "ghosting".
- [x] **Forced Synchronization:** Ensured the dashboard reloads after every upload attempt to keep storage metrics in sync.

## Technical Specifications

### Theme Constants
- **Cyber Void:** `#0b1224`
- **Cyber Surface:** `#0f172a`
- **Cyber Accent:** `#22d3ee`

### Key Files Instrumented
- `app/Jobs/ProcessSteganoJob.php`
- `app/Jobs/ProcessUnlockJob.php`
- `resources/js/Pages/MyDocuments.jsx`
- `resources/js/Components/DocumentCard.jsx`
- `resources/js/Components/modals/UploadModal.jsx`
- `resources/js/Layouts/AuthenticatedLayout.jsx`
- `resources/css/app.css`
