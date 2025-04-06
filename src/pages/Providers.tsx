import { useEffect, useState } from 'react';
import { Stethoscope, ExternalLink, Shield } from 'lucide-react';
import AddProviderModal from '../components/AddProviderModal';
import ProviderDetailsModal from '../components/ProviderDetailsModal'; 
import ProviderAccessModal from '../components/ProviderAccessModal';
import { api } from '../services/api';
import { supabaseData } from '../services/supabaseData';
import { supabase } from '../services/supabase';

interface Provider {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'pending' | 'inactive';
  dataTypes: string[];
  lastSync: string;
  logo: string;
  permissions?: {
    labResults: boolean;
    medications: boolean;
    fitnessData: boolean;
  };
}

export default function Providers() {
  const [providersList, setProvidersList] = useState<Provider[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch providers from API
  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get providers from Supabase
      try {
        const providers = await supabaseData.getProviders();
        if (providers && providers.length > 0) {
          setProvidersList(providers);
        } else {
          // If no providers found, set empty list
          setProvidersList([]);
        }
      } catch (err) {
        console.error('Error fetching providers from Supabase:', err);
        setError('Failed to load providers');
        // Set empty list if error
        setProvidersList([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddProvider = async (newProvider: {
    name: string;
    category: string;
    dataTypes: string[];
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Insert the provider into Supabase
      const { data: provider, error: providerError } = await supabase
        .from('providers')
        .insert({
          name: newProvider.name,
          category: newProvider.category,
          status: 'active',
          logo: '/elroi-logo.svg',
          user_id: user.id
        })
        .select()
        .single();
        
      if (providerError) throw providerError;
      
      if (provider) {
        // Add data types to the provider
        for (const typeName of newProvider.dataTypes) {
          // Check if data type exists
          const { data: existingType } = await supabase
            .from('data_types')
            .select('id')
            .eq('name', typeName)
            .maybeSingle();
          
          let dataTypeId;
          
          if (existingType) {
            dataTypeId = existingType.id;
          } else {
            // Create the data type if it doesn't exist
            const { data: newType, error: typeError } = await supabase
              .from('data_types')
              .insert({ name: typeName })
              .select()
              .single();
              
            if (typeError) throw typeError;
            dataTypeId = newType.id;
          }
          
          // Associate data type with provider
          if (dataTypeId) {
            const { error: linkError } = await supabase
              .from('provider_data_types')
              .insert({
                provider_id: provider.id,
                data_type_id: dataTypeId
              });
              
            if (linkError) console.error('Error linking data type:', linkError);
          }
        }
        
        // Close the modal
        setIsAddModalOpen(false);
        
        // Refresh providers list
        await fetchProviders();
      }
    } catch (err) {
      console.error('Error adding provider:', err);
      setError('Failed to add provider');
    } finally {
      setLoading(false);
    }
  };

  const openDetailsModal = (provider: Provider) => {
    setSelectedProvider(provider);
    setIsDetailsModalOpen(true);
  };

  const openAccessModal = (provider: Provider) => {
    setSelectedProvider(provider);
    setIsAccessModalOpen(true);
  };

  const handleUpdatePermissions = async (providerId: string, permissions: { [key: string]: boolean }) => {
    try {
      setLoading(true);
      
      // Determine if any permissions are enabled to set approved status
      const hasAnyPermissions = Object.values(permissions).some(Boolean);
      
      // Try to update in Supabase first
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Check if there's an existing consent record
          const { data: existingConsent, error: queryError } = await supabase
            .from('user_provider_consents')
            .select('*')
            .eq('provider_id', providerId)
            .eq('user_id', user.id)
            .maybeSingle();

          if (queryError) throw queryError;

          // Map to database column names
          const dbPermissions = {
            lab_results: permissions.labResults,
            medications: permissions.medications,
            fitness_data: permissions.fitnessData,
            approved: hasAnyPermissions, // Set approved based on permissions
            updated_at: new Date().toISOString()
          };

          if (existingConsent) {
            // Update existing consent
            const { error: updateError } = await supabase
              .from('user_provider_consents')
              .update(dbPermissions)
              .eq('provider_id', providerId)
              .eq('user_id', user.id);
              
            if (updateError) throw updateError;
          } else {
            // Insert new consent
            const { error: insertError } = await supabase
              .from('user_provider_consents')
              .insert({
                provider_id: providerId,
                user_id: user.id,
                ...dbPermissions
              });
              
            if (insertError) throw insertError;
          }

          // Refresh providers list
          await fetchProviders();
          setIsAccessModalOpen(false);
          return;
        }
      } catch (err) {
        console.error('Error updating in Supabase:', err);
        setError('Failed to update permissions');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProvider = async (providerId: string) => {
    try {
      setLoading(true);
      
      // Try to delete consent with Supabase
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Delete the consent record first
          const { error: consentError } = await supabase
            .from('user_provider_consents')
            .delete()
            .eq('provider_id', providerId)
            .eq('user_id', user.id);
          
          if (consentError) {
            console.error('Error deleting consent:', consentError);
            // Continue even if consent deletion fails
          }
          
          // Get the provider to check if current user is the owner
          const { data: provider } = await supabase
            .from('providers')
            .select('user_id')
            .eq('id', providerId)
            .single();
            
          // Only delete the provider if the current user is the owner
          if (provider && provider.user_id === user.id) {
            // First delete provider_data_types records
            const { error: dataTypeError } = await supabase
              .from('provider_data_types')
              .delete()
              .eq('provider_id', providerId);
              
            if (dataTypeError) {
              console.error('Error deleting provider data types:', dataTypeError);
            }
            
            // Then delete the provider
            const { error: providerError } = await supabase
              .from('providers')
              .delete()
              .eq('id', providerId);
              
            if (providerError) throw providerError;
          }

          // Refresh providers list
          await fetchProviders();
          setIsAccessModalOpen(false);
          return;
        }
      } catch (err) {
        console.error('Error deleting provider:', err);
        setError('Failed to delete provider');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading && providersList.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Data Providers</h1>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add New Provider
          </button>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading providers...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && providersList.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Data Providers</h1>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add New Provider
          </button>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-600 text-xl mb-2">Error</div>
            <p className="text-gray-600">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Data Providers</h1>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New Provider
        </button>
      </div>

      {/* Show message if no providers */}
      {providersList.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
          <p className="text-gray-500">No providers found. Add a new provider to get started.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {providersList.map((provider) => (
          <div
            key={provider.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Stethoscope className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{provider.name}</h3>
                  <p className="text-sm text-gray-500">{provider.category}</p>
                  <div className="mt-2 flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      provider.status === 'active' ? 'bg-green-100 text-green-800' :
                      provider.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {provider.status.charAt(0).toUpperCase() + provider.status.slice(1)}
                    </span>
                    <span className="text-sm text-gray-500">
                      Last synced: {new Date(provider.lastSync).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-500">
                  <Shield className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-500">
                  <ExternalLink className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Data Types</h4>
              <div className="flex flex-wrap gap-2">
                {provider.dataTypes && provider.dataTypes.map((type) => (
                  <span
                    key={type}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 flex space-x-3">
              <button 
                onClick={() => openDetailsModal(provider)}
                className="flex-1 bg-white text-gray-700 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                View Details
              </button>
              <button 
                onClick={() => openAccessModal(provider)}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Manage Access
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <AddProviderModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddProvider}
      />
      
      {selectedProvider && (
        <ProviderDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          provider={selectedProvider}
        />
      )}
      
      {selectedProvider && (
        <ProviderAccessModal
          isOpen={isAccessModalOpen}
          onClose={() => setIsAccessModalOpen(false)}
          provider={selectedProvider}
          onUpdatePermissions={handleUpdatePermissions}
          onDeleteProvider={handleDeleteProvider}
        />
      )}
    </div>
  );
}