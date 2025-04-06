import { X, Calendar, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface AppointmentBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBook: (appointment: {
    date: string;
    time: string;
    type: string;
    provider: string;
  }) => void;
}

// Default appointment types
const defaultAppointmentTypes = [
  'Annual Check-up',
  'Follow-up Visit',
  'Blood Pressure Check',
  'Lab Work',
  'Vaccination',
  'Consultation'
];

// Default providers list
const defaultProviders = [
  'Dr. Johnson - Primary Care',
  'Dr. Smith - Cardiology',
  'Dr. Chen - Internal Medicine',
  'Dr. Patel - Family Medicine'
];

// Generate time slots from 9 AM to 5 PM in 30-minute intervals
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 9; hour <= 17; hour++) {
    for (let minute of ['00', '30']) {
      const time = `${hour.toString().padStart(2, '0')}:${minute}`;
      slots.push(time);
    }
  }
  return slots;
};

export default function AppointmentBookingModal({ isOpen, onClose, onBook }: AppointmentBookingModalProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appointmentTypes, setAppointmentTypes] = useState(defaultAppointmentTypes);
  const [providers, setProviders] = useState(defaultProviders);
  const timeSlots = generateTimeSlots();

  // Fetch providers and appointment types when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchProviders();
    }
  }, [isOpen]);

  // Fetch available providers from the API
  const fetchProviders = async () => {
    try {
      setLoading(true);
      
      // Get companies to use as providers
      const response = await api.post<{ companies: any[] }>('company/list', {});
      
      if (response.companies && response.companies.length > 0) {
        // Map company data to provider format
        const mappedProviders = response.companies
          .filter(company => company.active)
          .map(company => `${company.name} - Healthcare Provider`);
        
        // If we found providers, use them
        if (mappedProviders.length > 0) {
          setProviders(mappedProviders);
        }
      }
      
      // Here we could also fetch appointment types from an API endpoint if available
      // For now, we'll keep using the default types
      
    } catch (err) {
      console.error('Error fetching providers:', err);
      // We'll keep using the default providers if API fails
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const appointmentData = {
      date: formData.get('date') as string,
      time: formData.get('time') as string,
      type: formData.get('type') as string,
      provider: formData.get('provider') as string
    };
    
    try {
      // In a real implementation, we would call an API endpoint to book the appointment
      // Since there's no direct appointment booking endpoint in your API list,
      // we'll simulate it by creating a contract proposal
      
      // Extract provider name from the selected option (removing the specialty part)
      const providerName = appointmentData.provider.split(' - ')[0];
      
      // Create a contract proposal as a way to "book" an appointment
      await api.post('dispatch-contract-proposal', {
        title: `Appointment: ${appointmentData.type}`,
        description: `Scheduled for ${appointmentData.date} at ${appointmentData.time} with ${providerName}`,
        type: 'Appointment',
        appointmentDate: `${appointmentData.date}T${appointmentData.time}:00`,
        providerName: providerName
      });
      
      // Call the onBook callback with the appointment data
      onBook(appointmentData);
      
      // Reset form and close modal
      form.reset();
      onClose();
    } catch (err) {
      console.error('Error booking appointment:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to book appointment. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      <div className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg bg-white rounded-xl shadow-xl z-50 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold">Book an Appointment</h2>
            <p className="text-sm text-gray-600">Schedule your next visit</p>
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
          <div className="mx-6 mt-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}

        {loading && !error && (
          <div className="mx-6 mt-4 px-4 py-3 bg-blue-50 border border-blue-200 text-blue-600 rounded-md text-sm flex items-center">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
            Loading providers...
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Appointment Type
              </label>
              <select
                id="type"
                name="type"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="">Select appointment type</option>
                {appointmentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-2">
                Healthcare Provider
              </label>
              <select
                id="provider"
                name="provider"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="">Select provider</option>
                {providers.map(provider => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline-block w-4 h-4 mr-1" />
                Preferred Date
              </label>
              <input
                type="date"
                id="date"
                name="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline-block w-4 h-4 mr-1" />
                Preferred Time
              </label>
              <select
                id="time"
                name="time"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="">Select time slot</option>
                {timeSlots.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Important Information:</h3>
              <ul className="space-y-2 text-sm text-blue-700">
                <li>• Please arrive 15 minutes before your appointment</li>
                <li>• Bring your insurance card and ID</li>
                <li>• Wear a mask during your visit</li>
                <li>• Cancel or reschedule at least 24 hours in advance</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 bg-blue-600 text-white rounded-lg ${
                loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
              } transition-colors`}
              disabled={loading}
            >
              {loading ? 'Booking...' : 'Book Appointment'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}