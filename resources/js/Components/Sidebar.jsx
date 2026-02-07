// import { FolderOpen, Star, HardDrive, Shield, Lock, Unlock, Plus, ChevronDown, Upload, Users, FolderTree } from "lucide-react";

// export default function Sidebar() {
//   return (
//     <aside className="w-64 h-full flex flex-col bg-white/70 backdrop-blur-xl border-r border-gray-200/50 shadow-lg">

//       {/* Logo */}
//       <div className="p-6 border-b border-gray-200/50">
//         <div className="flex items-center gap-3">
//           <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/30">
//             <Shield className="size-6 text-white" />
//           </div>
//           <h1 className="text-xl font-bold text-gray-900">StegoLock</h1>
//         </div>
//       </div>

//       {/* New Button */}
//       <div className="p-5 border-b border-gray-200/50">
//         <button
//           className="w-full flex items-center justify-center gap-2
//                      bg-gradient-to-r from-indigo-600 to-purple-600
//                      text-white px-4 py-3.5 rounded-xl font-medium
//                      shadow-lg shadow-indigo-500/30
//                      hover:from-indigo-700 hover:to-purple-700
//                      transition-all"
//         >
//           <Plus className="size-5" />
//           New
//         </button>
//       </div>

//       {/* Navigation */}
//       <nav className="flex-1 overflow-y-auto p-4 space-y-1">
//         {/* Primary */}
//         <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl
//                             bg-gradient-to-r from-indigo-50 to-purple-50
//                             text-indigo-700 shadow-sm text-left font-medium">
//             <FolderOpen className="size-5 text-indigo-600" />
//             My Documents
//         </button>

//         <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl
//                             text-gray-700 hover:bg-gray-100/70 transition text-left">
//             <Lock className="size-5 text-gray-500" />
//             My Secured Files
//         </button>

//         <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl
//                             text-gray-700 hover:bg-gray-100/70 transition text-left">
//             <Unlock className="size-5 text-gray-500" />
//             My Original Files
//         </button>

//         <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl
//                             text-gray-700 hover:bg-gray-100/70 transition text-left">
//             <FolderOpen className="size-5 text-gray-500" />
//             My Folder
//         </button>

//         {/* Divider */}
//         <div className="py-2">
//             <div className="border-t border-gray-200" />
//         </div>

//         {/* Secondary */}
//         <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl
//                             text-gray-700 hover:bg-gray-100/70 transition text-left">
//             <FolderOpen className="size-5 text-gray-500" />
//             All Documents
//         </button>

//         <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl
//                             text-gray-700 hover:bg-gray-100/70 transition text-left">
//             <FolderTree className="size-5 text-gray-500" />
//             Shared with Me
//         </button>

//         <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl
//                             text-gray-700 hover:bg-gray-100/70 transition text-left">
//             <Star className="size-5 text-gray-500" />
//             Starred
//         </button>
//         </nav>


//       {/* Storage */}
//       <div className="p-5 border-t border-gray-200/50">
//         <div className="mb-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
//           <div className="flex items-center justify-between text-sm mb-2">
//             <span className="text-gray-600 font-medium">Storage</span>
//             <span className="text-gray-900 font-semibold">0 MB / 0 MB</span>
//           </div>

//           <div className="w-full h-2.5 bg-gray-300 rounded-full overflow-hidden">
//             <div
//               className="h-2.5 w-1/3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full"
//             />
//           </div>
//         </div>

//         <button
//           className="w-full flex items-center justify-center gap-2
//                      px-4 py-2.5 rounded-xl font-medium
//                      text-gray-700 hover:bg-gray-100 transition-all"
//         >
//           <HardDrive className="size-5 text-gray-500" />
//           Manage Storage
//         </button>
//       </div>
//     </aside>
//   );
// }







// import { FolderOpen, Star, HardDrive, Shield, Lock, Unlock, Plus, ChevronDown, Upload, Users, FolderTree } from "lucide-react";
// import { useState } from "react";
// import { formatBytes } from "../Utils/fileUtils";

// const folderIcons = {
//   "Starred": Star,
//   "My Secured Files": Lock,
//   "My Original Files": Unlock,
//   "Shared With Me": Users,
//   "My Folders": FolderTree,
// };

