import { Lock, Unlock, Eye, Download, Edit2, FolderInput, Share2, Info, Trash2 } from 'lucide-react';
import { useEffect, useRef } from 'react';

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
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${color} hover:bg-gray-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );

  const Separator = () => <div className="border-t border-gray-200 my-1" />;

  return (
    <div 
      ref={menuRef}
      className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-[100] min-w-[180px]"
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
    </div>
  );
}
