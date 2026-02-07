import { Shield, Lock, Eye, Key, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export function SecurityPanel() {
  const [isOpen, setIsOpen] = useState(false);

  const securityFeatures = [
    {
      icon: Lock,
      title: 'End-to-End Encryption',
      description: 'All files encrypted with AES-256 encryption',
      status: 'active',
    },
    {
      icon: Key,
      title: 'Zero-Knowledge Architecture',
      description: 'Only you have access to your encryption keys',
      status: 'active',
    },
    {
      icon: Shield,
      title: 'Secure File Transfer',
      description: 'TLS 1.3 encryption for all data transfers',
      status: 'active',
    },
    {
      icon: Eye,
      title: 'Privacy Protection',
      description: 'No third-party access to your documents',
      status: 'active',
    },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-colors hover:shadow-xl"
        title="Security Information"
      >
        <Shield className="size-6" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 overflow-auto">
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white p-6 border-b border-green-800">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Shield className="size-8" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Security Center</h2>
                    <p className="text-green-100 text-sm">Your data is protected</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="size-5 text-green-200" />
                  <span className="font-semibold">All Systems Operational</span>
                </div>
                <p className="text-sm text-green-100">
                  Your documents are secured with military-grade encryption
                </p>
              </div>
            </div>

            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Security Features</h3>
              <div className="space-y-4">
                {securityFeatures.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl"
                    >
                      <div className="p-2.5 bg-green-100 rounded-lg">
                        <Icon className="size-5 text-green-700" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{feature.title}</h4>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <div className="size-2 bg-green-500 rounded-full" />
                          <span className="text-xs text-green-700 font-medium uppercase">
                            {feature.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Security Best Practices</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Never share your account credentials</li>
                      <li>• Use strong, unique passwords</li>
                      <li>• Enable two-factor authentication</li>
                      <li>• Regularly review file access logs</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Lock className="size-4" />
                  Encryption Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Algorithm:</span>
                    <span className="font-medium">AES-256-GCM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Key Size:</span>
                    <span className="font-medium">256 bits</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Transport:</span>
                    <span className="font-medium">TLS 1.3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Compliance:</span>
                    <span className="font-medium">SOC 2, GDPR</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
