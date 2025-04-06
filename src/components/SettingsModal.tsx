import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { supabase } from '../services/supabase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: {
    id: string;
    title: string;
    description: string;
  } | null;
}

export default function SettingsModal({ isOpen, onClose, section }: SettingsModalProps) {
  // Use both auth contexts to handle both auth systems
  const legacyAuth = useAuth();
  const supabaseAuth = useSupabaseAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state for various settings sections
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    bio: ''
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: false,
    sms: false
  });
  
  const [privacySettings, setPrivacySettings] = useState({
    twoFactorEnabled: false,
    dataSharing: true
  });
  
  const [connectedServices, setConnectedServices] = useState({
    'Google Fit': false,
    'Apple Health': false,
    'Fitbit': false
  });

  // Initialize form data based on the current user
  useEffect(() => {
    // Use Supabase user if available, otherwise fall back to legacy user
    const currentUser = supabaseAuth.user || legacyAuth.user;
    
    if (currentUser) {
      setProfileData({
        name: currentUser.user_metadata?.name || currentUser.name || '',
        email: currentUser.email || '',
        bio: currentUser.user_metadata?.bio || ''
      });
      
      setPrivacySettings(prev => ({
        ...prev,
        twoFactorEnabled: currentUser.user_metadata?.twoFactorEnabled || false
      }));
    }
  }, [supabaseAuth.user, legacyAuth.user]);

  // Fetch settings from API when modal opens
  useEffect(() => {
    if (isOpen && section) {
      fetchSectionData(section.id);
    }
  }, [isOpen, section]);

  // Fetch data for the specific section
  const fetchSectionData = async (sectionId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Try Supabase first
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          switch (sectionId) {
            case 'profile':
              // User data is already set from the useEffect above
              break;
              
            case 'notifications':
              // Fetch notification settings from Supabase
              const { data: userSettings } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();
                
              if (userSettings) {
                setNotificationSettings({
                  email: userSettings.email_notifications || false,
                  push: userSettings.push_notifications || false,
                  sms: userSettings.sms_notifications || false
                });
              }
              break;
              
            case 'privacy':
              // Privacy settings may come from user metadata
              setPrivacySettings({
                twoFactorEnabled: user.user_metadata?.twoFactorEnabled || false,
                dataSharing: user.user_metadata?.dataSharing || true
              });
              break;
              
            case 'integrations':
              // Check if the user has connected services from Supabase
              const { data: providers } = await supabase
                .from('providers')
                .select('*');
                
              const connectedServicesData = {
                'Google Fit': false,
                'Apple Health': false,
                'Fitbit': false
              };
              
              // Check for providers that match connected services
              if (providers) {
                providers.forEach(provider => {
                  if (provider.name.includes('Google') || provider.name.includes('Fit')) {
                    connectedServicesData['Google Fit'] = true;
                  } else if (provider.name.includes('Apple') || provider.name.includes('Health')) {
                    connectedServicesData['Apple Health'] = true;
                  } else if (provider.name.includes('Fitbit')) {
                    connectedServicesData['Fitbit'] = true;
                  }
                });
              }
              
              setConnectedServices(connectedServicesData);
              break;
          }
          
          // Successfully loaded data from Supabase, return
          setLoading(false);
          return;
        }
      } catch (supErr) {
        console.error(`Error fetching ${section?.id} settings from Supabase:`, supErr);
        // Fall back to legacy API
      }
      
      // Fall back to legacy API
      switch (sectionId) {
        case 'profile':
          // Fetch profile data
          const profileResponse = await api.get<any>('profile');
          if (profileResponse) {
            setProfileData({
              name: profileResponse.name || '',
              email: profileResponse.email || '',
              bio: profileResponse.bio || ''
            });
          }
          break;
          
        case 'notifications':
          // Fetch notification settings
          const notificationsResponse = await api.get<any>('user-notification-settings');
          if (notificationsResponse) {
            setNotificationSettings({
              email: notificationsResponse.emailNotifications || false,
              push: notificationsResponse.appNotifications || false,
              sms: notificationsResponse.smsNotifications || false
            });
          }
          break;
          
        case 'privacy':
          // Fetch privacy settings
          // Using user data from auth context and settings endpoint
          const settingsResponse = await api.get<any>('settings');
          if (settingsResponse) {
            setPrivacySettings({
              twoFactorEnabled: legacyAuth.user?.twoFactorEnabled || false,
              dataSharing: settingsResponse.dataSharing || false
            });
          }
          break;
          
        case 'integrations':
          // Fetch connected services
          const companyResponse = await api.post<{ companies: any[] }>('company/list', {});
          const connectedServicesData = {
            'Google Fit': false,
            'Apple Health': false,
            'Fitbit': false
          };
          
          // Check if companies match any of our services
          if (companyResponse.companies) {
            companyResponse.companies.forEach(company => {
              const name = company.name;
              if (name.includes('Google') || name.includes('Fit')) {
                connectedServicesData['Google Fit'] = true;
              } else if (name.includes('Apple') || name.includes('Health')) {
                connectedServicesData['Apple Health'] = true;
              } else if (name.includes('Fitbit')) {
                connectedServicesData['Fitbit'] = true;
              }
            });
          }
          
          setConnectedServices(connectedServicesData);
          break;
      }
    } catch (err) {
      console.error(`Error fetching ${section?.id} settings:`, err);
      setError('Failed to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Save the current section's settings
  const saveSettings = async () => {
    if (!section) return;
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Try Supabase first
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          switch (section.id) {
            case 'profile':
              // Update user profile in Supabase
              const { error: updateError } = await supabase.auth.updateUser({
                email: profileData.email !== user.email ? profileData.email : undefined,
                data: {
                  name: profileData.name,
                  bio: profileData.bio
                }
              });
              
              if (updateError) throw updateError;
              setSuccess('Profile updated successfully');
              break;
              
            case 'notifications':
              // Check if user settings exist
              const { data: existingSettings } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();
                
              if (existingSettings) {
                // Update existing settings
                const { error: updateError } = await supabase
                  .from('user_settings')
                  .update({
                    email_notifications: notificationSettings.email,
                    push_notifications: notificationSettings.push,
                    sms_notifications: notificationSettings.sms,
                    updated_at: new Date().toISOString()
                  })
                  .eq('user_id', user.id);
                  
                if (updateError) throw updateError;
              } else {
                // Insert new settings
                const { error: insertError } = await supabase
                  .from('user_settings')
                  .insert({
                    user_id: user.id,
                    email_notifications: notificationSettings.email,
                    push_notifications: notificationSettings.push,
                    sms_notifications: notificationSettings.sms
                  });
                  
                if (insertError) throw insertError;
              }
              
              setSuccess('Notification preferences updated');
              break;
              
            case 'privacy':
              // Update user metadata for privacy settings
              const { error: privacyError } = await supabase.auth.updateUser({
                data: {
                  twoFactorEnabled: privacySettings.twoFactorEnabled,
                  dataSharing: privacySettings.dataSharing
                }
              });
              
              if (privacyError) throw privacyError;
              setSuccess('Privacy settings updated');
              break;
              
            case 'integrations':
              // This would involve connecting/disconnecting from services
              // Not fully implemented in this example
              setSuccess('Integrations updated');
              break;
          }
          
          // Successfully saved to Supabase, return after short delay to show success message
          setTimeout(() => {
            onClose();
          }, 1500);
          return;
        }
      } catch (supErr) {
        console.error(`Error saving ${section.id} settings to Supabase:`, supErr);
        // Fall back to legacy API
      }
      
      // Fall back to legacy API
      switch (section.id) {
        case 'profile':
          // Update profile
          await api.post('profile', profileData);
          setSuccess('Profile updated successfully');
          break;
          
        case 'notifications':
          // Update notification settings
          await api.post('user-notification-settings', {
            emailNotifications: notificationSettings.email,
            appNotifications: notificationSettings.push,
            smsNotifications: notificationSettings.sms
          });
          setSuccess('Notification preferences updated');
          break;
          
        case 'privacy':
          // Update privacy settings
          // For two-factor auth, this might be a separate endpoint
          if (legacyAuth.user?.twoFactorEnabled !== privacySettings.twoFactorEnabled) {
            await api.post('two-factor-active-inactive', {
              active: privacySettings.twoFactorEnabled
            });
          }
          
          // Update general settings
          await api.post('settings', {
            dataSharing: privacySettings.dataSharing
          });
          
          setSuccess('Privacy settings updated');
          break;
          
        case 'data':
          // This would be a separate API call for data management
          setSuccess('Data settings updated');
          break;
          
        case 'integrations':
          // This would involve connecting/disconnecting from services
          setSuccess('Integrations updated');
          break;
      }
      
      // Close the modal after a short delay to show success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error(`Error saving ${section.id} settings:`, err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to save settings. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle toggle for switches
  const handleToggle = (section: string, setting: string) => {
    switch (section) {
      case 'notifications':
        setNotificationSettings(prev => ({
          ...prev,
          [setting]: !prev[setting as keyof typeof prev]
        }));
        break;
        
      case 'privacy':
        setPrivacySettings(prev => ({
          ...prev,
          [setting]: !prev[setting as keyof typeof prev]
        }));
        break;
        
      case 'integrations':
        setConnectedServices(prev => ({
          ...prev,
          [setting]: !prev[setting as keyof typeof prev]
        }));
        break;
    }
  };

  const renderContent = () => {
    if (!section) return null;
    
    switch (section.id) {
      case 'profile':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your display name"
                value={profileData.name}
                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email address"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Tell us about yourself"
                value={profileData.bio}
                onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                disabled={loading}
              />
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-4">
            {['email', 'push', 'sms'].map((type) => (
              <div key={type} className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{type.charAt(0).toUpperCase() + type.slice(1)} Notifications</h4>
                  <p className="text-sm text-gray-500">Receive notifications via {type.toLowerCase()}</p>
                </div>
                <button
                  onClick={() => handleToggle('notifications', type)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    notificationSettings[type as keyof typeof notificationSettings] 
                      ? 'bg-blue-600' 
                      : 'bg-gray-200'
                  }`}
                  role="switch"
                  aria-checked={notificationSettings[type as keyof typeof notificationSettings]}
                  disabled={loading}
                  type="button"
                >
                  <span 
                    className={`${
                      notificationSettings[type as keyof typeof notificationSettings] 
                        ? 'translate-x-5' 
                        : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} 
                  />
                </button>
              </div>
            ))}
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Two-Factor Authentication</h4>
                <p className="text-sm text-gray-500">Add an extra layer of security</p>
              </div>
              <button 
                onClick={() => handleToggle('privacy', 'twoFactorEnabled')}
                className={`px-4 py-2 ${
                  privacySettings.twoFactorEnabled
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white rounded-lg transition-colors`}
                type="button"
                disabled={loading}
              >
                {privacySettings.twoFactorEnabled ? 'Enabled' : 'Enable'}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Data Sharing</h4>
                <p className="text-sm text-gray-500">Control how your data is shared</p>
              </div>
              <button 
                onClick={() => handleToggle('privacy', 'dataSharing')}
                className={`px-4 py-2 ${
                  privacySettings.dataSharing
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'border border-gray-300 hover:bg-gray-50'
                } rounded-lg transition-colors`}
                type="button"
                disabled={loading}
              >
                {privacySettings.dataSharing ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Data Storage</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Used Space</span>
                  <span className="text-sm font-medium">45%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full w-[45%]" />
                </div>
              </div>
            </div>
            <button 
              className="w-full px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              type="button"
              disabled={loading}
            >
              Clear All Data
            </button>
          </div>
        );

      case 'integrations':
        return (
          <div className="space-y-4">
            {Object.keys(connectedServices).map((service) => (
              <div key={service} className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{service}</h4>
                  <p className="text-sm text-gray-500">
                    {connectedServices[service as keyof typeof connectedServices] 
                      ? 'Connected to your account' 
                      : `Connect your ${service} account`}
                  </p>
                </div>
                <button 
                  onClick={() => handleToggle('integrations', service)}
                  className={`px-4 py-2 ${
                    connectedServices[service as keyof typeof connectedServices]
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'border border-gray-300 hover:bg-gray-50'
                  } rounded-lg transition-colors`}
                  type="button"
                  disabled={loading}
                >
                  {connectedServices[service as keyof typeof connectedServices] 
                    ? 'Disconnect' 
                    : 'Connect'}
                </button>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen || !section) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      <div className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg bg-white rounded-xl shadow-xl z-50 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold">{section.title}</h2>
            <p className="text-sm text-gray-600">{section.description}</p>
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

        {success && (
          <div className="mx-6 mt-4 px-4 py-3 bg-green-50 border border-green-200 text-green-600 rounded-md text-sm">
            {success}
          </div>
        )}

        <div className="p-6 overflow-y-auto">
          {loading && !success ? (
            <div className="flex justify-center items-center py-8">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            renderContent()
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              type="button"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={saveSettings}
              className={`px-4 py-2 bg-blue-600 text-white rounded-lg ${
                loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
              } transition-colors flex items-center`}
              type="button"
              disabled={loading || !!success}
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