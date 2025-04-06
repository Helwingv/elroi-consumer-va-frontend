import { useState, useEffect } from 'react';
import ProviderAccessModal from '../components/ProviderAccessModal';
import { api } from '../services/api';
import { supabase } from '../services/supabase';
import { supabaseData } from '../services/supabaseData';

export interface Provider {
  id: string;
  name: string;
  logo: string;
  dateAdded: string;
  accessStatus: 'Granted' | 'Disconnected';
  permissions: {
    labResults: boolean;
    medications: boolean;
    fitnessData: boolean;
  };
}

export default function Consent() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch providers with consent information
  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use supabaseData service to get providers
      try {
        const providersFromService = await supabaseData.getProviders();
        
        if (providersFromService && providersFromService.length > 0) {
          // Map to the expected Provider format for this page
          const mappedProviders = providersFromService.map(provider => ({
            id: provider.id,
            name: provider.name,
            logo: provider.logo || '/elroi-logo.svg',
            dateAdded: new Date(provider.lastSync).toLocaleDateString(),
            accessStatus: provider.permissions.labResults || 
                         provider.permissions.medications || 
                         provider.permissions.fitnessData ? 'Granted' : 'Disconnected',
            permissions: provider.permissions
          }));
          
          setProviders(mappedProviders);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error fetching providers from Supabase data service:', err);
        // Fallback to sample data if all fetch attempts fail
        setProviders([
          {
            id: '1',
            name: 'Baptist Health',
            logo: '/elroi-logo.svg',
            dateAdded: '10/20/2024',
            accessStatus: 'Granted',
            permissions: {
              labResults: true,
              medications: true,
              fitnessData: true
            }
          },
          {
            id: '2',
            name: 'HealthMart Pharmacy',
            logo: '/elroi-logo.svg',
            dateAdded: '05/20/2024',
            accessStatus: 'Disconnected',
            permissions: {
              labResults: false,
              medications: false,
              fitnessData: false
            }
          },
          {
            id: '3',
            name: 'Health Zone',
            logo: '/elroi-logo.svg',
            dateAdded: '05/20/2024',
            accessStatus: 'Granted',
            permissions: {
              labResults: true,
              medications: true,
              fitnessData: true
            }
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = async (providerId: string, permission: keyof Provider['permissions']) => {
    try {
      setLoading(true);

      // Find the current provider
      const provider = providers.find(p => p.id === providerId);
      if (!provider) return;

      // Create new permissions object with the toggled permission
      const newPermissions = {
        ...provider.permissions,
        [permission]: !provider.permissions[permission]
      };

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Determine if any permissions are enabled
      const hasAnyPermissions = Object.values(newPermissions).some(Boolean);
      
      // Map to database column names
      const dbPermissions = {
        lab_results: newPermissions.labResults,
        medications: newPermissions.medications,
        fitness_data: newPermissions.fitnessData,
        approved: hasAnyPermissions,
        updated_at: new Date().toISOString()
      };
      
      // Check if there's an existing consent record
      const { data: existingConsent, error: queryError } = await supabase
        .from('user_provider_consents')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider_id', providerId)
        .maybeSingle();
        
      if (queryError) throw queryError;
      
      if (existingConsent) {
        // Update existing consent
        const { error: updateError } = await supabase
          .from('user_provider_consents')
          .update(dbPermissions)
          .eq('user_id', user.id)
          .eq('provider_id', providerId);
          
        if (updateError) throw updateError;
      } else {
        // Insert new consent
        const { error: insertError } = await supabase
          .from('user_provider_consents')
          .insert({
            user_id: user.id,
            provider_id: providerId,
            ...dbPermissions
          });
          
        if (insertError) throw insertError;
      }
      
      // Update local state
      setProviders(prev => prev.map(provider => 
        provider.id === providerId
          ? {
              ...provider,
              permissions: newPermissions,
              accessStatus: Object.values(newPermissions).some(Boolean) ? 'Granted' : 'Disconnected'
            }
          : provider
      ));
    } catch (err) {
      console.error('Error toggling permission:', err);
      alert('Failed to update permission. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePermissions = async (providerId: string, newPermissions: { [key: string]: boolean }) => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Determine if any permissions are enabled
      const hasAnyPermissions = Object.values(newPermissions).some(Boolean);
      
      // Map to database column names
      const dbPermissions = {
        lab_results: newPermissions.labResults,
        medications: newPermissions.medications,
        fitness_data: newPermissions.fitnessData,
        approved: hasAnyPermissions,
        updated_at: new Date().toISOString()
      };
      
      // Check if there's an existing consent entry
      const { data: existingConsent, error: queryError } = await supabase
        .from('user_provider_consents')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider_id', providerId)
        .maybeSingle();
      
      if (queryError) throw queryError;
      
      if (existingConsent) {
        // Update existing consent
        const { error: updateError } = await supabase
          .from('user_provider_consents')
          .update(dbPermissions)
          .eq('user_id', user.id)
          .eq('provider_id', providerId);
          
        if (updateError) throw updateError;
      } else {
        // Insert new consent
        const { error: insertError } = await supabase
          .from('user_provider_consents')
          .insert({
            user_id: user.id,
            provider_id: providerId,
            ...dbPermissions
          });
          
        if (insertError) throw insertError;
      }
      
      // Update local state
      setProviders(prevProviders =>
        prevProviders.map(provider =>
          provider.id === providerId
            ? {
                ...provider,
                permissions: newPermissions,
                accessStatus: hasAnyPermissions ? 'Granted' : 'Disconnected'
              }
            : provider
        )
      );
      
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error updating permissions:', err);
      alert('Failed to update permissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProvider = async (providerId: string) => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Delete the consent record
      const { error: deleteError } = await supabase
        .from('user_provider_consents')
        .delete()
        .eq('user_id', user.id)
        .eq('provider_id', providerId);
        
      if (deleteError) throw deleteError;
      
      // Update local state to show disconnected
      setProviders(prevProviders =>
        prevProviders.map(provider =>
          provider.id === providerId
            ? {
                ...provider,
                accessStatus: 'Disconnected',
                permissions: {
                  labResults: false,
                  medications: false,
                  fitnessData: false
                }
              }
            : provider
        )
      );
      
      // Close the modal
      setIsModalOpen(false);
      
      // Refresh providers to ensure UI is updated
      fetchProviders();
    } catch (err) {
      console.error('Error deleting provider:', err);
      alert('Failed to disconnect provider. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (provider: Provider) => {
    setSelectedProvider(provider);
    setIsModalOpen(true);
  };

  // Show loading state
  if (loading && providers.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <span>Dashboard</span>
          <span>›</span>
          <span>Consent Management</span>
        </div>
        <h1 className="text-4xl font-bold mb-8">Consent Management</h1>
        <div className="bg-white rounded-2xl p-6 flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading providers...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && providers.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <span>Dashboard</span>
          <span>›</span>
          <span>Consent Management</span>
        </div>
        <h1 className="text-4xl font-bold mb-8">Consent Management</h1>
        <div className="bg-white rounded-2xl p-6 flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-600 text-xl mb-2">Error</div>
            <p className="text-gray-600">{error}</p>
            <button 
              onClick={() => fetchProviders()} 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <span>Dashboard</span>
        <span>›</span>
        <span>Consent Management</span>
      </div>

      <h1 className="text-4xl font-bold mb-8">Consent Management</h1>

      <div className="bg-white rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-6">My Providers</h2>
        
        {providers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No providers found. Add providers from the Providers page.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="pb-4">Providers</th>
                  <th className="pb-4">Date Added</th>
                  <th className="pb-4">Access Status</th>
                  <th className="pb-4">Lab Results</th>
                  <th className="pb-4">Medications</th>
                  <th className="pb-4">Fitness Data</th>
                  <th className="pb-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((provider) => (
                  <tr key={provider.id} className="border-t border-gray-100">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={provider.logo} 
                          alt={provider.name} 
                          className="w-8 h-8"
                          onError={(e) => {
                            // Fallback if image fails to load
                            e.currentTarget.src = '/elroi-logo.svg';
                          }}
                        />
                        <span className="font-medium">{provider.name}</span>
                      </div>
                    </td>
                    <td className="py-4">{provider.dateAdded}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          provider.accessStatus === 'Granted' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <span>{provider.accessStatus}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className={`w-12 h-6 rounded-full relative ${
                        provider.permissions.labResults ? 'bg-green-400' : 'bg-gray-200'
                      }`}
                        onClick={() => handlePermissionToggle(provider.id, 'labResults')}
                        role="button"
                        tabIndex={0}
                      >
                        <div className={`absolute w-5 h-5 rounded-full bg-white top-0.5 transition-all ${
                          provider.permissions.labResults ? 'left-[1.625rem]' : 'left-0.5'
                        }`} />
                      </div>
                    </td>
                    <td className="py-4">
                      <div className={`w-12 h-6 rounded-full relative ${
                        provider.permissions.medications ? 'bg-green-400' : 'bg-gray-200'
                      }`}
                        onClick={() => handlePermissionToggle(provider.id, 'medications')}
                        role="button"
                        tabIndex={0}
                      >
                        <div className={`absolute w-5 h-5 rounded-full bg-white top-0.5 transition-all ${
                          provider.permissions.medications ? 'left-[1.625rem]' : 'left-0.5'
                        }`} />
                      </div>
                    </td>
                    <td className="py-4">
                      <div className={`w-12 h-6 rounded-full relative ${
                        provider.permissions.fitnessData ? 'bg-green-400' : 'bg-gray-200'
                      }`}
                        onClick={() => handlePermissionToggle(provider.id, 'fitnessData')}
                        role="button"
                        tabIndex={0}
                      >
                        <div className={`absolute w-5 h-5 rounded-full bg-white top-0.5 transition-all ${
                          provider.permissions.fitnessData ? 'left-[1.625rem]' : 'left-0.5'
                        }`} />
                      </div>
                    </td>
                    <td className="py-4">
                      <button 
                        onClick={() => openModal(provider)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {selectedProvider && (
        <ProviderAccessModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          provider={selectedProvider}
          onUpdatePermissions={handleUpdatePermissions}
          onDeleteProvider={handleDeleteProvider}
        />
      )}
    </div>
  );
}