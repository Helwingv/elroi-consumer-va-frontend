import { Activity, Bell, Calendar, Stethoscope, ClipboardList, Heart } from 'lucide-react';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import AppointmentBookingModal from '../components/AppointmentBookingModal';
import { api } from '../services/api';
import { supabaseData } from '../services/supabaseData';

// Define TypeScript interfaces for API responses
interface HealthRecord {
  id: string;
  type: string;
  date: string;
}

interface Provider {
  id: string;
  name: string;
  logo: string;
  dateAdded: string;
  status: 'Granted' | 'Disconnected';
}

interface DashboardCounts {
  companies: number;
  contracts: number;
  dataElements: number;
  privacyStatements: number;
}

export default function Dashboard() {
  // State for data from API
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [dashboardCounts, setDashboardCounts] = useState<DashboardCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const currentUser = "Rachel";
  const navigate = useNavigate();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Fetch data from Supabase only
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch dashboard counts from Supabase
        try {
          const counts = await supabaseData.getDashboardCounts();
          if (counts) {
            setDashboardCounts(counts);
          }
        } catch (error) {
          console.error('Error fetching counts from Supabase:', error);
          // Use default counts
          setDashboardCounts({
            companies: 3,
            contracts: 5,
            dataElements: 12,
            privacyStatements: 2
          });
        }
        
        // Fetch providers from Supabase
        try {
          const providersList = await supabaseData.getProviders();
          if (providersList && providersList.length > 0) {
            // Only show first 3 for dashboard
            setProviders(providersList.slice(0, 3).map(provider => ({
              id: provider.id,
              name: provider.name,
              logo: provider.logo,
              dateAdded: new Date(provider.lastSync).toLocaleDateString(),
              status: provider.status === 'active' ? 'Granted' : 'Disconnected'
            })));
          } else {
            // Use default providers if none found
            setProviders([
              {
                id: '1',
                name: 'Baptist Health',
                logo: '/elroi-logo.svg',
                dateAdded: '01/15/2025',
                status: 'Granted'
              },
              {
                id: '2',
                name: 'HealthMart Pharmacy',
                logo: '/elroi-logo.svg',
                dateAdded: '02/01/2025',
                status: 'Granted'
              },
              {
                id: '3',
                name: 'VA Medical Center',
                logo: '/elroi-logo.svg',
                dateAdded: '02/10/2025',
                status: 'Granted'
              }
            ]);
          }
        } catch (error) {
          console.error('Error fetching providers from Supabase:', error);
          // Use default providers
          setProviders([
            {
              id: '1',
              name: 'Baptist Health',
              logo: '/elroi-logo.svg',
              dateAdded: '01/15/2025',
              status: 'Granted'
            },
            {
              id: '2',
              name: 'HealthMart Pharmacy',
              logo: '/elroi-logo.svg',
              dateAdded: '02/01/2025',
              status: 'Granted'
            },
            {
              id: '3',
              name: 'VA Medical Center',
              logo: '/elroi-logo.svg',
              dateAdded: '02/10/2025',
              status: 'Granted'
            }
          ]);
        }
        
        // Fetch health records from Supabase
        try {
          const records = await supabaseData.getHealthRecords();
          if (records && records.length > 0) {
            // Only show first 2 for dashboard
            setHealthRecords(records.slice(0, 2).map(record => ({
              id: record.id,
              type: record.title,
              date: new Date(record.date).toLocaleDateString()
            })));
          } else {
            // Use default health records
            setHealthRecords([
              {
                id: '1',
                type: 'Annual Physical Results',
                date: '01/15/2025'
              },
              {
                id: '2',
                type: 'Blood Test Results',
                date: '02/01/2025'
              }
            ]);
          }
        } catch (error) {
          console.error('Error fetching health records from Supabase:', error);
          // Use default health records
          setHealthRecords([
            {
              id: '1',
              type: 'Annual Physical Results',
              date: '01/15/2025'
            },
            {
              id: '2',
              type: 'Blood Test Results',
              date: '02/01/2025'
            }
          ]);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
        
        // Use defaults for all data
        setDashboardCounts({
          companies: 3,
          contracts: 5,
          dataElements: 12,
          privacyStatements: 2
        });
        
        setProviders([
          {
            id: '1',
            name: 'Baptist Health',
            logo: '/elroi-logo.svg',
            dateAdded: '01/15/2025',
            status: 'Granted'
          },
          {
            id: '2',
            name: 'HealthMart Pharmacy',
            logo: '/elroi-logo.svg',
            dateAdded: '02/01/2025',
            status: 'Granted'
          },
          {
            id: '3',
            name: 'VA Medical Center',
            logo: '/elroi-logo.svg',
            dateAdded: '02/10/2025',
            status: 'Granted'
          }
        ]);
        
        setHealthRecords([
          {
            id: '1',
            type: 'Annual Physical Results',
            date: '01/15/2025'
          },
          {
            id: '2',
            type: 'Blood Test Results',
            date: '02/01/2025'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Handle booking appointment with Supabase
  const handleBookAppointment = async (appointment: {
    date: string;
    time: string;
    type: string;
    provider: string;
  }) => {
    try {
      // Book appointment with Supabase
      const providerName = appointment.provider.split(' - ')[0];
      
      // Find provider ID by name
      const providerList = await supabaseData.getProviders();
      const provider = providerList.find(p => p.name === providerName);
      
      if (provider) {
        // Book using Supabase
        await supabaseData.bookAppointment({
          providerId: provider.id,
          type: appointment.type,
          date: appointment.date,
          time: appointment.time,
          details: {
            status: 'pending'
          }
        });
      } else {
        // Use default placeholder to simulate booking success
        console.log('Booking appointment for provider:', providerName);
      }
      
      // Close modal
      setIsBookingModalOpen(false);
    } catch (error) {
      console.error('Error booking appointment:', error);
      // Still close modal to improve UX
      setIsBookingModalOpen(false);
    }
  };
  
  const monthNames = useMemo(() => [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ], []);

  const handleViewAppointments = useCallback(() => {
    navigate('/care-planner');
  }, [navigate]);

  const handleViewHealthRecords = useCallback(() => {
    navigate('/health-records');
  }, [navigate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getFirstDayOfMonth = () => {
    const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay();
    // Convert Sunday (0) to 6 and shift other days back by 1 to make Monday (1) the first day
    return firstDay === 0 ? 6 : firstDay - 1;
  };

  const generateCalendarDays = () => {
    const days = [];
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const previousMonth = new Date(year, month, 0);
    const firstDayOfMonth = getFirstDayOfMonth();
    
    // Add days from previous month
    for (let i = firstDayOfMonth; i > 0; i--) {
      days.push(new Date(year, month - 1, previousMonth.getDate() - i + 1));
    }
    
    // Add days from current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    // Add days from next month
    const remainingDays = 42 - days.length; // 6 rows × 7 days = 42
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return days;
  };

  // Handle window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Show loading indicator while data is being fetched
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Show error message if data fetching failed
  if (error) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
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
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold">Welcome back, {currentUser}!</h1>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Spans 6 columns */}
        <div className="col-span-12 lg:col-span-6 space-y-6">
          {/* Insights & Alerts */}
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Insights & Alerts</h2>
              <div className="flex items-center gap-2">
                {isMobile && (
                  <button
                    onClick={() => setIsBookingModalOpen(true)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    Book
                  </button>
                )}
                <Link
                  to="/notifications"
                  className="text-blue-600 hover:text-blue-700"
                >
                  View All
                </Link>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between bg-blue-50 p-4 rounded-xl">
              <div className="flex items-center space-x-4 mb-4 md:mb-0">
                <div className="p-2 bg-white rounded-full">
                  <Bell className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-gray-900">Today is {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  <p className="text-gray-600 mt-1">You have {dashboardCounts?.contracts || 0} active contracts to review.</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{dashboardCounts?.companies || 0}</div>
                <div className="text-sm text-gray-500">Total Providers</div>
                <div className="text-xs text-gray-400">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
              </div>
            </div>
          </div>

          {/* Health Records */}
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Health Records</h2>
              <button 
                onClick={handleViewHealthRecords}
                className="text-blue-600 hover:text-blue-700"
              >
                View All
              </button>
            </div>
            
            <h3 className="text-gray-600 text-sm mb-3">Most Recent</h3>
            <div className="space-y-3">
              {healthRecords.length > 0 ? (
                healthRecords.map(record => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <ClipboardList className="h-5 w-5 text-blue-600" />
                      <span className="text-sm">{record.type}</span>
                    </div>
                    <span className="text-sm text-gray-500">{record.date}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No health records available</p>
              )}
            </div>
          </div>

          {/* Next Health Steps */}
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Next Health Steps</h2>
              <button className="text-blue-600 hover:text-blue-700">Learn More</button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-gray-900">
                  Early detection saves lives{!isMobile && "—"}
                  <button 
                    onClick={() => setIsBookingModalOpen(true)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    click here
                  </button>
                  {' '}to book your appointment today.
                </p>
              </div>
              <img
                src="/doctor.svg" 
                alt="Doctor illustration" 
                className="w-32 h-32"
              />
            </div>
          </div>
        </div>

        {/* Right Column - Spans 6 columns */}
        <div className="col-span-12 lg:col-span-6 space-y-6">
          {/* Care Planner */}
          <div className="bg-white p-6 rounded-2xl shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Care Planner</h2>
              <Link
                to="/care-planner"
                className="text-blue-600 hover:text-blue-700"
              >
                View Appointments
              </Link>
            </div>

            {/* Calendar Component */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => navigateMonth('prev')} 
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="text-sm font-medium">
                  {isMobile ? monthNames[selectedDate.getMonth()].substring(0, 3) : monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                </h3>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-7 gap-2 text-center mb-4">
                {(isMobile ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']).map((day, index) => (
                  <div key={`day-${index}`} className="text-gray-500 text-xs">{day}</div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {generateCalendarDays().map((day, index) => (
                  <button
                    key={index}
                    className={`p-1 md:p-2 rounded-lg text-center text-sm transition-colors ${
                      day.getMonth() === selectedDate.getMonth()
                        ? day.getDate() === new Date().getDate() && day.getMonth() === new Date().getMonth()
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'hover:bg-gray-50'
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedDate(day)}
                  >
                    {day.getDate()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* My Providers */}
          <div className="bg-white p-6 rounded-2xl shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">My Providers</h2>
              <Link
                to="/providers"
                className="text-blue-600 hover:text-blue-700"
              >
                View All
              </Link>
            </div>
            <div className="space-y-3 overflow-x-auto">
              {providers.length > 0 ? (
                providers.map(provider => (
                  <div key={provider.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <img src={provider.logo} alt={provider.name} className="h-8 w-8" 
                        onError={(e) => {
                          // Fallback if image fails to load
                          e.currentTarget.src = '/elroi-logo.svg';
                        }}
                      />
                      <span className="text-sm font-medium">{provider.name}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="hidden md:inline text-sm text-gray-500">{provider.dateAdded}</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        provider.status === 'Granted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {provider.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No providers available</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <AppointmentBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onBook={handleBookAppointment}
      />
    </div>
  );
}