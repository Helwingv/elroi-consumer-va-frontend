import { 
  Bell, Plus, ArrowUp, ArrowDown, MessageSquare, Calendar, 
  Trophy, AlertCircle, BellRing, CheckCircle, Activity, Heart, 
  Droplets, Brain, Clock, BookOpen, Stethoscope, Pill, Dumbbell
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface Notification {
  id: string;
  message: string;
  link?: string;
  linkText?: string;
  icon: JSX.Element;
  createdAt: string;
}

interface HealthMetric {
  id: string;
  title: string;
  value: string;
  trend: 'up' | 'down';
  period: string;
  added?: boolean;
  icon: React.ReactNode;
}

// Default mock notifications - these will be used if API fails
const defaultTodayNotifications: Notification[] = [
  {
    id: '1',
    message: 'Your appointment with Dr. Johnson is tomorrow at 10:00 AM.',
    linkText: 'View appointment',
    link: '/care-planner',
    icon: <Calendar className="h-6 w-6 text-purple-600" />,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    message: 'Your lab results from Central Medical Lab are now available.',
    linkText: 'View results',
    link: '/health-records',
    icon: <Stethoscope className="h-6 w-6 text-blue-600" />,
    createdAt: new Date().toISOString()
  }
];

const defaultYesterdayNotifications: Notification[] = [
  {
    id: '3',
    message: 'Reminder: Take your medication Lisinopril 10mg daily.',
    linkText: 'View medication',
    link: '/health-records',
    icon: <Pill className="h-6 w-6 text-green-600" />,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  }
];

const defaultLastWeekNotifications: Notification[] = [
  {
    id: '4',
    message: 'You\'ve completed your fitness goal! 10,000 steps achieved.',
    linkText: 'View progress',
    link: '/health-records',
    icon: <Dumbbell className="h-6 w-6 text-orange-600" />,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '5',
    message: 'Your insurance claim #12345 has been processed.',
    linkText: 'View details',
    link: '#',
    icon: <MessageSquare className="h-6 w-6 text-blue-600" />,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Map icon based on notification type
const getIconForType = (type: string): JSX.Element => {
  switch(type.toLowerCase()) {
    case 'appointment':
      return <Calendar className="h-6 w-6 text-purple-600" />;
    case 'message':
      return <MessageSquare className="h-6 w-6 text-blue-600" />;
    case 'medical':
      return <Stethoscope className="h-6 w-6 text-blue-600" />;
    case 'medication':
      return <Pill className="h-6 w-6 text-green-600" />;
    case 'activity':
      return <Dumbbell className="h-6 w-6 text-orange-600" />;
    default:
      return <Bell className="h-6 w-6 text-gray-600" />;
  }
};

const NotificationSection = ({ title, notifications }: { title: string; notifications: Notification[] }) => (
  <div>
    <h3 className="text-lg font-medium mb-4">{title}</h3>
    <div className="space-y-4">
      {notifications.length > 0 ? (
        notifications.map(notification => (
          <div key={notification.id} className="bg-blue-50 p-4 rounded-xl">
            <div className="flex gap-3">
              <div className="p-2 bg-white rounded-lg">
                {notification.icon}
              </div>
              <p className="text-gray-900">
                {notification.message}
                {notification.link && (
                  <a href={notification.link} className="text-blue-600 hover:text-blue-700 ml-1">
                    {notification.linkText}
                  </a>
                )}
              </p>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-500">No notifications for this period.</p>
      )}
    </div>
  </div>
);

// Sample health metrics data - this would typically come from an API
const healthMetrics: HealthMetric[] = [
  {
    id: '1',
    title: 'Average Sleep hrs',
    value: '6.5',
    trend: 'up',
    period: 'This week',
    icon: <Brain className="h-5 w-5 text-blue-600" />
  },
  {
    id: '2',
    title: 'Total Steps Taken',
    value: '100,000',
    trend: 'up',
    period: 'January 2026',
    added: true,
    icon: <Activity className="h-5 w-5 text-green-600" />
  },
  {
    id: '3',
    title: 'Calorie Intake',
    value: '300',
    trend: 'up',
    period: 'Today',
    icon: <BookOpen className="h-5 w-5 text-orange-600" />
  },
  {
    id: '4',
    title: 'Water Intake',
    value: '5 gal',
    trend: 'down',
    period: 'This week',
    icon: <Droplets className="h-5 w-5 text-blue-600" />
  },
  {
    id: '5',
    title: 'Mindfulness Minutes',
    value: '300',
    trend: 'up',
    period: 'This week',
    icon: <Brain className="h-5 w-5 text-purple-600" />
  },
  {
    id: '6',
    title: 'Journal Entries',
    value: '25',
    trend: 'up',
    period: 'January 2026',
    icon: <Heart className="h-5 w-5 text-red-600" />
  }
];

export default function Notifications() {
  const [todayNotifications, setTodayNotifications] = useState<Notification[]>([]);
  const [yesterdayNotifications, setYesterdayNotifications] = useState<Notification[]>([]);
  const [lastWeekNotifications, setLastWeekNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(true); // Set to true to always use mock data

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        
        if (useMockData) {
          // Use mock data directly
          setTodayNotifications(defaultTodayNotifications);
          setYesterdayNotifications(defaultYesterdayNotifications);
          setLastWeekNotifications(defaultLastWeekNotifications);
          setLoading(false);
          return;
        }
        
        // For this example, we'll use user-notification-settings to check if there are any settings
        // In a real implementation, there would be a dedicated notifications endpoint
        const response = await api.get<any>('user-notification-settings');
        
        // We'll simulate notifications based on the contract data
        const contractsResponse = await api.get<{ contracts: any[] }>('contracts');
        
        // Process the contracts into notifications
        const allNotifications = contractsResponse.contracts.map(contract => ({
          id: contract.id,
          message: `${contract.title || 'Contract'} - ${contract.description || 'Review required'}`,
          linkText: 'View details',
          link: `/contracts/${contract.id}`,
          icon: getIconForType(contract.type || 'default'),
          createdAt: contract.created_at || new Date().toISOString(),
        }));
        
        // Sort by date (newest first)
        const sortedNotifications = allNotifications.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        // Group notifications by timeframe
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        
        const todayNotifs = sortedNotifications.filter(notif => {
          const date = new Date(notif.createdAt);
          return date >= today;
        });
        
        const yesterdayNotifs = sortedNotifications.filter(notif => {
          const date = new Date(notif.createdAt);
          return date >= yesterday && date < today;
        });
        
        const lastWeekNotifs = sortedNotifications.filter(notif => {
          const date = new Date(notif.createdAt);
          return date >= lastWeekStart && date < yesterday;
        });
        
        if (todayNotifs.length > 0) {
          setTodayNotifications(todayNotifs);
        } else {
          setTodayNotifications(defaultTodayNotifications);
        }
        
        if (yesterdayNotifs.length > 0) {
          setYesterdayNotifications(yesterdayNotifs);
        } else {
          setYesterdayNotifications(defaultYesterdayNotifications);
        }
        
        if (lastWeekNotifs.length > 0) {
          setLastWeekNotifications(lastWeekNotifs);
        } else {
          setLastWeekNotifications(defaultLastWeekNotifications);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
        // Fall back to default mock notifications
        setTodayNotifications(defaultTodayNotifications);
        setYesterdayNotifications(defaultYesterdayNotifications);
        setLastWeekNotifications(defaultLastWeekNotifications);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [useMockData]);

  // Function to handle marking all notifications as read
  const markAllAsRead = async () => {
    try {
      // This would be implemented with an actual API endpoint
      // await api.post('notifications/mark-all-read');
      console.log('Marked all notifications as read');
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  // Function to add widget to dashboard
  const addWidget = (widgetId: string) => {
    // This would be implemented with an API call in a real app
    console.log(`Added widget ${widgetId} to dashboard`);
  };

  // Toggle between mock and API data
  const toggleDataSource = () => {
    setUseMockData(!useMockData);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (error && todayNotifications.length === 0 && yesterdayNotifications.length === 0 && lastWeekNotifications.length === 0) {
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
    <div className="p-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <span>Dashboard</span>
        <span>›</span>
        <span>Notifications</span>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Alerts Column */}
        <div className="col-span-12 lg:col-span-7">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Alerts</h2>
            <div className="flex gap-2">
              <button
                onClick={toggleDataSource}
                className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
              >
                {useMockData ? "Using Mock Data" : "Using API Data"}
              </button>
            </div>
          </div>
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Today</h3>
              <button 
                onClick={markAllAsRead}
                className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Mark as read
              </button>
            </div>
            <NotificationSection title="Today" notifications={todayNotifications} />
            <NotificationSection title="Yesterday" notifications={yesterdayNotifications} />
            <NotificationSection title="Last Week" notifications={lastWeekNotifications} />
          </div>
        </div>

        {/* Health Insights Column */}
        <div className="col-span-12 lg:col-span-5">
          <div className="bg-white p-6 rounded-2xl">
            <h2 className="text-2xl font-bold mb-4">Health Insights</h2>
            <p className="text-gray-600 mb-6">
              Review your health insights and select a widget to keep on your dashboard.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {healthMetrics.map(metric => (
                <div key={metric.id} className="bg-blue-600 p-4 rounded-xl text-white relative">
                  {metric.added ? (
                    <span className="absolute top-2 right-2 text-xs bg-white text-blue-600 px-2 py-1 rounded-full">
                      <CheckCircle className="h-3 w-3" />
                    </span>
                  ) : (
                    <button 
                      onClick={() => addWidget(metric.id)}
                      className="absolute top-2 right-2 p-1 hover:bg-blue-500 rounded-full"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                  <div className="mt-2">
                    <div className="mb-3">
                      {metric.icon}
                    </div>
                    <h3 className="text-sm font-medium mb-2">{metric.title}</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{metric.value}</span>
                      {metric.trend === 'up' ? (
                        <ArrowUp className="w-4 h-4" />
                      ) : (
                        <ArrowDown className="w-4 h-4" />
                      )}
                    </div>
                    <p className="text-sm mt-1 text-blue-100">{metric.period}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}