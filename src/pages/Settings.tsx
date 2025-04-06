import { Settings as SettingsIcon, Bell, Lock, UserCircle, Database, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';
import SettingsModal from '../components/SettingsModal';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { supabase } from '../services/supabase';

interface SettingsSection {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  lastUpdated?: string;
  status?: 'enabled' | 'disabled' | 'partiallyEnabled';
}

const settingsSections: SettingsSection[] = [
  {
    id: 'profile',
    title: 'Profile Settings',
    icon: UserCircle,
    description: 'Manage your account information and preferences',
  },
  {
    id: 'notifications',
    title: 'Notification Preferences',
    icon: Bell,
    description: 'Control how you receive updates and alerts',
  },
  {
    id: 'privacy',
    title: 'Privacy & Security',
    icon: Lock,
    description: 'Manage your security settings and privacy preferences',
  },
  {
    id: 'data',
    title: 'Data Management',
    icon: Database,
    description: 'Control your data sharing and storage preferences',
  },
  {
    id: 'integrations',
    title: 'Connected Services',
    icon: Globe,
    description: 'Manage your connected applications and services',
  },
];

export default function Settings() {
  const [sections, setSections] = useState<SettingsSection[]>(settingsSections);
  const [selectedSection, setSelectedSection] = useState<SettingsSection | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use both auth contexts
  const legacyAuth = useAuth();
  const supabaseAuth = useSupabaseAuth();
  const user = supabaseAuth.user || legacyAuth.user;

  // Fetch settings data
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        
        // Try to get user settings from Supabase first
        try {
          const { data: { user: supabaseUser } } = await supabase.auth.getUser();
          
          if (supabaseUser) {
            // Get user metadata
            const metadata = supabaseUser.user_metadata;
            
            // Get user settings
            const { data: userSettings } = await supabase
              .from('user_settings')
              .select('*')
              .eq('user_id', supabaseUser.id)
              .maybeSingle();
            
            // Update the sections with data from Supabase
            const updatedSections = [...settingsSections];
            
            // Update profile section
            const profileSection = updatedSections.find(section => section.id === 'profile');
            if (profileSection) {
              profileSection.lastUpdated = supabaseUser.updated_at || new Date().toISOString();
              profileSection.status = 'enabled';
            }
            
            // Update notifications section
            const notificationSection = updatedSections.find(section => section.id === 'notifications');
            if (notificationSection && userSettings) {
              notificationSection.lastUpdated = userSettings.updated_at || new Date().toISOString();
              
              // Check if any notifications are enabled
              const hasEnabledNotifications = 
                userSettings.email_notifications || 
                userSettings.sms_notifications || 
                userSettings.push_notifications;
                
              notificationSection.status = hasEnabledNotifications ? 'enabled' : 'disabled';
            }
            
            // Update privacy section
            const privacySection = updatedSections.find(section => section.id === 'privacy');
            if (privacySection) {
              privacySection.lastUpdated = supabaseUser.updated_at || new Date().toISOString();
              privacySection.status = 'enabled';
            }
            
            // Update data management section
            const dataSection = updatedSections.find(section => section.id === 'data');
            if (dataSection) {
              dataSection.lastUpdated = new Date().toISOString();
              
              // Check for user consents to determine data sharing status
              const { data: consents, error: consentsError } = await supabase
                .from('user_provider_consents')
                .select('*')
                .eq('user_id', supabaseUser.id);
                
              if (!consentsError && consents && consents.length > 0) {
                dataSection.status = 'enabled';
              } else {
                dataSection.status = 'disabled';
              }
            }
            
            // Update integrations section
            const integrationsSection = updatedSections.find(section => section.id === 'integrations');
            if (integrationsSection) {
              integrationsSection.lastUpdated = new Date().toISOString();
              
              // Check for providers to determine integration status
              const { data: providers, error: providersError } = await supabase
                .from('providers')
                .select('*');
                
              if (!providersError && providers && providers.length > 0) {
                integrationsSection.status = 'enabled';
              } else {
                integrationsSection.status = 'disabled';
              }
            }
            
            setSections(updatedSections);
            return;
          }
        } catch (supErr) {
          console.error('Error fetching settings from Supabase:', supErr);
        }
        
        // Fall back to legacy API if Supabase fails
        
        // Get user settings from API
        const settingsResponse = await api.get<any>('settings');
        
        // Get notification settings
        const notificationSettingsResponse = await api.get<any>('user-notification-settings');
        
        // Update the sections with data from the API
        const updatedSections = [...settingsSections];
        
        // Update profile section
        if (user) {
          const profileSection = updatedSections.find(section => section.id === 'profile');
          if (profileSection) {
            profileSection.lastUpdated = user.updatedAt || new Date().toISOString();
            profileSection.status = 'enabled';
          }
        }
        
        // Update notifications section
        const notificationSection = updatedSections.find(section => section.id === 'notifications');
        if (notificationSection && notificationSettingsResponse) {
          notificationSection.lastUpdated = new Date().toISOString();
          
          // Check if any notifications are enabled
          const hasEnabledNotifications = Object.values(notificationSettingsResponse).some(Boolean);
          notificationSection.status = hasEnabledNotifications ? 'enabled' : 'disabled';
        }
        
        // Update privacy section
        const privacySection = updatedSections.find(section => section.id === 'privacy');
        if (privacySection && settingsResponse) {
          privacySection.lastUpdated = settingsResponse.updatedAt || new Date().toISOString();
          privacySection.status = settingsResponse.privacyEnabled ? 'enabled' : 'disabled';
        }
        
        // Update data management section
        const dataSection = updatedSections.find(section => section.id === 'data');
        if (dataSection && settingsResponse) {
          dataSection.lastUpdated = settingsResponse.updatedAt || new Date().toISOString();
          dataSection.status = settingsResponse.dataManagementEnabled ? 'enabled' : 'disabled';
        }
        
        // Update integrations section
        // We'll use the 'list' endpoint to check for connected providers
        const companiesResponse = await api.post<{ companies: any[] }>('company/list', {});
        const integrationsSection = updatedSections.find(section => section.id === 'integrations');
        
        if (integrationsSection && companiesResponse.companies) {
          integrationsSection.lastUpdated = new Date().toISOString();
          
          // Check if there are any active connections
          const hasActiveConnections = companiesResponse.companies.some(company => company.active);
          integrationsSection.status = hasActiveConnections ? 'enabled' : 'disabled';
        }
        
        setSections(updatedSections);
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError('Failed to load settings');
        
        // Keep using the default settings if API fails
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  const handleConfigure = (section: SettingsSection) => {
    setSelectedSection(section);
    setIsModalOpen(true);
  };

  // Show loading state
  if (loading && sections === settingsSections) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-gray-600 mt-1">Manage your account preferences and configurations</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && sections === settingsSections) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-gray-600 mt-1">Manage your account preferences and configurations</p>
          </div>
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
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account preferences and configurations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{section.title}</h3>
                      {section.status && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          section.status === 'enabled' ? 'bg-green-100 text-green-800' :
                          section.status === 'partiallyEnabled' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {section.status === 'enabled' ? 'Enabled' :
                          section.status === 'partiallyEnabled' ? 'Partial' :
                          'Disabled'}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mt-1">{section.description}</p>
                    {section.lastUpdated && (
                      <p className="text-gray-500 text-sm mt-2">
                        Last updated: {new Date(section.lastUpdated).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => handleConfigure(section)}
                  className="bg-white text-gray-700 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Configure
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      <SettingsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        section={selectedSection}
      />
    </div>
  );
}