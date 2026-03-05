import { Lock, Unlock, Eye, Download, Edit2, FolderInput, Share2, Info, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export function FileActionsMenu({
  doc,
  buttonId,
  onClose,
  onToggleEncryption,
  onPreview,
  onDownload,
  onRename,
  onMoveFile,
  onShare,
  onInfo,
  onDelete,
  isProcessing
}) {
  const menuRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0, transformOrigin: 'top left' });

  // Get document area container
  const [containerEl, setContainerEl] = useState(null);
  useEffect(() => {
    const el = document.getElementById('document-area');
    setContainerEl(el);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        const button = buttonId ? document.getElementById(buttonId) : null;
        if (button && !button.contains(event.target)) {
          onClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [buttonId, onClose]);


  // Adaptive positioning
  useEffect(() => {
  const button = buttonId ? document.getElementById(buttonId) : null;
  const menu = menuRef.current;
  const container = containerEl;
  if (!button || !menu || !container) return;

  requestAnimationFrame(() => {
    const containerRect = container.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();

    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;

    // Add scroll offsets
    const scrollTop = container.scrollTop;
    const scrollLeft = container.scrollLeft;

    let top = buttonRect.bottom - containerRect.top + scrollTop;
    let left = buttonRect.left - containerRect.left + scrollLeft;
    let transformOrigin = 'top left';

    // Flip vertically if overflowing container bottom
    if (buttonRect.bottom + menuHeight > containerRect.bottom) {
      top = buttonRect.top - menuHeight - containerRect.top + scrollTop;
      transformOrigin = 'bottom left';
    }

    // Flip horizontally if overflowing container right
    if (buttonRect.left + menuWidth > containerRect.right) {
      left = buttonRect.right - menuWidth - containerRect.left + scrollLeft;
      transformOrigin = transformOrigin.includes('top') ? 'top right' : 'bottom right';
    }

    setPosition({ top, left, transformOrigin });
  });
}, [buttonId, doc, containerEl, onClose]);


  const MenuItem = ({
    icon: Icon,
    label,
    onClick,
    color = 'text-gray-700',
    disabled = false
  }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) {
          onClick();
          onClose();
        }
      }}
      disabled={disabled}
      className={`w-full flex items-center gap-2 px-4 py-2 text-[12px] ${color} hover:bg-gray-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );

  const Separator = () => <div className="border-t border-gray-200 my-1" />;

  if (!containerEl) return null;

  return createPortal(
    <div
        ref={menuRef}
        className="absolute bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-[100] min-w-[180px]"
        style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            transformOrigin: position.transformOrigin,
            visibility: position.top === 0 && position.left === 0 ? 'hidden' : 'visible'
        }}
    >
      <MenuItem
        icon={doc.isEncrypted ? Unlock : Lock}
        label={doc.isEncrypted ? 'Retrieve File' : 'Secure File'}
        onClick={onToggleEncryption}
      />

      <Separator />

      <MenuItem icon={Eye} label="Preview" onClick={onPreview} />
      <MenuItem icon={Download} label="Download" onClick={onDownload} />
      <MenuItem icon={Edit2} label="Rename" onClick={onRename} />
      <MenuItem icon={FolderInput} label="Move File" onClick={onMoveFile} />

      <Separator />

      <MenuItem
        icon={Share2}
        label="Share File"
        onClick={onShare}
        disabled={!doc.isEncrypted}
      />
      <MenuItem icon={Info} label="File Info" onClick={onInfo} />

      <Separator />

      <MenuItem
        icon={Trash2}
        label="Delete"
        onClick={onDelete}
        color="text-red-600"
      />
    </div>,
    containerEl
  );
}
