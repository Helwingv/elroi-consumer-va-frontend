import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

interface EventData {
  date: string;
  title: string;
  type: string;
}

export default function Calendar({ selectedDate, onDateSelect }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Constants for calendar generation
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();
  
  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Fetch events when the month changes
  useEffect(() => {
    fetchEvents();
  }, [currentMonth]);

  // Fetch events from API
  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      // Get contracts to use as calendar events
      // Using contracts since there's no dedicated calendar events endpoint
      const contractsResponse = await api.get<{ contracts: any[] }>('contracts');
      
      if (contractsResponse.contracts && Array.isArray(contractsResponse.contracts)) {
        // Filter contracts for the current month
        const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        
        // Map contracts to event data
        const mappedEvents: EventData[] = [];
        
        for (const contract of contractsResponse.contracts) {
          // Try to extract a date from the contract
          const contractDate = contract.startDate || contract.created_at || null;
          
          if (contractDate) {
            const date = new Date(contractDate);
            
            // Check if date is in current month
            if (date >= monthStart && date <= monthEnd) {
              mappedEvents.push({
                date: date.toISOString().split('T')[0], // YYYY-MM-DD format
                title: contract.title || 'Contract',
                type: contract.type || 'Event'
              });
            }
          }
        }
        
        setEvents(mappedEvents);
      }
    } catch (err) {
      console.error('Error fetching calendar events:', err);
      // Keep empty events if API fails
    } finally {
      setLoading(false);
    }
  };

  // Navigate to previous or next month
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Check if a date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // Check if a date is selected
  const isSelected = (date: Date) => {
    return date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear();
  };

  // Check if a date has events
  const hasEvents = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    return events.some(event => event.date === dateString);
  };

  // Generate days for the calendar grid
  const generateDays = () => {
    const days = [];
    const previousMonthDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    
    // Previous month days
    for (let i = previousMonthDays; i > 0; i--) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), -i + 1);
      days.push({ date, isCurrentMonth: false });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
      days.push({ date, isCurrentMonth: true });
    }
    
    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, i);
      days.push({ date, isCurrentMonth: false });
    }
    
    return days;
  };

  return (
    <div className="bg-white rounded-2xl p-6 relative">
      {loading && (
        <div className="absolute top-2 right-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-100 rounded-full"
          type="button"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h2 className="text-lg font-semibold">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-100 rounded-full"
          type="button"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
          <div key={day} className="text-center text-sm text-gray-500">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {generateDays().map(({ date, isCurrentMonth }, index) => (
          <button
            key={index}
            onClick={() => onDateSelect(date)}
            type="button"
            className={`
              p-2 rounded-lg text-center relative
              ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
              ${isSelected(date) ? 'bg-blue-600 text-white' : ''}
              ${isToday(date) && !isSelected(date) ? 'bg-blue-100 text-blue-600' : ''}
              ${!isSelected(date) ? 'hover:bg-gray-100' : ''}
            `}
          >
            {date.getDate()}
            {hasEvents(date) && !isSelected(date) && (
              <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></span>
            )}
            {hasEvents(date) && isSelected(date) && (
              <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></span>
            )}
          </button>
        ))}
      </div>
      
      {events.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Events this month:</h3>
          <div className="space-y-1">
            {events.map((event, index) => (
              <div key={index} className="text-xs flex items-start">
                <div className="text-blue-600 mr-1">•</div>
                <div>
                  <span className="font-medium">{new Date(event.date).toLocaleDateString()}</span>: {event.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}