import { useEffect, useState } from 'react';
import axios from 'axios';
import MindMap from '@/components/mindmap';

function App() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');

  useEffect(() => {
    // Check if backend is available on component mount
    const checkBackendStatus = async () => {
      try {
        // For production, use the full path if needed
        const isProd = import.meta.env.PROD;
        const endpoint = isProd 
          ? (import.meta.env.VITE_BACKEND_URL || 'https://api.themindmap.ai') + '/api'
          : '/api'; // In development, this gets proxied by Vite

        console.log('Checking backend status at:', endpoint);
        const response = await axios.get(endpoint, { timeout: 3000 });
        console.log('Backend health check response:', response.data);
        setBackendStatus('available');
      } catch (error) {
        console.warn('Backend appears to be unavailable:', error);
        setBackendStatus('unavailable');
      }
    };

    checkBackendStatus();
  }, []);

  return (
    <div className="app h-screen">
      {backendStatus === 'checking' && (
        <div className="fixed top-0 left-0 w-full bg-blue-600 text-white text-center py-1 z-50">
          Checking connection to backend...
        </div>
      )}
      
      {backendStatus === 'unavailable' && (
        <div className="fixed top-0 left-0 w-full bg-amber-500 text-white text-center py-1 z-50">
          Backend connection unavailable - using mock data
        </div>
      )}
      
      {backendStatus === 'available' && (
        <div className="fixed top-0 left-0 w-full bg-green-600 text-white text-center py-1 z-50">
          Connected to backend
        </div>
      )}
      
      <MindMap />
    </div>
  );
}

export default App;