import { useState } from 'react';
import { X, Share2, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function ShareFileModal({ document: doc, onClose, currentUserEmail }) {
  const [email, setEmail] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [grantedUsers, setGrantedUsers] = useState([]);

  const isEnvelopeMode = doc.encryption_mode === 'envelope_wrapped';

  const handleShare = async () => {
    setIsSharing(true);
    
    try {
      const response = await axios.post('/documents/share', {
        document_id: doc.document_id,
        email: email
      });
      
      toast.success(`File shared with ${email}`);
      setIsSharing(false);
      onClose();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to share file';
      toast.error(errorMessage);
      setIsSharing(false);
    }
  };

  const handleConfirm = () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setShowConfirm(true);
  };

  if (showConfirm) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-4">
            <AlertCircle className="size-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            Confirm File Sharing
          </h3>
          <p className="text-sm text-gray-600 text-center mb-6">
            Are you sure you want to share <span className="font-medium">"{doc.name}"</span> with <span className="font-medium">{email}</span>?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              disabled={isSharing}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
            >
              {isSharing ? 'Sharing...' : 'Share File'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Share2 className="size-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Share File</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="size-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-1">Sharing:</p>
            <p className="font-medium text-gray-900">{doc.name}</p>
          </div>

          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="size-5 text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter email address"
                required
              />
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6">
            <CheckCircle2 className="size-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">Secure Sharing</p>
              <p className="text-xs text-blue-700 mt-1">Only secured files can be shared. The recipient will receive a notification with access to this file.</p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
