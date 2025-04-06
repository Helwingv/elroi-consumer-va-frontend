import { useState, useEffect } from 'react';
import { X, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

interface ProviderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: {
    id: string;
    name: string;
    category: string;
    status: string;
    dataTypes: string[];
    lastSync: string;
  };
}

export default function ProviderDetailsModal({ isOpen, onClose, provider }: ProviderDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providerDetails, setProviderDetails] = useState(provider);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  // Fetch additional provider details when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchProviderDetails();
    }
  }, [isOpen, provider.id]);

  // Get provider details from API
  const fetchProviderDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the company data endpoint to get provider details
      const response = await api.post('company-dashboard', {
        companyId: provider.id
      });

      // If we got a response, update the provider details
      if (response) {
        // Create an enhanced provider object with additional details from API
        setProviderDetails({
          ...provider,
          // Add any additional fields from the API response
          // This is a flexible approach that preserves the original data
          // while adding any new information from the API
          ...response
        });
      }
    } catch (err) {
      console.error('Error fetching provider details:', err);
      // We don't set error here because we still have the basic provider data
      // from props, so we can still show the modal with that information
    } finally {
      setLoading(false);
    }
  };

  // Trigger a manual data sync
  const handleSync = async () => {
    try {
      setSyncStatus('syncing');
      setError(null);

      // This is a simulated API call since there's no direct "sync" endpoint
      // In a real implementation, you would call the appropriate endpoint
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update last sync time
      setProviderDetails({
        ...providerDetails,
        lastSync: new Date().toISOString()
      });

      setSyncStatus('success');

      // Reset status after a delay
      setTimeout(() => {
        setSyncStatus('idle');
      }, 2000);
    } catch (err) {
      console.error('Error syncing data:', err);
      setSyncStatus('error');
      setError('Failed to sync data. Please try again.');

      // Reset status after a delay
      setTimeout(() => {
        setSyncStatus('idle');
      }, 2000);
    }
  };

  // Handle disconnect provider
  const handleDisconnect = async () => {
    try {
      setLoading(true);
      setError(null);

      // This would be an API call to disconnect/remove the provider
      // Since there's no specific disconnect endpoint, we'll treat it as a UI action
      
      // Close the modal after a brief delay to simulate the API call
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      console.error('Error disconnecting provider:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to disconnect provider. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      <div className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg bg-white rounded-xl shadow-xl z-50 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold">{providerDetails.name}</h2>
            <p className="text-sm text-gray-600">{providerDetails.category}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            type="button"
            disabled={loading}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}

        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Status</h3>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    providerDetails.status === 'active' ? 'bg-green-500' :
                    providerDetails.status === 'pending' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`} />
                  <span className="capitalize">{providerDetails.status}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Last Sync</h3>
                  <button 
                    onClick={handleSync}
                    className={`text-xs flex items-center gap-1 rounded px-2 py-1 ${
                      syncStatus === 'syncing' ? 'bg-blue-100 text-blue-700' :
                      syncStatus === 'success' ? 'bg-green-100 text-green-700' :
                      syncStatus === 'error' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } transition-colors`}
                    type="button"
                    disabled={syncStatus === 'syncing'}
                  >
                    {syncStatus === 'syncing' ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Syncing...
                      </>
                    ) : syncStatus === 'success' ? (
                      <>
                        <RefreshCw className="h-3 w-3" />
                        Synced
                      </>
                    ) : syncStatus === 'error' ? (
                      <>
                        <AlertCircle className="h-3 w-3" />
                        Failed
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3" />
                        Sync Now
                      </>
                    )}
                  </button>
                </div>
                <p className="text-sm">{new Date(providerDetails.lastSync).toLocaleString()}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Data Types</h3>
                <div className="flex flex-wrap gap-2">
                  {providerDetails.dataTypes.map(type => (
                    <span
                      key={type}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Integration Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span>API Status</span>
                    <span className="text-green-600">Connected</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span>Data Transfer</span>
                    <span className={`${
                      providerDetails.status === 'active' ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {providerDetails.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Actions</h3>
                <div className="space-y-2">
                  <a 
                    href={`https://provider-dashboard.example.com/${providerDetails.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Provider Dashboard
                  </a>
                  <button 
                    onClick={handleDisconnect}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    type="button"
                    disabled={loading}
                  >
                    Disconnect Provider
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              type="button"
              disabled={loading}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}