// export default function Sidebar({
//   folders,
//   selectedFolder,
//   onSelectFolder,
//   totalStorage,
//   storageLimit,
//   onUploadClick,
//   onManageStorageClick,
//   onNewFolderClick,
// }) {
//   const [showNewMenu, setShowNewMenu] = useState(false);
//   const storagePercentage = (totalStorage / storageLimit) * 100;

//   const FolderButton = ({ folder }) => {
//     const isSelected = folder === selectedFolder;
//     const Icon = folderIcons[folder] || FolderOpen;

//     return (
//       <button
//         onClick={() => onSelectFolder(folder)}
//         className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-left ${
//           isSelected
//             ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 shadow-sm"
//             : "text-gray-700 hover:bg-gray-100/70"
//         }`}
//       >
//         <Icon
//           className={`size-5 ${
//             isSelected ? "text-indigo-600" : "text-gray-500"
//           }`}
//         />
//         <span className="font-medium">{folder}</span>
//       </button>
//     );
//   };

//   const MenuButton = ({ icon: Icon, label, onClick }) => (
//     <button
//       onClick={() => {
//         onClick();
//         setShowNewMenu(false);
//       }}
//       className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
//     >
//       <Icon className="size-4 text-gray-500" />
//       {label}
//     </button>
//   );

//   return (
//     <div className="w-64 h-full bg-white/70 backdrop-blur-xl border-r border-gray-200/50 flex flex-col shadow-lg">
//       {/* Logo */}
//       <div className="p-6 border-b border-gray-200/50">
//         <div className="flex items-center gap-3">
//           <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/30">
//             <Shield className="size-6 text-white" />
//           </div>
//           <h2 className="font-bold text-xl text-gray-900">StegoLock</h2>
//         </div>
//       </div>

//       {/* New Button */}
//       <div className="p-5 border-b border-gray-200/50">
//         <div className="relative">
//           <button
//             onClick={() => setShowNewMenu(!showNewMenu)}
//             className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-medium shadow-lg shadow-indigo-500/30"
//           >
//             <Plus className="size-5" />
//             New
//             <ChevronDown className="size-4 ml-auto" />
//           </button>

//           {showNewMenu && (
//             <>
//               <div
//                 className="fixed inset-0 z-40"
//                 onClick={() => setShowNewMenu(false)}
//               />
//               <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
//                 <MenuButton
//                   icon={Upload}
//                   label="Document Upload"
//                   onClick={onUploadClick}
//                 />
//                 <MenuButton
//                   icon={Plus}
//                   label="New Folder"
//                   onClick={onNewFolderClick}
//                 />
//               </div>
//             </>
//           )}
//         </div>
//       </div>

//       {/* Folder List */}
//       <div className="flex-1 overflow-auto p-4">
//         <nav className="space-y-1">
//           {folders.map((folder, index) =>
//             folder === "separator" ? (
//               <div key={`separator-${index}`} className="py-2">
//                 <div className="border-t border-gray-200" />
//               </div>
//             ) : (
//               <FolderButton key={folder} folder={folder} />
//             )
//           )}
//         </nav>
//       </div>

//       {/* Storage */}
//       <div className="p-5 border-t border-gray-200/50">
//         <div className="mb-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
//           <div className="flex items-center justify-between text-sm mb-2">
//             <span className="text-gray-600 font-medium">Storage</span>
//             <span className="text-gray-900 font-semibold">
//               {formatBytes(totalStorage)} / {formatBytes(storageLimit)}
//             </span>
//           </div>
//           <div className="w-full bg-gray-300 rounded-full h-2.5 overflow-hidden">
//             <div
//               className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2.5 rounded-full transition-all shadow-sm"
//               style={{ width: `${Math.min(storagePercentage, 100)}%` }}
//             />
//           </div>
//         </div>

//         <button
//           onClick={onManageStorageClick}
//           className="w-full flex items-center justify-center gap-2 text-gray-700 hover:bg-gray-100 px-4 py-2.5 rounded-xl transition-all font-medium"
//         >
//           <HardDrive className="size-5 text-gray-500" />
//           <span>Manage Storage</span>
//         </button>
//       </div>
//     </div>
//   );
// }

