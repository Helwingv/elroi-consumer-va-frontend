import { useState } from 'react';
import { X } from 'lucide-react';

interface AddProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (provider: {
    name: string;
    category: string;
    dataTypes: string[];
  }) => void;
}

// Categories for the dropdown selection
const categories = [
  'Healthcare',
  'Hospital',
  'Clinic',
  'Pharmacy',
  'Fitness',
  'Research',
  'Insurance'
];

// Data types for the checkboxes
const dataTypes = [
  'Medical Records',
  'Lab Results',
  'Prescriptions',
  'Insurance Claims',
  'Vital Signs',
  'Fitness Metrics',
  'Nutrition Data',
  'Mental Health Records',
  'Vaccination History'
];

export default function AddProviderModal({ isOpen, onClose, onAdd }: AddProviderModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const name = formData.get('name') as string;
    const category = formData.get('category') as string;
    const selectedDataTypes = dataTypes.filter(type => 
      formData.get(`dataType-${type}`) === 'on'
    );

    try {
      // Call the onAdd callback to handle the provider addition
      await onAdd({
        name,
        category,
        dataTypes: selectedDataTypes
      });
      
      // Form reset and closure are handled by the parent component after onAdd
    } catch (err) {
      console.error('Error submitting provider:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to add provider. Please try again.');
      }
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
          <h2 className="text-xl font-semibold">Add New Provider</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={loading}
            type="button"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Provider Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter provider name"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                name="category"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Types
              </label>
              <div className="space-y-2">
                {dataTypes.map(type => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      name={`dataType-${type}`}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={loading}
                    />
                    <span className="ml-2 text-sm text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
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
              {loading ? 'Adding...' : 'Add Provider'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}