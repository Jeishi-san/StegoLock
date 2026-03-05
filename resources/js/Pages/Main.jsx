import { useState } from "react";
import { FolderOpen, Upload, Search, Grid3x3, List, Star, Trash2, Settings, Shield, HardDrive,} from "lucide-react";
import { Toaster, toast } from "sonner";


import { LoginPage } from "@/Pages/LoginPage";
import { SignupPage } from "@/Pages/SignupPage";
import { UserProfile } from "@/Pages/UserProfile";
import { DocumentGrid } from "@/Pages/DocumentGrid";
import { ManageAccount } from "@/Pages/ManageAccount";
import { ManageStorage } from "@/Pages/ManageStorage";

import { Sidebar } from "@/Components/Sidebar";
import { SearchBar } from "@/Components/SearchBar";
import { FolderGrid } from "@/Components/FolderGrid";
import { UploadArea } from "@/Components/UploadArea";
import { SecurityPanel } from "@/Components/SecurityPanel";

import { NewFolderModal } from "@/Components/modals/NewFolderModal";


export default function App() {
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState("login");

  const [documents, setDocuments] = useState([
    {
      id: "1",
      name: "Financial_Report_Q4_2025.pdf",
      type: "application/pdf",
      size: 2457600,
      uploadDate: new Date("2025-12-15"),
      folder: "Financial",
      isStarred: true,
      isEncrypted: true,
      owner: "me",
      coverFileType: "png",
      activities: [
        {
          action: "Uploaded",
          timestamp: new Date("2025-12-15"),
          user: "me",
        },
        {
          action: "Secured",
          timestamp: new Date("2025-12-15"),
          user: "me",
        },
      ],
    },
    {
      id: "2",
      name: "Employee_Handbook.docx",
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size: 1048576,
      uploadDate: new Date("2025-11-20"),
      folder: "HR",
      isStarred: false,
      isEncrypted: true,
      owner: "me",
      coverFileType: "jpg",
      activities: [
        {
          action: "Uploaded",
          timestamp: new Date("2025-11-20"),
          user: "me",
        },
        {
          action: "Secured",
          timestamp: new Date("2025-11-20"),
          user: "me",
        },
      ],
    },
    {
      id: "3",
      name: "Project_Proposal.pdf",
      type: "application/pdf",
      size: 3145728,
      uploadDate: new Date("2026-01-10"),
      folder: "Projects",
      isStarred: true,
      isEncrypted: true,
      owner: "me",
      coverFileType: "mp3",
      activities: [
        {
          action: "Uploaded",
          timestamp: new Date("2026-01-10"),
          user: "me",
        },
        {
          action: "Secured",
          timestamp: new Date("2026-01-10"),
          user: "me",
        },
      ],
    },
    {
      id: "4",
      name: "Tax_Documents_2025.zip",
      type: "application/zip",
      size: 5242880,
      uploadDate: new Date("2026-01-15"),
      folder: "Financial",
      isStarred: false,
      isEncrypted: true,
      owner: "me",
      activities: [
        {
          action: "Uploaded",
          timestamp: new Date("2026-01-15"),
          user: "me",
        },
        {
          action: "Secured",
          timestamp: new Date("2026-01-15"),
          user: "me",
        },
      ],
    },
    {
      id: "5",
      name: "Marketing_Strategy.pptx",
      type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      size: 4194304,
      uploadDate: new Date("2025-12-01"),
      folder: "Marketing",
      isStarred: false,
      isEncrypted: true,
      owner: "me",
      activities: [
        {
          action: "Uploaded",
          timestamp: new Date("2025-12-01"),
          user: "me",
        },
        {
          action: "Secured",
          timestamp: new Date("2025-12-01"),
          user: "me",
        },
      ],
    },
    {
      id: "6",
      name: "Meeting_Notes.txt",
      type: "text/plain",
      size: 102400,
      uploadDate: new Date("2026-01-18"),
      folder: "My Documents",
      isStarred: false,
      isEncrypted: false,
      owner: "me",
      activities: [
        {
          action: "Uploaded",
          timestamp: new Date("2026-01-18"),
          user: "me",
        },
      ],
    },
    {
      id: "7",
      name: "Public_Announcement.pdf",
      type: "application/pdf",
      size: 524288,
      uploadDate: new Date("2026-01-20"),
      folder: "Marketing",
      isStarred: false,
      isEncrypted: false,
      owner: "me",
      activities: [
        {
          action: "Uploaded",
          timestamp: new Date("2026-01-20"),
          user: "me",
        },
      ],
    },
    {
      id: "8",
      name: "Team_Photos.docx",
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size: 819200,
      uploadDate: new Date("2026-01-12"),
      folder: "HR",
      isStarred: true,
      isEncrypted: false,
      owner: "me",
      activities: [
        {
          action: "Uploaded",
          timestamp: new Date("2026-01-12"),
          user: "me",
        },
      ],
    },
    {
      id: "9",
      name: "Shared_Budget_2026.xlsx",
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      size: 645120,
      uploadDate: new Date("2026-01-19"),
      folder: "Shared",
      isStarred: false,
      isEncrypted: true,
      owner: "john.doe@company.com",
      sharedWith: ["me"],
      activities: [
        {
          action: "Shared with you",
          timestamp: new Date("2026-01-19"),
          user: "john.doe@company.com",
        },
      ],
    },
  ]);

  const [selectedFolder, setSelectedFolder] =
    useState("My Documents");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilters, setSearchFilters] = useState({
    fileFormat: "all",
    status: "all",
    owner: "all",
    sort: "date-newest",
  });
  const [viewMode, setViewMode] = useState("grid");
  const [showUpload, setShowUpload] = useState(false);
  const [showManageStorage, setShowManageStorage] =
    useState(false);
  const [showNewFolderModal, setShowNewFolderModal] =
    useState(false);
  const [showManageAccount, setShowManageAccount] =
    useState(false);
  const [customFolders, setCustomFolders] = useState([]);

  const handleUpload = (files, isSecured, coverFileType) => {
    const toastId = toast.loading(
      isSecured ? "Securing files..." : "Uploading files...",
    );

    // Simulate a delay for the upload process
    setTimeout(() => {
      const newDocuments = files.map((file, index) => ({
        id: Date.now().toString() + index,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadDate: new Date(),
        folder: "My Documents", // Always store in My Documents folder
        isStarred: false,
        isEncrypted: isSecured,
        owner: "me",
        coverFileType: isSecured ? coverFileType : undefined,
        activities: [
          {
            action: "Uploaded",
            timestamp: new Date(),
            user: "me",
          },
          ...(isSecured
            ? [
                {
                  action: "Secured",
                  timestamp: new Date(),
                  user: "me",
                },
              ]
            : []),
        ],
      }));

      setDocuments([...newDocuments, ...documents]);
      setShowUpload(false);

      toast.success(
        isSecured
          ? `${files.length} ${files.length === 1 ? "file" : "files"} secured successfully with ${coverFileType?.toUpperCase()} cover`
          : `${files.length} ${files.length === 1 ? "file" : "files"} uploaded successfully`,
        { id: toastId },
      );
    }, 500);
  };

  const handleDelete = (id) => {
    setDocuments(documents.filter((doc) => doc.id !== id));
  };

  const handleToggleStar = (id) => {
    setDocuments(
      documents.map((doc) =>
        doc.id === id
          ? { ...doc, isStarred: !doc.isStarred }
          : doc,
      ),
    );
  };

  const handleToggleEncryption = (id, coverFileType) => {
    const doc = documents.find((d) => d.id === id);
    if (!doc) return;

    const action = doc.isEncrypted ? "Retrieved" : "Secured";
    const toastId = toast.loading(
      doc.isEncrypted
        ? "Retrieving file..."
        : "Securing file...",
    );

    // Simulate processing delay
    setTimeout(() => {
      setDocuments(
        documents.map((d) =>
          d.id === id
            ? {
                ...d,
                isEncrypted: !d.isEncrypted,
                coverFileType: !d.isEncrypted
                  ? coverFileType
                  : d.coverFileType, // Set cover type when securing, keep it when retrieving
                activities: [
                  ...(d.activities || []),
                  { action, timestamp: new Date(), user: "me" },
                ],
              }
            : d,
        ),
      );

      toast.success(
        doc.isEncrypted
          ? "File retrieved successfully"
          : "File secured successfully",
        { id: toastId },
      );
    }, 1500);
  };

  const handleRename = (id, newName) => {
    setDocuments(
      documents.map((doc) =>
        doc.id === id ? { ...doc, name: newName } : doc,
      ),
    );
    toast.success("File renamed successfully");
  };

  const handleMoveFile = (id, newFolder) => {
    setDocuments(
      documents.map((doc) =>
        doc.id === id ? { ...doc, folder: newFolder } : doc,
      ),
    );
    toast.success("File moved successfully");
  };

  const handleCreateFolder = (folderName) => {
    setCustomFolders([...customFolders, folderName]);
    toast.success(
      `Folder "${folderName}" created successfully`,
    );
  };

  // Helper function to get file format from type
  const getFileFormat = (type) => {
    if (type === "application/pdf") return "pdf";
    if (type === "application/msword") return "doc";
    if (
      type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
      return "docx";
    if (type === "text/plain") return "txt";
    return "other";
  };

  const filteredDocuments = documents
    .filter((doc) => {
      let matchesFolder = false;

      if (selectedFolder === "All Documents") {
        matchesFolder = true;
      } else if (selectedFolder === "Starred") {
        matchesFolder = doc.isStarred;
      } else if (selectedFolder === "My Secured Files") {
        matchesFolder = doc.isEncrypted && doc.owner === "me";
      } else if (selectedFolder === "My Original Files") {
        matchesFolder = !doc.isEncrypted && doc.owner === "me";
      } else if (selectedFolder === "Shared With Me") {
        matchesFolder = doc.owner !== "me";
      } else if (selectedFolder === "My Documents") {
        // Show all files owned by me, regardless of folder or encryption status
        matchesFolder = doc.owner === "me";
      } else if (selectedFolder === "My Folders") {
        // Show all user-made folders
        matchesFolder =
          doc.owner === "me" &&
          !["My Documents"].includes(doc.folder);
      } else {
        matchesFolder = doc.folder === selectedFolder;
      }

      const matchesSearch = doc.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      // File format filter
      const fileFormat = getFileFormat(doc.type);
      const matchesFormat =
        searchFilters.fileFormat === "all" ||
        fileFormat === searchFilters.fileFormat;

      // Status filter
      const matchesStatus =
        searchFilters.status === "all" ||
        (searchFilters.status === "secured" &&
          doc.isEncrypted) ||
        (searchFilters.status === "original" &&
          !doc.isEncrypted);

      // Owner filter
      const matchesOwner =
        searchFilters.owner === "all" ||
        (searchFilters.owner === "me" && doc.owner === "me") ||
        (searchFilters.owner === "others" &&
          doc.owner !== "me");

      return (
        matchesFolder &&
        matchesSearch &&
        matchesFormat &&
        matchesStatus &&
        matchesOwner
      );
    })
    .sort((a, b) => {
      // Apply sorting
      switch (searchFilters.sort) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "date-newest":
          return (
            b.uploadDate.getTime() - a.uploadDate.getTime()
          );
        case "date-oldest":
          return (
            a.uploadDate.getTime() - b.uploadDate.getTime()
          );
        case "size-largest":
          return b.size - a.size;
        case "size-smallest":
          return a.size - b.size;
        default:
          return 0;
      }
    });

  // Organize folders into groups
  const defaultFolders = [
    "My Documents",
    "My Secured Files",
    "My Original Files",
    "My Folders",
  ];
  const otherFolders = [
    "All Documents",
    "Shared With Me",
    "Starred",
  ];
  const userMadeFolders = Array.from(
    new Set(
      documents
        .filter((d) => d.owner === "me")
        .map((doc) => doc.folder)
        .filter((f) => f !== "My Documents"),
    ),
  );

  // Don't add customFolders to the sidebar - they only appear through "My Folders"
  const folders = [
    ...defaultFolders,
    "separator",
    ...otherFolders,
  ];

  const totalStorage = documents.reduce(
    (acc, doc) => acc + doc.size,
    0,
  );
  const storageLimit = 1073741824; // 1 GB

  const handleLogin = (email, password) => {
    // Mock authentication - in production, this would call an API
    setUser({
      name: email.split("@")[0],
      email: email,
    });
  };

  const handleSignup = (name, email, password) => {
    // Mock registration - in production, this would call an API
    setUser({
      name: name,
      email: email,
    });
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleUpdateProfile = (name, email) => {
    if (user) {
      setUser({ ...user, name, email });
    }
  };

  // Show authentication pages if user is not logged in
  if (!user) {
    if (authView === "login") {
      return (
        <LoginPage
          onLogin={handleLogin}
          onSwitchToSignup={() => setAuthView("signup")}
        />
      );
    } else {
      return (
        <SignupPage
          onSignup={handleSignup}
          onSwitchToLogin={() => setAuthView("login")}
        />
      );
    }
  }

  return (
    <div className="h-screen w-full flex overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Toaster position="top-right" expand={false} richColors />
      {/* Sidebar */}
      <Sidebar
        folders={folders}
        selectedFolder={selectedFolder}
        onSelectFolder={setSelectedFolder}
        totalStorage={totalStorage}
        storageLimit={storageLimit}
        onUploadClick={() => setShowUpload(true)}
        onManageStorageClick={() => setShowManageStorage(true)}
        onNewFolderClick={() => setShowNewFolderModal(true)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white/70 backdrop-blur-xl border-b border-gray-200/50 px-8 py-5 shadow-sm z-50">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-2xl font-semibold text-gray-900">
              {selectedFolder}
            </h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded ${viewMode === "grid" ? "bg-white shadow-sm" : ""}`}
                >
                  <Grid3x3 className="size-4 text-gray-600" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded ${viewMode === "list" ? "bg-white shadow-sm" : ""}`}
                >
                  <List className="size-4 text-gray-600" />
                </button>
              </div>
              <UserProfile
                userName={user.name}
                userEmail={user.email}
                onLogout={handleLogout}
                onManageStorage={() =>
                  setShowManageStorage(true)
                }
                onManageAccount={() =>
                  setShowManageAccount(true)
                }
              />
            </div>
          </div>

          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={searchFilters}
            onFiltersChange={setSearchFilters}
          />
        </div>

        {/* Document Area */}
        <div id="document-area" className="flex-1 overflow-y-auto overflow-x-hidden relative">
          {showUpload ? (
            <div className="p-6">
              <UploadArea
                onUpload={handleUpload}
                onCancel={() => setShowUpload(false)}
              />
            </div>
          ) : selectedFolder === "My Folders" ? (
            <div className="p-6 h-full">
              <FolderGrid
                folders={customFolders}
                viewMode={viewMode}
                onSelectFolder={setSelectedFolder}
                onNewFolderClick={() =>
                  setShowNewFolderModal(true)
                }
              />
            </div>
          ) : (
            <DocumentGrid
              documents={filteredDocuments}
              viewMode={viewMode}
              onDelete={handleDelete}
              onToggleStar={handleToggleStar}
              onToggleEncryption={handleToggleEncryption}
              onRename={handleRename}
              onMoveFile={handleMoveFile}
              currentUserEmail={user.email}
              customFolders={customFolders}
              onCreateFolder={handleCreateFolder}
            />
          )}
        </div>
      </div>

      {/* Security Panel */}
      <SecurityPanel />

      {/* Manage Storage Modal */}
      {showManageStorage && (
        <ManageStorage
          totalStorage={totalStorage}
          storageLimit={storageLimit}
          documents={documents}
          onClose={() => setShowManageStorage(false)}
          onDeleteDocument={handleDelete}
        />
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <NewFolderModal
          existingFolders={folders}
          onCreateFolder={handleCreateFolder}
          onClose={() => setShowNewFolderModal(false)}
        />
      )}

      {/* Manage Account Modal */}
      {showManageAccount && (
        <ManageAccount
          userName={user.name}
          userEmail={user.email}
          onUpdateProfile={handleUpdateProfile}
          onClose={() => setShowManageAccount(false)}
        />
      )}
    </div>
  );
}
