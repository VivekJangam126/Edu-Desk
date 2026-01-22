import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const ApiTest = () => {
  const [results, setResults] = useState({
    health: null,
    colleges: null,
    errors: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testApiEndpoints();
  }, []);

  const testApiEndpoints = async () => {
    const errors = [];
    const newResults = { health: null, colleges: null, errors: [] };

    console.log('🧪 Testing API endpoints...');
    console.log('🔗 API Base URL:', API_BASE_URL);

    // Test health endpoint
    try {
      console.log('Testing health endpoint...');
      const healthResponse = await axios.get('/api/health');
      newResults.health = healthResponse.data;
      console.log('✅ Health check passed:', healthResponse.data);
    } catch (error) {
      console.error('❌ Health check failed:', error);
      errors.push(`Health check failed: ${error.message}`);
    }

    // Test colleges endpoint
    try {
      console.log('Testing colleges endpoint...');
      const collegesResponse = await axios.get('/api/academics/colleges');
      newResults.colleges = collegesResponse.data;
      console.log('✅ Colleges endpoint passed:', collegesResponse.data?.length, 'colleges found');
    } catch (error) {
      console.error('❌ Colleges endpoint failed:', error);
      errors.push(`Colleges endpoint failed: ${error.message}`);
    }

    newResults.errors = errors;
    setResults(newResults);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p>Testing API endpoints...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">API Connection Test</h1>
      
      <div className="space-y-6">
        {/* Configuration Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">Configuration</h2>
          <p><strong>API Base URL:</strong> {API_BASE_URL}</p>
          <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
          <p><strong>REACT_APP_API_URL:</strong> {process.env.REACT_APP_API_URL || 'Not set'}</p>
        </div>

        {/* Health Check */}
        <div className={`border rounded-lg p-4 ${results.health ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <h2 className="text-lg font-semibold mb-2">
            {results.health ? '✅' : '❌'} Health Check
          </h2>
          {results.health ? (
            <pre className="bg-white p-2 rounded text-sm overflow-auto">
              {JSON.stringify(results.health, null, 2)}
            </pre>
          ) : (
            <p className="text-red-700">Health check failed</p>
          )}
        </div>

        {/* Colleges Endpoint */}
        <div className={`border rounded-lg p-4 ${results.colleges ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <h2 className="text-lg font-semibold mb-2">
            {results.colleges ? '✅' : '❌'} Colleges Endpoint
          </h2>
          {results.colleges ? (
            <div>
              <p className="mb-2">Found {results.colleges.length} colleges</p>
              <pre className="bg-white p-2 rounded text-sm overflow-auto max-h-40">
                {JSON.stringify(results.colleges.slice(0, 3), null, 2)}
                {results.colleges.length > 3 && '\n... and more'}
              </pre>
            </div>
          ) : (
            <p className="text-red-700">Colleges endpoint failed</p>
          )}
        </div>

        {/* Errors */}
        {results.errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Errors</h2>
            <ul className="list-disc list-inside space-y-1">
              {results.errors.map((error, index) => (
                <li key={index} className="text-red-700">{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Success Message */}
        {results.health && results.colleges && results.errors.length === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-green-900 mb-2">🎉 All Tests Passed!</h2>
            <p className="text-green-700">Your API connection is working correctly. You can now use the app normally.</p>
          </div>
        )}

        {/* Retry Button */}
        <div className="text-center">
          <button
            onClick={() => {
              setLoading(true);
              testApiEndpoints();
            }}
            className="btn btn-primary"
          >
            Retry Tests
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiTest;