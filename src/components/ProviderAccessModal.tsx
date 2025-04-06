import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { supabase } from '../services/supabase';

interface ProviderAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: {
    id: string;
    name: string;
    logo: string;
    permissions: {
      labResults: boolean;
      medications: boolean;
      fitnessData: boolean;
    };
  };
  onUpdatePermissions: (providerId: string, permissions: { [key: string]: boolean }) => void;
  onDeleteProvider: (providerId: string) => void;
}

export default function ProviderAccessModal({
  isOpen,
  onClose,
  provider,
  onUpdatePermissions,
  onDeleteProvider
}: ProviderAccessModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPermissions, setCurrentPermissions] = useState<{ 
    labResults: boolean; 
    medications: boolean; 
    fitnessData: boolean; 
  }>(provider.permissions);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (!isOpen) return null;

  // Handle permission toggle with local state update
  const handlePermissionToggle = (permission: string) => {
    setCurrentPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission as keyof typeof prev]
    }));
  };

  // Save changes to API
  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Determine if any permissions are enabled to set approved status
      const hasAnyPermissions = Object.values(currentPermissions).some(Boolean);
      
      // First try to save with Supabase
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Check if there's an existing consent record
          const { data: existingConsent, error: queryError } = await supabase
            .from('user_provider_consents')
            .select('*')
            .eq('user_id', user.id)
            .eq('provider_id', provider.id)
            .maybeSingle();
            
          if (queryError) throw queryError;
          
          // Map our permission keys to the database columns
          const dbPermissions = {
            lab_results: currentPermissions.labResults,
            medications: currentPermissions.medications,
            fitness_data: currentPermissions.fitnessData,
            approved: hasAnyPermissions, // Set approved based on permissions
            updated_at: new Date().toISOString()
          };
          
          if (existingConsent) {
            // Update existing consent
            const { error: updateError } = await supabase
              .from('user_provider_consents')
              .update(dbPermissions)
              .eq('user_id', user.id)
              .eq('provider_id', provider.id);
              
            if (updateError) throw updateError;
          } else {
            // Insert new consent
            const { error: insertError } = await supabase
              .from('user_provider_consents')
              .insert({
                user_id: user.id,
                provider_id: provider.id,
                ...dbPermissions
              });
              
            if (insertError) throw insertError;
          }
          
          // Call the parent component's function to update UI
          await onUpdatePermissions(provider.id, currentPermissions);
          
          // Close the modal on success
          onClose();
          return;
        }
      } catch (supErr) {
        console.error('Error updating in Supabase:', supErr);
        // Continue to try legacy API
      }
      
      // Call the parent component's function which should handle the API call
      await onUpdatePermissions(provider.id, currentPermissions);
      
      // Close the modal on success
      onClose();
    } catch (err) {
      console.error('Error updating permissions:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to update permissions. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Delete provider access
  const handleDelete = async () => {
    // If not yet confirming, show confirmation first
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // First try to delete with Supabase
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Delete the consent record
          const { error: deleteError } = await supabase
            .from('user_provider_consents')
            .delete()
            .eq('user_id', user.id)
            .eq('provider_id', provider.id);
            
          if (deleteError) throw deleteError;
          
          // Call the parent component's function to update UI
          await onDeleteProvider(provider.id);
          
          // Close the modal on success
          onClose();
          return;
        }
      } catch (supErr) {
        console.error('Error deleting in Supabase:', supErr);
        // Continue to try legacy API
      }
      
      // Call the parent component's function which should handle the API call
      await onDeleteProvider(provider.id);
      
      // Close the modal on success
      onClose();
    } catch (err) {
      console.error('Error removing provider access:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to remove provider access. Please try again.');
      }
    } finally {
      setLoading(false);
      setConfirmingDelete(false);
    }
  };

  // Cancel without saving changes
  const handleCancel = () => {
    // Reset confirmation state if active
    if (confirmingDelete) {
      setConfirmingDelete(false);
      return;
    }
    
    // Close modal
    onClose();
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={handleCancel}
      />
      <div className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg bg-white rounded-xl shadow-xl z-50 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <img 
              src={provider.logo} 
              alt={provider.name} 
              className="w-10 h-10"
              onError={(e) => {
                // Fallback if image fails to load
                e.currentTarget.src = '/elroi-logo.svg';
              }}
            />
            <div>
              <h2 className="text-xl font-semibold">{provider.name}</h2>
              <p className="text-sm text-gray-600">Manage provider access</p>
            </div>
          </div>
          <button 
            onClick={handleCancel}
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
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Data Access Permissions</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Lab Results</h4>
                    <p className="text-sm text-gray-500">Access to your laboratory test results</p>
                  </div>
                  <button
                    onClick={() => handlePermissionToggle('labResults')}
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      currentPermissions.labResults ? 'bg-green-400' : 'bg-gray-200'
                    }`}
                    type="button"
                    disabled={loading}
                    aria-pressed={currentPermissions.labResults}
                    aria-label={`${currentPermissions.labResults ? 'Disable' : 'Enable'} lab results access`}
                  >
                    <div
                      className={`absolute w-5 h-5 rounded-full bg-white top-0.5 transition-all ${
                        currentPermissions.labResults ? 'left-[1.625rem]' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Medications</h4>
                    <p className="text-sm text-gray-500">Access to your medication history</p>
                  </div>
                  <button
                    onClick={() => handlePermissionToggle('medications')}
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      currentPermissions.medications ? 'bg-green-400' : 'bg-gray-200'
                    }`}
                    type="button"
                    disabled={loading}
                    aria-pressed={currentPermissions.medications}
                    aria-label={`${currentPermissions.medications ? 'Disable' : 'Enable'} medications access`}
                  >
                    <div
                      className={`absolute w-5 h-5 rounded-full bg-white top-0.5 transition-all ${
                        currentPermissions.medications ? 'left-[1.625rem]' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Fitness Data</h4>
                    <p className="text-sm text-gray-500">Access to your fitness and activity data</p>
                  </div>
                  <button
                    onClick={() => handlePermissionToggle('fitnessData')}
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      currentPermissions.fitnessData ? 'bg-green-400' : 'bg-gray-200'
                    }`}
                    type="button"
                    disabled={loading}
                    aria-pressed={currentPermissions.fitnessData}
                    aria-label={`${currentPermissions.fitnessData ? 'Disable' : 'Enable'} fitness data access`}
                  >
                    <div
                      className={`absolute w-5 h-5 rounded-full bg-white top-0.5 transition-all ${
                        currentPermissions.fitnessData ? 'left-[1.625rem]' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h3>
              <p className="text-sm text-gray-600 mb-4">
                Removing this provider will revoke all access to your health information. This action cannot be undone.
              </p>
              <button
                onClick={handleDelete}
                className={`w-full ${
                  confirmingDelete 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                } px-4 py-2 rounded-lg transition-colors`}
                type="button"
                disabled={loading}
              >
                {confirmingDelete ? 'Confirm Removal' : 'Remove Provider Access'}
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-end gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              type="button"
              disabled={loading}
            >
              {confirmingDelete ? 'Cancel Removal' : 'Cancel'}
            </button>
            <button
              onClick={handleSaveChanges}
              className={`px-4 py-2 bg-blue-600 text-white rounded-lg ${
                loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
              } transition-colors flex items-center`}
              type="button"
              disabled={loading || confirmingDelete}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}