import { ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface DataElement {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  lastUpdated: string;
}

interface CategoryData {
  id: string;
  name: string;
  description: string;
  sections: {
    id: string;
    title: string;
    elements: DataElement[];
  }[];
}

interface Section {
  id: string;
  title: string;
  isOpen?: boolean;
}

// Default categories for fallback
const defaultCategories: CategoryData[] = [
  {
    id: 'general',
    name: 'General',
    description: 'Basic personal and demographic information',
    sections: [
      {
        id: 'personal',
        title: 'Personal Information',
        elements: [
          {
            id: '1',
            name: 'Full Name',
            description: 'Rachel Cash',
            status: 'active',
            lastUpdated: '2024-02-20'
          },
          {
            id: '2',
            name: 'Date of Birth',
            description: '1988-05-15 (36 years old)',
            status: 'active',
            lastUpdated: '2024-02-20'
          }
        ]
      },
      {
        id: 'contact',
        title: 'Contact Information',
        elements: [
          {
            id: '3',
            name: 'Email Address',
            description: 'rachel.cash@example.com',
            status: 'active',
            lastUpdated: '2024-02-20'
          },
          {
            id: '4',
            name: 'Phone Number',
            description: '(555) 123-4567',
            status: 'active',
            lastUpdated: '2024-02-20'
          }
        ]
      }
    ]
  },
  {
    id: 'medical',
    name: 'Medical Files',
    description: 'Summary information for received medical files',
    sections: [
      {
        id: 'medical-history',
        title: 'Medical History',
        elements: [
          {
            id: 'mh1',
            name: 'Medical History Summary',
            description: 'Rachel Cash, 36 years old female, has a history of hypertension and asthma.',
            status: 'active',
            lastUpdated: '2024-02-20'
          }
        ]
      },
      {
        id: 'prescription-history',
        title: 'Prescription History',
        elements: [
          {
            id: 'ph1',
            name: 'Prescription History Summary',
            description: 'Rachel Cash is currently prescribed Lisinopril for hypertension and Albuterol for asthma.',
            status: 'active',
            lastUpdated: '2024-02-20'
          }
        ]
      },
      {
        id: 'immunization-records',
        title: 'Immunization Records',
        elements: [
          {
            id: 'ir1',
            name: 'Immunization Records Summary',
            description: 'Rachel Cash has received all recommended immunizations, including the flu vaccine and COVID-19 vaccine.',
            status: 'active',
            lastUpdated: '2024-02-20'
          }
        ]
      },
      {
        id: 'lab-results',
        title: 'Lab Results',
        elements: [
          {
            id: 'lr1',
            name: 'Lab Results Summary',
            description: 'Recent lab results for Rachel Cash show normal blood glucose levels and slightly elevated cholesterol.',
            status: 'active',
            lastUpdated: '2024-02-20'
          }
        ]
      },
      {
        id: 'vital-signs-history',
        title: 'Vital Signs History',
        elements: [
          {
            id: 'vsh1',
            name: 'Vital Signs History Summary',
            description: 'Rachel Cash\'s vital signs are stable with a blood pressure of 120/80 mmHg and a heart rate of 72 bpm.',
            status: 'active',
            lastUpdated: '2024-02-20'
          }
        ]
      }
    ]
  }
];

export default function DataElements() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const activeData = categories.find(cat => cat.id === activeCategory);

  // Fetch data elements from the API
  useEffect(() => {
    const fetchDataElements = async () => {
      try {
        setLoading(true);
        
        // Get the list of data element categories
        const piNameResponse = await api.get<any[]>('get-pinamelist');
        
        // Get all available data elements
        const elementsResponse = await api.get<any[]>('elements');
        
        // Get user's data elements
        const userDataElementsResponse = await api.post<{ userDataElements: any[] }>('user-dataelement-list', {});
        
        // Process and organize the data elements into categories and sections
        const processedCategories: CategoryData[] = [];
        
        // Map API response to our data structure
        if (Array.isArray(piNameResponse)) {
          for (const category of piNameResponse) {
            const categoryElements = elementsResponse.filter(elem => elem.pi_name_id === category.id);
            
            // Group elements by section
            const sectionMap = new Map<string, DataElement[]>();
            
            for (const element of categoryElements) {
              const sectionTitle = element.section || 'General';
              if (!sectionMap.has(sectionTitle)) {
                sectionMap.set(sectionTitle, []);
              }
              
              // Check if user has this data element
              const userElement = userDataElementsResponse.userDataElements.find(
                userElem => userElem.dataElementId === element.id
              );
              
              // Add element to the section
              sectionMap.get(sectionTitle)?.push({
                id: element.id,
                name: element.name,
                description: element.description || 'No description available',
                status: userElement ? 'active' : 'inactive',
                lastUpdated: userElement?.updated_at || new Date().toISOString()
              });
            }
            
            // Create sections from the map
            const sections = Array.from(sectionMap.entries()).map(([title, elements]) => ({
              id: title.toLowerCase().replace(/\s+/g, '-'),
              title,
              elements
            }));
            
            // Add category if it has sections with elements
            if (sections.length > 0) {
              processedCategories.push({
                id: category.id,
                name: category.name,
                description: category.description || `${category.name} data elements`,
                sections
              });
            }
          }
        }
        
        // Set categories and default active category
        if (processedCategories.length > 0) {
          setCategories(processedCategories);
          setActiveCategory(processedCategories[0].id);
        } else {
          // Fallback to default categories if no data
          setCategories(defaultCategories);
          setActiveCategory('general');
        }
      } catch (err) {
        console.error('Error fetching data elements:', err);
        setError('Failed to load data elements');
        
        // Fallback to default categories
        setCategories(defaultCategories);
        setActiveCategory('general');
      } finally {
        setLoading(false);
      }
    };

    fetchDataElements();
  }, []);

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Show loading state
  if (loading && categories.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <span>Dashboard</span>
          <span>›</span>
          <span>Your Data Elements</span>
        </div>
        <h1 className="text-4xl font-bold mb-8">Your Data Elements</h1>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading data elements...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && categories.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <span>Dashboard</span>
          <span>›</span>
          <span>Your Data Elements</span>
        </div>
        <h1 className="text-4xl font-bold mb-8">Your Data Elements</h1>
        <div className="flex items-center justify-center h-64">
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
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <span>Dashboard</span>
        <span>›</span>
        <span>Your Data Elements</span>
      </div>

      <h1 className="text-4xl font-bold mb-8">Your Data Elements</h1>

      {/* Category Tabs */}
      <div className="flex overflow-x-auto space-x-8 border-b border-gray-200 mb-8 pb-1">
        {categories.map(category => (
          <button
            key={category.id}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
              activeCategory === category.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveCategory(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Collapsible Sections */}
      {activeData && (
        <div className="space-y-6">
          <div className="bg-blue-50 p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-blue-900 mb-2">{activeData.name}</h2>
            <p className="text-blue-700">{activeData.description}</p>
          </div>

          {activeData.sections.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <p className="text-gray-500">No data elements found in this category.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeData.sections.map(section => (
                <div key={section.id} className="bg-white rounded-xl overflow-hidden">
                  <button
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                    onClick={() => toggleSection(section.id)}
                  >
                    <span className="text-lg font-medium">{section.title}</span>
                    <ChevronUp
                      className={`w-5 h-5 text-gray-500 transition-transform ${
                        openSections.has(section.id) ? '' : 'transform rotate-180'
                      }`}
                    />
                  </button>
                  {openSections.has(section.id) && (
                    <div className="px-6 py-4 border-t border-gray-100">
                      <div className="space-y-4">
                        {section.elements.length === 0 ? (
                          <p className="text-center text-gray-500 py-4">No elements found in this section.</p>
                        ) : (
                          section.elements.map(element => (
                            <div key={element.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div>
                                <h3 className="font-medium">{element.name}</h3>
                                <p className="text-sm text-gray-600">{element.description}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-500">
                                  Updated: {new Date(element.lastUpdated).toLocaleDateString()}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  element.status === 'active' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {element.status}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}