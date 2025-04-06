import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Company } from '../../types';
import { AlertCircle } from 'lucide-react';

const CompaniesPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const response = await api.post<{ companies: Company[] }>('list', {});
        setCompanies(response.companies);
      } catch (err) {
        setError('Failed to load companies');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  // Enhanced loading state with spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading companies...</p>
        </div>
      </div>
    );
  }

  // Enhanced error state with icon and retry button
  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-900 mb-2">Error</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Companies</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl shadow-sm p-6 text-center">
            <p className="text-gray-500">No companies found.</p>
          </div>
        ) : (
          companies.map((company) => (
            <div key={company.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                {company.logo ? (
                  <img 
                    src={company.logo} 
                    alt={`${company.name} logo`} 
                    className="w-12 h-12 mr-4 rounded-lg object-contain"
                    onError={(e) => {
                      // Fallback if image fails to load
                      e.currentTarget.src = '/company-placeholder.svg';
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 mr-4 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                    {company.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <h3 className="text-lg font-semibold">{company.name}</h3>
              </div>
              
              {company.description && (
                <p className="text-gray-600 mb-4 line-clamp-2">{company.description}</p>
              )}
              
              {company.website && (
                <a 
                  href={company.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 text-sm inline-flex items-center"
                >
                  Visit Website
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CompaniesPage;