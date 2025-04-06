import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MessageSquare, Calendar, Trophy, AlertCircle, BellRing, CheckCircle, Loader } from 'lucide-react';
import { api } from '../services/api';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'alert';
  icon: 'message' | 'calendar' | 'trophy' | 'alert';
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Helper to get an icon component based on the notification type
const getNotificationIcon = (icon: string) => {
  switch (icon) {
    case 'message':
      return <MessageSquare className="h-5 w-5 text-blue-600" />;
    case 'calendar':
      return <Calendar className="h-5 w-5 text-yellow-600" />;
    case 'trophy':
      return <Trophy className="h-5 w-5 text-green-600" />;
    case 'alert':
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    default:
      return <BellRing className="h-5 w-5 text-gray-600" />;
  }
};

// Helper to format relative time (e.g., "5 minutes ago")
const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMilliseconds = now.getTime() - date.getTime();
  
  // Convert to seconds
  const diffInSeconds = Math.floor(diffInMilliseconds / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  // Convert to minutes
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  // Convert to hours
  const diffInHours = Math.floor(diffInMinutes / 60);
  
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  // Convert to days
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInDays < 30) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }
  
  // For older dates, just return the formatted date
  return date.toLocaleDateString();
};

// Default notifications in case API fails
const defaultNotifications: Notification[] = [
  {
    id: '1',
    title: 'New Message',
    message: 'Dr. Johnson has sent you a new message regarding your recent lab results.',
    time: '5 minutes ago',
    read: false,
    type: 'info',
    icon: 'message'
  },
  {
    id: '2',
    title: 'Appointment Reminder',
    message: 'Your appointment with Dr. Smith is tomorrow at 2:00 PM.',
    time: '1 hour ago',
    read: false,
    type: 'warning',
    icon: 'calendar'
  },
  {
    id: '3',
    title: 'Health Goal Achieved',
    message: "Congratulations! You've reached your daily step goal.",
    time: '2 hours ago',
    read: true,
    type: 'success',
    icon: 'trophy'
  }
];

export default function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch notifications when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // We'll use contracts and their updates as "notifications" since there's no dedicated notifications endpoint
      const contractsResponse = await api.get<{ contracts: any[] }>('contracts');
      
      if (contractsResponse.contracts && Array.isArray(contractsResponse.contracts)) {
        // Convert contracts to notifications format
        const mappedNotifications: Notification[] = [];
        
        for (const contract of contractsResponse.contracts) {
          // Determine notification type based on contract status
          let type: 'info' | 'warning' | 'success' | 'alert' = 'info';
          let icon: 'message' | 'calendar' | 'trophy' | 'alert' = 'message';
          
          if (contract.status === 'pending') {
            type = 'warning';
            icon = 'alert';
          } else if (contract.status === 'active') {
            type = 'success';
            icon = 'trophy';
          } else if (contract.type === 'appointment') {
            type = 'info';
            icon = 'calendar';
          }
          
          mappedNotifications.push({
            id: contract.id,
            title: contract.title || 'Contract Update',
            message: contract.description || 'You have a contract update to review.',
            time: getRelativeTime(contract.updated_at || contract.created_at || new Date().toISOString()),
            read: false, // Assume unread by default
            type,
            icon
          });
        }
        
        // Set notifications if we have any, otherwise use defaults
        if (mappedNotifications.length > 0) {
          setNotifications(mappedNotifications);
        } else {
          setNotifications(defaultNotifications);
        }
      } else {
        // Fallback to default notifications
        setNotifications(defaultNotifications);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
      setNotifications(defaultNotifications);
    } finally {
      setLoading(false);
    }
  };

  // Mark a notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      // Update local state immediately for better UX
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      // In a real implementation, you would call an API endpoint to mark the notification as read
      // Since there's no direct endpoint for this, we won't make an actual API call here
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // View all notifications
  const handleViewAll = () => {
    onClose();
    navigate('/notifications');
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity z-40"
        onClick={onClose}
      />
      <div className="fixed right-4 top-16 w-96 bg-white rounded-xl shadow-xl z-50 max-h-[calc(100vh-5rem)] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Notifications</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            type="button"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="p-8 flex justify-center items-center">
              <div className="flex flex-col items-center">
                <Loader className="h-6 w-6 text-blue-600 animate-spin" />
                <span className="mt-2 text-sm text-gray-500">Loading notifications...</span>
              </div>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-600">
              <AlertCircle className="h-6 w-6 mx-auto mb-2" />
              {error}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No notifications
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50' : ''
                  } cursor-pointer`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-4">
                    {getNotificationIcon(notification.icon)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg text-gray-900">{notification.title}</h3>
                        {!notification.read && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={handleViewAll}
            className="w-full flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            type="button"
          >
            <CheckCircle className="h-4 w-4" />
            View All Notifications
          </button>
        </div>
      </div>
    </>
  );
}