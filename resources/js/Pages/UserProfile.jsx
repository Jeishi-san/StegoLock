import { useState, useRef, useEffect } from 'react';
import { User, LogOut, Settings, Shield, ChevronDown, HardDrive } from 'lucide-react';

export function UserProfile({ userName, userEmail, onLogout, onManageStorage, onManageAccount }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center size-9 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors"
      >
        <span className="text-white font-semibold text-sm">{getInitials(userName)}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[150]">
          {/* User Info */}
          <div className="px-4 py-3">
            <p className="font-medium text-gray-900 text-sm truncate">{userName}</p>
            <p className="text-xs text-gray-500 truncate">{userEmail}</p>
          </div>

          <div className="border-t border-gray-200 my-1"></div>

          <button
            onClick={() => {
              setIsOpen(false);
              if (onManageAccount) {
                onManageAccount();
              }
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Settings className="size-4 text-gray-500" />
            <span>Manage Account</span>
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              if (onManageStorage) {
                onManageStorage();
              }
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <HardDrive className="size-4 text-gray-500" />
            <span>Manage Storage</span>
          </button>

          <div className="border-t border-gray-200 my-1"></div>

          <button
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="size-4" />
            <span>Log Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