import { FolderOpen, Star, HardDrive, Shield, Lock, Unlock, Plus, ChevronDown, Upload, Users, FolderTree } from "lucide-react";
import { useState } from 'react';
import { formatBytes } from "../Utils/fileUtils";

const folderIcons = {
  'Starred': Star,
  'My Secured Files': Lock,
  'My Original Files': Unlock,
  'Shared With Me': Users,
  'My Folders': FolderTree,
};

const NAV_ITEMS = Object.freeze([
  'My Documents',
  'My Secured Files',
  'My Original Files',
  'My Folder',
  'separator',
  'All Documents',
  'Shared With Me',
  'Starred',
]);


export default function Sidebar({
  selectedFolder,
  onSelectFolder,
  totalStorage = 17340000,
  storageLimit = 1073741824,
  onUploadClick,
  onManageStorageClick,
  onNewFolderClick
}) {
  const [showNewMenu, setShowNewMenu] = useState(false);
  const storagePercentage = (totalStorage / storageLimit) * 100;

  const FolderButton = ({ folder }) => {
    const isSelected = folder === selectedFolder;
    const Icon = folderIcons[folder] || FolderOpen;

    return (
      <button
        onClick={() => onSelectFolder(folder)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-left ${
          isSelected
            ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 shadow-sm'
            : 'text-gray-700 hover:bg-gray-100/70'
        }`}
      >
        <Icon className={`size-5 ${isSelected ? 'text-indigo-600' : 'text-gray-500'}`} />
        <span className="font-medium">{folder}</span>
      </button>
    );
  };

  const MenuButton = ({ icon: Icon, label, onClick }) => (
    <button
      onClick={() => {
        onClick?.();
        setShowNewMenu(false);
      }}
      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
    >
      <Icon className="size-4 text-gray-500" />
      {label}
    </button>
  );

  return (
  <aside className="w-full h-full min-h-screen flex flex-col bg-white/70 backdrop-blur-xl border-r border-gray-200/50 shadow-lg">

    {/* Logo */}
    <div className="p-6 border-b border-gray-200/50">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/30">
          <Shield className="size-6 text-white" />
        </div>
        <h2 className="font-bold text-xl text-gray-900">StegoLock</h2>
      </div>
    </div>

    {/* New Button */}
    <div className="p-5 border-b border-gray-200/50">
      <div className="relative">
        <button
          onClick={() => setShowNewMenu(!showNewMenu)}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-medium shadow-lg shadow-indigo-500/30"
        >
          <Plus className="size-5" />
          New
          <ChevronDown className="size-4 ml-auto" />
        </button>

        {showNewMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowNewMenu(false)}
            />
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
              <MenuButton
                icon={Upload}
                label="Document Upload"
                onClick={onUploadClick}
              />
              <MenuButton
                icon={Plus}
                label="New Folder"
                onClick={onNewFolderClick}
              />
            </div>
          </>
        )}
      </div>
    </div>

    {/* Navigation */}
    <div className="flex-1 overflow-y-auto pr-2 scroll-smooth">
        <nav className="flex flex-col gap-2">
            {NAV_ITEMS.map((folder, index) => {
                if (folder === 'separator') {
                    return (
                    <div key={`separator-${index}`} className="py-2 w-full">
                        <div className="h-px w-full bg-gray-200/50" />
                    </div>
                    );
                }

                return <FolderButton key={folder} folder={folder} />;
                })

            }
        </nav>
    </div>


    {/* Storage */}
    <div className="p-5 border-t border-gray-200/50">
      <div className="mb-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600 font-medium">Storage</span>
          <span className="text-gray-900 font-semibold">
            {formatBytes(totalStorage)} / {formatBytes(storageLimit)}
          </span>
        </div>

        <div className="w-full bg-gray-300 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2.5 rounded-full transition-all shadow-sm"
            style={{ width: `${Math.min(storagePercentage, 100)}%` }}
          />
        </div>
      </div>

      <button
        onClick={onManageStorageClick}
        className="w-full flex items-center justify-center gap-2 text-gray-700 hover:bg-gray-100 px-4 py-2.5 rounded-xl transition-all font-medium"
      >
        <HardDrive className="size-5 text-gray-500" />
        Manage Storage
      </button>
    </div>

  </aside>
);

}

