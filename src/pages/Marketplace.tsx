import { Store, Tag, Users, Clock, DollarSign, ArrowUpRight, BarChart } from 'lucide-react';
import { useState, useEffect } from 'react';
import MarketplaceItemModal from '../components/MarketplaceItemModal';
import ListDataModal from '../components/ListDataModal';
import { api } from '../services/api';

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  partners: number;
  duration: string;
  image: string;
  seller?: string;
  isOwnData?: boolean;
}

// Note: This is a mock implementation since there are no direct marketplace endpoints in your API list
// We'll simulate it using contracts and other available endpoints

export default function Marketplace() {
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [view, setView] = useState<'buying' | 'selling'>('buying');
  const [myListings, setMyListings] = useState<MarketplaceItem[]>([]);
  const [earnings, setEarnings] = useState(0);

  // Fetch marketplace items
  useEffect(() => {
    const fetchMarketplaceItems = async () => {
      try {
        setLoading(true);
        
        // We'll combine data from contracts and companies to simulate marketplace items
        const contractsResponse = await api.get<{ contracts: any[] }>('contracts');
        const companiesResponse = await api.post<{ companies: any[] }>('list', {});
        
        // Create marketplace items based on available contracts and companies
        const mappedItems: MarketplaceItem[] = [];
        const userItems: MarketplaceItem[] = [];
        
        // Map contracts to marketplace items
        contractsResponse.contracts.forEach(contract => {
          const company = companiesResponse.companies.find(c => c.id === contract.companyId);
          
          if (company) {
            const isOwnContract = Math.random() < 0.3; // Simulate some contracts being user's own listings
            const item = {
              id: contract.id,
              title: contract.title || 'Data Package',
              description: contract.description || 'No description available',
              price: Math.floor(Math.random() * 50) + 20, // Random price between 20-70
              category: company.type || 'Health Analytics',
              partners: Math.floor(Math.random() * 5) + 1, // Random partner count
              duration: ['1 month', '3 months', '6 months', '1 year'][Math.floor(Math.random() * 4)], // Random duration
              image: `https://source.unsplash.com/random/400x300/?${company.type || 'health'}`,
              seller: isOwnContract ? 'You' : company.name,
              isOwnData: isOwnContract
            };
            
            mappedItems.push(item);
            
            if (isOwnContract) {
              userItems.push(item);
            }
          }
        });
        
        // Extract unique categories
        const allCategories = Array.from(new Set(mappedItems.map(item => item.category)));
        setCategories(allCategories);
        
        // Calculate mock earnings from user listings
        const totalEarnings = userItems.reduce((sum, item) => sum + item.price, 0);
        setEarnings(totalEarnings);
        
        setItems(mappedItems);
        setMyListings(userItems);
      } catch (err) {
        console.error('Error fetching marketplace items:', err);
        setError('Failed to load marketplace items');
        
        // Fallback to sample items for demo purposes
        const sampleItems = [
          {
            id: '1',
            title: 'Health Analytics Premium',
            description: 'Comprehensive health analytics including vitals, fitness metrics, and wellness trends',
            price: 45,
            category: 'Health Analytics',
            partners: 5,
            duration: '3 months',
            image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=400',
            seller: 'HealthTech Inc'
          },
          {
            id: '2',
            title: 'Fitness Performance Bundle',
            description: 'Track and analyze your fitness performance, workouts, and progress metrics',
            price: 35,
            category: 'Fitness',
            partners: 3,
            duration: '1 month',
            image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=400',
            seller: 'FitMetrics'
          },
          {
            id: '3',
            title: 'Medical Research Dataset',
            description: 'Anonymized medical research data for healthcare professionals and researchers',
            price: 75,
            category: 'Research',
            partners: 7,
            duration: '6 months',
            image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=400',
            seller: 'MedResearch Labs'
          },
        ];
        
        // Add some user's own listings
        const userSampleItems = [
          {
            id: '4',
            title: 'My Fitness Journey Data',
            description: 'One year of fitness tracking, nutrition, and wellness metrics from my personal journey',
            price: 40,
            category: 'Fitness',
            partners: 2,
            duration: '1 year',
            image: 'https://images.unsplash.com/photo-1593164842264-854604db2260?auto=format&fit=crop&q=80&w=400',
            seller: 'You',
            isOwnData: true
          },
          {
            id: '5',
            title: 'Sleep Pattern Analysis',
            description: 'Six months of sleep tracking data including duration, quality, and patterns',
            price: 25,
            category: 'Wellness',
            partners: 1,
            duration: '6 months',
            image: 'https://images.unsplash.com/photo-1493655161922-ef98929de9d8?auto=format&fit=crop&q=80&w=400',
            seller: 'You',
            isOwnData: true
          },
        ];
        
        setItems([...sampleItems, ...userSampleItems]);
        setMyListings(userSampleItems);
        setEarnings(userSampleItems.reduce((sum, item) => sum + item.price, 0));
        
        // Extract unique categories from fallback data
        const fallbackCategories = ['Health Analytics', 'Fitness', 'Research', 'Wellness'];
        setCategories(fallbackCategories);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketplaceItems();
  }, []);

  // Handle purchasing an item
  const handlePurchase = async (itemId: string) => {
    try {
      setLoading(true);
      
      // Since there's no direct marketplace purchase endpoint, we'll simulate it by accepting a contract
      await api.post('accept-contract', { contractId: itemId });
      
      alert('Purchase successful! You now have access to this data.');
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error purchasing item:', err);
      alert('Failed to complete purchase. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle listing new data
  const handleListData = async (data: {
    title: string;
    description: string;
    price: number;
    category: string;
    duration: string;
    image: string;
  }) => {
    try {
      setLoading(true);
      
      // Since there's no direct "list data" endpoint, we'll simulate it by creating a contract proposal
      const contractData = {
        title: data.title,
        description: data.description,
        type: data.category,
        duration: data.duration,
        price: data.price,
      };
      
      await api.post('dispatch-contract-proposal', contractData);
      
      // Create a new marketplace item
      const newItem: MarketplaceItem = {
        id: Math.random().toString(36).substr(2, 9),
        title: data.title,
        description: data.description,
        price: data.price,
        category: data.category,
        partners: 0,
        duration: data.duration,
        image: data.image || `https://source.unsplash.com/random/400x300/?${data.category.toLowerCase()}`,
        seller: 'You',
        isOwnData: true
      };

      // Update items and my listings
      setItems(prev => [newItem, ...prev]);
      setMyListings(prev => [newItem, ...prev]);
      setEarnings(prev => prev + data.price);
      
      setIsListModalOpen(false);
    } catch (err) {
      console.error('Error listing data:', err);
      alert('Failed to list your data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Remove a listing (for my own data)
  const handleRemoveListing = (itemId: string) => {
    const item = myListings.find(item => item.id === itemId);
    if (!item) return;
    
    // Remove from both lists
    setItems(prev => prev.filter(item => item.id !== itemId));
    setMyListings(prev => prev.filter(item => item.id !== itemId));
    
    // Subtract from earnings
    setEarnings(prev => prev - item.price);
  };

  // Filter items by category and exclude own listings in buying view
  const filteredItems = selectedCategory === 'All Categories' 
    ? (view === 'buying' ? items.filter(item => !item.isOwnData) : myListings)
    : (view === 'buying' 
        ? items.filter(item => item.category === selectedCategory && !item.isOwnData)
        : myListings.filter(item => item.category === selectedCategory)
      );

  // Show loading state
  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading marketplace items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Data Marketplace</h1>
        <div className="flex space-x-4">
          <select 
            className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={view === 'selling' && myListings.length === 0}
          >
            <option>All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <button 
            onClick={() => setIsListModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            List Your Data
          </button>
        </div>
      </div>

      {/* Tabs for Buy/Sell views */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setView('buying')}
          className={`px-4 py-2 text-sm font-medium ${
            view === 'buying'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Buy Data
        </button>
        <button
          onClick={() => setView('selling')}
          className={`px-4 py-2 text-sm font-medium ${
            view === 'selling'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          My Data Listings
        </button>
      </div>

      {/* Selling View Dashboard */}
      {view === 'selling' && (
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Your Data Earnings</h2>
              <p className="text-gray-600">Manage your data listings and track your earnings</p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">Total Earnings</div>
                <div className="text-2xl font-bold text-blue-600">${earnings}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">Active Listings</div>
                <div className="text-2xl font-bold">{myListings.length}</div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="text-sm font-medium">Quick Actions:</span>
            <button 
              onClick={() => setIsListModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              <ArrowUpRight className="h-4 w-4" />
              Add New Listing
            </button>
            <button className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200">
              <BarChart className="h-4 w-4" />
              View Analytics
            </button>
            <button className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200">
              <DollarSign className="h-4 w-4" />
              Payment Settings
            </button>
          </div>
        </div>
      )}

      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          {view === 'buying' ? (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No items available</h3>
              <p className="text-gray-500">There are no items in this category. Be the first to list your data.</p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No listings yet</h3>
              <p className="text-gray-500 mb-4">You haven't listed any data packages yet. Start sharing your valuable data and earn income.</p>
              <button 
                onClick={() => setIsListModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                List Your Data
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all"
            >
              <div className="relative h-48">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback if image fails to load
                    e.currentTarget.src = '/placeholder-image.jpg';
                  }}
                />
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-black/75 text-white">
                    ${item.price}
                  </span>
                </div>
                {item.isOwnData && (
                  <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
                      Your Listing
                    </span>
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {item.category}
                  </span>
                </div>

                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{item.description}</p>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>{item.partners} Partners</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>{item.duration}</span>
                  </div>
                </div>

                {item.seller && (
                  <div className="text-sm text-gray-500 mb-4">
                    Seller: <span className="font-medium">{item.seller}</span>
                  </div>
                )}

                {item.isOwnData ? (
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleRemoveListing(item.id)}
                      className="w-full border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Remove Listing
                    </button>
                    <button 
                      className="w-full border border-blue-300 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      Edit Details
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      setSelectedItem(item);
                      setIsModalOpen(true);
                    }}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Purchase Access
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {selectedItem && (
        <MarketplaceItemModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          item={selectedItem}
          onPurchase={handlePurchase}
        />
      )}
      <ListDataModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        onSubmit={handleListData}
      />
    </div>
  );
}