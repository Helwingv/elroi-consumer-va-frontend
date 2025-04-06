import { useState, useEffect } from 'react';
import Calendar from '../components/Calendar';
import { CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import { supabaseData } from '../services/supabaseData';

interface Appointment {
  id: string;
  provider: {
    name: string;
    logo: string;
  };
  date: string;
  time?: string;
  details?: {
    doctorName?: string;
    specialty?: string;
    location?: string;
    address?: string;
    status?: 'confirmed' | 'pending' | 'cancelled';
  };
}

interface ReminderSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

// Default reminder settings - these would typically come from the API
const defaultReminderSettings: ReminderSetting[] = [
  {
    id: 'email',
    title: 'Email Notifications',
    description: 'Get appointment details in your inbox',
    enabled: true
  },
  {
    id: 'sms',
    title: 'Text Message Alerts',
    description: 'Receive quick SMS reminders',
    enabled: true
  },
  {
    id: 'app',
    title: 'In-App Notifications',
    description: 'See reminders inside your dashboard',
    enabled: true
  }
];

export default function CarePlanner() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [reminderSettings, setReminderSettings] = useState<ReminderSetting[]>(defaultReminderSettings);
  const [reminderToggles, setReminderToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(defaultReminderSettings.map(setting => [setting.id, setting.enabled]))
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Format date for display
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  // Fetch appointments using both Supabase and fallback API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to get appointments from Supabase first
        try {
          const supabaseAppointments = await supabaseData.getAppointments();
          
          if (supabaseAppointments && supabaseAppointments.length > 0) {
            setAppointments(supabaseAppointments);
            setSelectedAppointment(supabaseAppointments[0]);
            
            // Get notification settings
            const notificationSettings = await supabaseData.getUserSettings();
            
            if (notificationSettings) {
              setReminderToggles({
                email: notificationSettings.emailNotifications,
                sms: notificationSettings.smsNotifications,
                app: notificationSettings.pushNotifications
              });
            }
            
            setLoading(false);
            return;
          }
        } catch (supabaseError) {
          console.error('Error fetching from Supabase, falling back to API:', supabaseError);
        }
        
        // Fallback to API
        const contractsResponse = await api.get<{ contracts: any[] }>('contracts');
        const companiesResponse = await api.post<{ companies: any[] }>('company/list', {});
        const notificationSettingsResponse = await api.get<any>('user-notification-settings');
        
        // Map contracts to appointments
        const mappedAppointments: Appointment[] = [];
        
        if (contractsResponse.contracts && Array.isArray(contractsResponse.contracts)) {
          for (const contract of contractsResponse.contracts) {
            // Find the associated company
            const company = companiesResponse.companies.find(c => c.id === contract.companyId);
            
            if (company) {
              // Create an appointment from the contract
              const appointmentDate = new Date(contract.startDate || contract.created_at || Date.now());
              
              mappedAppointments.push({
                id: contract.id,
                provider: {
                  name: company.name,
                  logo: company.logo || '/default-provider-logo.svg'
                },
                date: appointmentDate.toLocaleDateString(),
                time: appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                details: {
                  doctorName: contract.providerName || 'Dr. Provider',
                  specialty: contract.providerSpecialty || 'Primary Care',
                  location: company.name,
                  address: company.address || 'Chicago, IL',
                  status: contract.status === 'active' ? 'confirmed' : 
                           contract.status === 'pending' ? 'pending' : 'cancelled'
                }
              });
            }
          }
        }
        
        // If no appointments found, create some default ones
        if (mappedAppointments.length === 0) {
          mappedAppointments.push({
            id: '1',
            provider: {
              name: 'Baptist Health',
              logo: '/baptist-health-logo.svg'
            },
            date: '02/20/2026',
            time: '10:30 AM',
            details: {
              doctorName: 'Dr. Emily Carter',
              specialty: 'Primary Care',
              location: 'Baptist Health Medical Center',
              address: 'Chicago, IL',
              status: 'confirmed'
            }
          });
        }
        
        setAppointments(mappedAppointments);
        
        // Set the selected appointment to the first one
        if (mappedAppointments.length > 0) {
          setSelectedAppointment(mappedAppointments[0]);
        }
        
        // Update reminder settings based on notification preferences
        if (notificationSettingsResponse) {
          // Map API notification settings to our reminder toggles
          if (notificationSettingsResponse.emailNotifications !== undefined) {
            setReminderToggles(prev => ({
              ...prev,
              'email': notificationSettingsResponse.emailNotifications
            }));
          }
          
          // Update other toggles if they exist in the API response
          if (notificationSettingsResponse.smsNotifications !== undefined) {
            setReminderToggles(prev => ({
              ...prev,
              'sms': notificationSettingsResponse.smsNotifications
            }));
          }
          
          if (notificationSettingsResponse.appNotifications !== undefined) {
            setReminderToggles(prev => ({
              ...prev,
              'app': notificationSettingsResponse.appNotifications
            }));
          }
        }
        
      } catch (err) {
        console.error('Error fetching care planner data:', err);
        setError('Failed to load appointments');
        
        // Set fallback appointments
        setAppointments([
          {
            id: '1',
            provider: {
              name: 'Baptist Health',
              logo: '/baptist-health-logo.svg'
            },
            date: '02/20/2026'
          },
          {
            id: '2',
            provider: {
              name: 'HealthMart Pharmacy',
              logo: '/healthmart-logo.svg'
            },
            date: '02/20/2026'
          },
          {
            id: '3',
            provider: {
              name: 'Health Zone',
              logo: '/health-zone-logo.svg'
            },
            date: '02/24/2026'
          }
        ]);
        
        // Set the selected appointment to the first fallback appointment
        setSelectedAppointment({
          id: '1',
          provider: {
            name: 'Baptist Health',
            logo: '/baptist-health-logo.svg'
          },
          date: '02/20/2026',
          time: '10:30 AM',
          details: {
            doctorName: 'Dr. Emily Carter',
            specialty: 'Primary Care',
            location: 'VA Medical Center',
            address: 'Chicago, IL',
            status: 'confirmed'
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update notification settings when toggles change
  const toggleReminder = async (id: string) => {
    try {
      const newValue = !reminderToggles[id];
      
      // Update local state first for immediate feedback
      setReminderToggles(prev => ({
        ...prev,
        [id]: newValue
      }));
      
      // Try to update in Supabase first
      try {
        await supabaseData.updateUserSettings({
          emailNotifications: id === 'email' ? newValue : reminderToggles.email,
          smsNotifications: id === 'sms' ? newValue : reminderToggles.sms,
          pushNotifications: id === 'app' ? newValue : reminderToggles.app
        });
        return;
      } catch (supabaseError) {
        console.error('Error updating settings in Supabase, falling back to API:', supabaseError);
      }
      
      // Map our reminder IDs to the API's notification settings
      const notificationSettings: Record<string, boolean> = {};
      
      if (id === 'email') {
        notificationSettings.emailNotifications = newValue;
      } else if (id === 'sms') {
        notificationSettings.smsNotifications = newValue;
      } else if (id === 'app') {
        notificationSettings.appNotifications = newValue;
      }
      
      // Update the notification settings in the API
      await api.post('user-notification-settings', notificationSettings);
      
    } catch (err) {
      console.error('Error updating notification settings:', err);
      
      // Revert the local state if the API call fails
      setReminderToggles(prev => ({
        ...prev,
        [id]: !prev[id]
      }));
      
      alert('Failed to update notification settings. Please try again.');
    }
  };

  // Handle date selection - update selected appointment based on date
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    
    // Find any appointments on this date
    const dateString = date.toLocaleDateString();
    const appointmentOnDate = appointments.find(app => {
      // Try to normalize date formats for comparison
      const appDate = new Date(app.date);
      return appDate.toLocaleDateString() === dateString;
    });
    
    if (appointmentOnDate) {
      setSelectedAppointment(appointmentOnDate);
    } else {
      // No appointment on this date
      setSelectedAppointment(null);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <span>Dashboard</span>
          <span>›</span>
          <span>Care Planner</span>
        </div>
        <h1 className="text-4xl font-bold mb-8">Care Planner</h1>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading appointments...</p>
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
        <span>Care Planner</span>
      </div>

      <h1 className="text-4xl font-bold mb-8">Care Planner</h1>

      <div className="grid grid-cols-12 gap-6">
        {/* Calendar Section */}
        <div className="col-span-12 lg:col-span-7">
          <Calendar selectedDate={selectedDate} onDateSelect={handleDateSelect} />

          <div className="mt-6 bg-white rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Appointment Details</h2>
            
            {selectedAppointment ? (
              <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <div>
                    <div className="text-gray-600">Date:</div>
                    <div className="font-medium">
                      {selectedAppointment.date ? 
                        formatDate(new Date(selectedAppointment.date)) : 
                        'Not specified'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Time:</div>
                    <div className="font-medium">
                      {selectedAppointment.time || '10:30 AM'} (Local Time)
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-gray-600">Provider:</div>
                  <div className="font-medium">
                    {selectedAppointment.details?.doctorName || 'Dr. Emily Carter'}, 
                    {' '}{selectedAppointment.details?.specialty || 'Primary Care'}
                  </div>
                </div>

                <div>
                  <div className="text-gray-600">Location:</div>
                  <div className="font-medium">
                    {selectedAppointment.details?.location || selectedAppointment.provider.name}
                  </div>
                  <div className="text-gray-600">
                    {selectedAppointment.details?.address || 'Chicago, IL'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-gray-600">Appointment Status:</div>
                  <div className={`flex items-center gap-1 ${
                    selectedAppointment.details?.status === 'confirmed' ? 'text-green-600' :
                    selectedAppointment.details?.status === 'pending' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    <span>
                      {selectedAppointment.details?.status === 'confirmed' ? 'Confirmed' :
                      selectedAppointment.details?.status === 'pending' ? 'Pending' :
                      selectedAppointment.details?.status === 'cancelled' ? 'Cancelled' :
                      'Confirmed'}
                    </span>
                    {selectedAppointment.details?.status === 'confirmed' && <CheckCircle className="w-4 h-4" />}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                No appointment selected. Please select a date with an appointment.
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          {/* Appointments Section */}
          <div className="bg-white rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Appointments</h2>
            <h3 className="text-gray-600 mb-4">This Month</h3>
            
            {appointments.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No appointments scheduled for this month.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="pb-2">Providers</th>
                    <th className="pb-2">Appointment Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {appointments.map(appointment => (
                    <tr 
                      key={appointment.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        if (appointment.date) {
                          setSelectedDate(new Date(appointment.date));
                        }
                      }}
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={appointment.provider.logo}
                            alt={appointment.provider.name}
                            className="w-8 h-8"
                            onError={(e) => {
                              // Fallback if image fails to load
                              e.currentTarget.src = '/elroi-logo.svg';
                            }}
                          />
                          <span className="font-medium">{appointment.provider.name}</span>
                        </div>
                      </td>
                      <td className="py-3">{appointment.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Reminder Settings */}
          <div className="bg-white rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Reminder Settings</h2>
            <div className="space-y-4">
              {reminderSettings.map(setting => (
                <div key={setting.id} className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{setting.title}</h3>
                    <p className="text-sm text-gray-500">{setting.description}</p>
                  </div>
                  <button
                    onClick={() => toggleReminder(setting.id)}
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      reminderToggles[setting.id] ? 'bg-green-400' : 'bg-gray-200'
                    }`}
                  >
                    <div
                      className={`absolute w-5 h-5 rounded-full bg-white top-0.5 transition-all ${
                        reminderToggles[setting.id] ? 'left-[1.625rem]' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}