import { useState } from 'react';
import { X, Users, Clock, Tag, Shield, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface MarketplaceItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    partners: number;
    duration: string;
    image: string;
  };
  onPurchase: (itemId: string) => void;
}

export default function MarketplaceItemModal({ isOpen, onClose, item, onPurchase }: MarketplaceItemModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  
  if (!isOpen) return null;

  const handlePurchase = async () => {
    setError(null);
    setLoading(true);
    
    try {
      // In a real implementation, we would call an API endpoint to purchase the item
      // Since there's no direct marketplace purchase endpoint in your API list,
      // we'll use the accept-contract endpoint as a proxy
      
      await api.post('accept-contract', { 
        contractId: item.id
      });
      
      // Set success state
      setPurchaseSuccess(true);
      
      // Call the onPurchase callback
      onPurchase(item.id);
      
      // Close the modal after a short delay to show success state
      setTimeout(() => {
        onClose();
        setPurchaseSuccess(false);
      }, 1500);
      
    } catch (err) {
      console.error('Error purchasing item:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to complete purchase. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      <div className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg bg-white rounded-xl shadow-xl z-50 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold">{item.title}</h2>
            <p className="text-sm text-gray-600">{item.category}</p>
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

        <div className="p-6 overflow-y-auto">
          <div className="space-y-6">
            <div className="relative">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-48 object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-image.jpg';
                }}
              />
              <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-sm font-medium px-2 py-1 rounded">
                ${item.price}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Description</h3>
              <p className="text-gray-600">{item.description}</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <Tag className="h-5 w-5 mx-auto text-blue-600 mb-2" />
                <div className="text-lg font-semibold">${item.price}</div>
                <div className="text-sm text-gray-500">Price</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <Users className="h-5 w-5 mx-auto text-blue-600 mb-2" />
                <div className="text-lg font-semibold">{item.partners}</div>
                <div className="text-sm text-gray-500">Partners</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <Clock className="h-5 w-5 mx-auto text-blue-600 mb-2" />
                <div className="text-lg font-semibold">{item.duration}</div>
                <div className="text-sm text-gray-500">Duration</div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Health Data Package Includes:</h3>
              <ul className="space-y-2 text-sm text-blue-700">
                <li>• HIPAA-compliant data access</li>
                <li>• Secure data transmission protocols</li>
                <li>• Healthcare analytics dashboard</li>
                <li>• Compliance documentation</li>
                <li>• Expert medical support</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium mb-2">Terms & Conditions</h3>
              <p className="text-sm text-gray-600">
                By purchasing this health data package, you agree to comply with HIPAA regulations
                and our healthcare data sharing policies. Subscription will automatically renew
                unless cancelled. All data usage must follow medical privacy guidelines.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">Total Price</p>
              <p className="text-2xl font-bold">${item.price}</p>
            </div>
            <button
              onClick={handlePurchase}
              disabled={loading || purchaseSuccess}
              className={`px-6 py-3 ${
                purchaseSuccess 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white rounded-lg transition-colors flex items-center ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processing...
                </>
              ) : purchaseSuccess ? (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Purchase Complete
                </>
              ) : (
                'Complete Purchase'
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center">
            Secure payment processing. Cancel anytime.
          </p>
        </div>
      </div>
    </>
  );
}