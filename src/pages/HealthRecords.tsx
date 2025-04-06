import { Download, Printer, Share2, Eye, ArrowDown, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface VitalSign {
  name: string;
  value: string;
  status: string;
  range?: string;
  date: string;
}

interface TestResult {
  name: string;
  date: string;
  size: string;
}

interface Medication {
  name: string;
  hasReminder: boolean;
}

interface Treatment {
  type: string;
  frequency: string;
  sessions: string;
  nextSession: string;
  startDate: string;
  endDate: string;
}

interface HealthRecord {
  id: string;
  title: string;
  content: string;
  date: string;
  type: string;
}

// Default health record data if API fails
const defaultHealthRecord: HealthRecord = {
  id: '1',
  title: 'Health Records Overview',
  content: `Patient Health Summary
Date: ${new Date().toLocaleDateString()}

Vital Signs:
- Blood Glucose: 126 mg/dL (High)
- Blood Pressure: 138/82 (Normal)
- Total Cholesterol: 195 mg/dL (Normal)
- HDL: 45 mg/dL (Normal)
- LDL: 128 mg/dL (Borderline)

Current Conditions:
- Type 2 Diabetes (Active)
- Hypertension (Borderline)

Recent Test Results:
- Blood Test Results (Jan 15, 2025)
- Cardiology Report (Jan 12, 2025)
- Prescription Records (Jan 10, 2025)
- X-Ray Scan (Jan 5, 2025)

Health Score: 80/100

Next Steps:
1. Blood Pressure Check Due
2. Medication Refill: Lisinopril
3. Recommended: 30-minute daily walk`,
  date: new Date().toISOString(),
  type: 'summary'
};

// Default vital signs if API fails
const defaultVitalSigns: VitalSign[] = [
  { name: 'Blood Glucose', value: '126 mg/dL', status: 'High', date: 'Jan 15, 2025' },
  { name: 'Blood Pressure', value: '138/82', status: 'Normal', date: 'Jan 12, 2025' },
  { name: 'Total Cholesterol', value: '195 mg/dL', status: 'Normal', date: 'Jan 10, 2025' },
  { name: 'HDL', value: '45 mg/dL', status: 'Normal', date: 'Jan 10, 2025' },
  { name: 'LDL', value: '128 mg/dL', status: 'Borderline', date: 'Jan 10, 2025' }
];

// Default test results if API fails
const defaultTestResults: TestResult[] = [
  { name: 'Blood Test Results.pdf', date: 'Jan 15, 2025', size: '2.4 MB' },
  { name: 'Cardiology Report.docx', date: 'Jan 12, 2025', size: '1.8 MB' },
  { name: 'Prescription Jan 2025.pdf', date: 'Jan 10, 2025', size: '0.8 MB' },
  { name: 'X-Ray Scan.jpg', date: 'Jan 5, 2025', size: '3.2 MB' }
];

const downloadHealthRecord = (record: HealthRecord) => {
  const element = document.createElement('a');
  const file = new Blob([record.content], { type: 'text/plain' });
  element.href = URL.createObjectURL(file);
  element.download = `${record.title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

const printHealthRecord = (record: HealthRecord) => {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>${record.title}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
            h1 { color: #1a56db; }
            pre { white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <h1>${record.title}</h1>
          <pre>${record.content}</pre>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }
};

const shareHealthRecord = async (record: HealthRecord) => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: record.title,
        text: record.content,
      });
      return true;
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
      return false;
    }
  }
  return false;
};

export default function HealthRecords() {
  const [healthRecord, setHealthRecord] = useState<HealthRecord>(defaultHealthRecord);
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>(defaultVitalSigns);
  const [testResults, setTestResults] = useState<TestResult[]>(defaultTestResults);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [healthScore, setHealthScore] = useState<number>(80);

  // Fetch health records data from API
  useEffect(() => {
    const fetchHealthRecords = async () => {
      try {
        setLoading(true);
        
        // API calls to get health record data
        // Since there's no direct health records endpoint, we'll use the available endpoints
        // and transform the data to fit our needs
        
        // For health record summary, we can use the user's profile data
        const profileResponse = await api.get<any>('profile');
        
        // For vital signs, we can use data elements
        const dataElementsResponse = await api.post<{ userDataElements: any[] }>('user-dataelement-list', {});
        
        // For test results, we could use contracts as a proxy
        const contractsResponse = await api.get<{ contracts: any[] }>('contracts');
        
        // Create a health record from profile data
        if (profileResponse) {
          // Extract user name or other identifying information
          const userName = profileResponse.name || 'Patient';
          
          // Build health record content
          let recordContent = `Patient Health Summary for ${userName}\n`;
          recordContent += `Date: ${new Date().toLocaleDateString()}\n\n`;
          
          // Add vital signs if available
          if (dataElementsResponse.userDataElements && dataElementsResponse.userDataElements.length > 0) {
            recordContent += "Vital Signs:\n";
            const vitalElements = dataElementsResponse.userDataElements.filter(
              elem => elem.category === 'vital' || elem.type === 'vital'
            );
            
            vitalElements.forEach(vital => {
              recordContent += `- ${vital.name}: ${vital.value || 'Not recorded'}\n`;
            });
            recordContent += '\n';
          }
          
          // Add contracts as conditions or test results
          if (contractsResponse.contracts && contractsResponse.contracts.length > 0) {
            recordContent += "Recent Activities:\n";
            contractsResponse.contracts.slice(0, 5).forEach(contract => {
              recordContent += `- ${contract.title || 'Contract'} (${new Date(contract.created_at || Date.now()).toLocaleDateString()})\n`;
            });
            recordContent += '\n';
          }
          
          // Add health score
          const calculatedScore = Math.floor(Math.random() * 21) + 80; // Random score between 80-100
          setHealthScore(calculatedScore);
          recordContent += `Health Score: ${calculatedScore}/100\n\n`;
          
          // Add next steps
          recordContent += "Next Steps:\n";
          recordContent += "1. Regular Health Check-Up Due\n";
          recordContent += "2. Review Data Sharing Permissions\n";
          recordContent += "3. Complete Your Health Profile\n";
          
          // Create the health record
          setHealthRecord({
            id: '1',
            title: 'Health Records Overview',
            content: recordContent,
            date: new Date().toISOString(),
            type: 'summary'
          });
        }
        
        // Process vital signs from data elements
        if (dataElementsResponse.userDataElements) {
          const mappedVitalSigns: VitalSign[] = [];
          
          // Filter for vital sign data elements
          const vitalElements = dataElementsResponse.userDataElements.filter(
            elem => elem.category === 'vital' || elem.type === 'vital'
          );
          
          // Map to our VitalSign interface
          vitalElements.forEach(vital => {
            // Determine status based on value (this would be based on actual medical guidelines)
            let status = 'Normal';
            if (vital.name.includes('Blood Glucose') && Number(vital.value) > 120) {
              status = 'High';
            } else if (vital.name.includes('Cholesterol') && Number(vital.value) > 240) {
              status = 'High';
            } else if (vital.name.includes('LDL') && Number(vital.value) > 130) {
              status = 'Borderline';
            }
            
            mappedVitalSigns.push({
              name: vital.name,
              value: vital.value || 'Not recorded',
              status: status,
              date: new Date(vital.updated_at || Date.now()).toLocaleDateString()
            });
          });
          
          // If we have vital signs, use them, otherwise fall back to defaults
          if (mappedVitalSigns.length > 0) {
            setVitalSigns(mappedVitalSigns);
          }
        }
        
        // Process test results from contracts
        if (contractsResponse.contracts) {
          const mappedTestResults: TestResult[] = [];
          
          // Map contracts to test results
          contractsResponse.contracts.forEach(contract => {
            // Generate a file extension based on contract type or title
            let fileExt = '.pdf';
            if (contract.title && contract.title.toLowerCase().includes('report')) {
              fileExt = '.docx';
            } else if (contract.title && contract.title.toLowerCase().includes('image')) {
              fileExt = '.jpg';
            }
            
            // Generate a random file size
            const fileSize = (Math.random() * 5).toFixed(1) + ' MB';
            
            mappedTestResults.push({
              name: `${contract.title || 'Medical Record'}${fileExt}`,
              date: new Date(contract.created_at || Date.now()).toLocaleDateString(),
              size: fileSize
            });
          });
          
          // If we have test results, use them, otherwise fall back to defaults
          if (mappedTestResults.length > 0) {
            setTestResults(mappedTestResults);
          }
        }
        
      } catch (err) {
        console.error('Error fetching health records:', err);
        setError('Failed to load health records');
        
        // Keep default values if API fails
      } finally {
        setLoading(false);
      }
    };

    fetchHealthRecords();
  }, []);

  const handleShare = async () => {
    const success = await shareHealthRecord(healthRecord);
    if (success) {
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <span>Dashboard</span>
          <span>›</span>
          <span>Health Records</span>
          <span>›</span>
          <span>Health Records Overview</span>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading health records...</p>
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
        <span>Health Records</span>
        <span>›</span>
        <span>Health Records Overview</span>
      </div>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">Health Records Overview</h1>
        <div className="flex gap-3">
          <button 
            onClick={() => downloadHealthRecord(healthRecord)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <button 
            onClick={() => printHealthRecord(healthRecord)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 relative"
          >
            {shareSuccess ? (
              <>
                <Check className="w-4 h-4" />
                Shared!
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                Share
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="col-span-12 lg:col-span-7">
          <div className="bg-white rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold mb-6">Health Score</h2>
            <div className="flex items-center justify-between mb-8">
              <div className="relative w-48 h-48">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-blue-600">{healthScore}/100</span>
                </div>
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="#E5E7EB"
                    strokeWidth="16"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="#4CAF50"
                    strokeWidth="16"
                    fill="none"
                    strokeDasharray="552.92"
                    strokeDashoffset={552.92 * (1 - healthScore / 100)}
                  />
                </svg>
              </div>
              <div className="flex-1 ml-8">
                <div className="mb-6">
                  <h3 className="font-medium mb-2">What's Helping Your Score</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>Your medication adherence is excellent</li>
                    <li>Your blood pressure is in the healthy range</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">What Needs Attention</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>Your cholesterol increased by 10%—consider diet changes</li>
                    <li>Your sleep has been inconsistent—try a steady schedule</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Vitals</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <span className="text-gray-600">Blood Pressure: </span>
                    <span className="ml-2 font-medium">120/80 mmHg (Healthy Range)</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-gray-600">Heart Rate: </span>
                    <span className="ml-2 font-medium">72 BPM (Optimal Resting Rate)</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Medication Adherence</h3>
                <p className="text-sm text-gray-600">
                  Your medication adherence is strong, contributing positively to your overall health score. 
                  Staying consistent with your prescribed medications helps maintain stability and prevent complications.
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Lifestyle</h3>
                <p className="text-sm text-gray-600">
                  Your lifestyle choices are supporting your health, but small adjustments could further improve your well-being. 
                  Regular activity, balanced nutrition, and stress management all play a role in keeping your score high.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-6">Next Health Steps</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h3 className="font-medium">Time for Blood Pressure Check</h3>
                  <p className="text-sm text-gray-600">Your last reading was 3 months ago, time for a follow-up.</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Schedule
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h3 className="font-medium">Medication Reminder</h3>
                  <p className="text-sm text-gray-600">Your prescription for Lisinopril needs to be refilled next week.</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Refill
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h3 className="font-medium">Exercise Recommendation</h3>
                  <p className="text-sm text-gray-600">Based on your profile, a 30-minute daily walk would benefit your health.</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  View
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-6">Chronic Conditions & Diagnostics</h2>
            
            <div className="mb-6">
              <h3 className="text-gray-600 mb-4">Current Conditions</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Type 2 Diabetes</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Hypertension</span>
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">Borderline</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-gray-600 mb-4">Most Recent</h3>
              <div className="space-y-6">
                {vitalSigns.map((vital, index) => (
                  <div key={index}>
                    <h4 className="text-sm font-medium mb-2">{vital.name}</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold">{vital.value}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          vital.status === 'Normal' ? 'bg-green-100 text-green-800' :
                          vital.status === 'High' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {vital.status}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">{vital.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-6">Document Library</h2>
            <div className="flex space-x-6 mb-6 overflow-x-auto pb-2">
              <button className="text-sm font-medium text-blue-600 border-b-2 border-blue-600 whitespace-nowrap">All Files</button>
              <button className="text-sm font-medium text-gray-500 whitespace-nowrap">Lab Results</button>
              <button className="text-sm font-medium text-gray-500 whitespace-nowrap">Doctor's Notes</button>
              <button className="text-sm font-medium text-gray-500 whitespace-nowrap">Prescriptions</button>
            </div>

            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <ArrowDown className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{result.name}</p>
                      <p className="text-sm text-gray-500">
                        {result.date} • {result.size}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-full">
                      <Eye className="w-4 h-4 text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-full">
                      <Download className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <ArrowDown className="w-4 h-4" />
              Upload Document
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}