import React, { useState } from 'react';
import { api } from '../api';
import { Button } from 'sonner';

const TestConnection: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testBackend = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/test/');
      setTestResult(JSON.stringify(response.data, null, 2));
    } catch (error) {
      setTestResult(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testPost = async () => {
    setIsLoading(true);
    try {
      const response = await api.post('/test/', {
        test: 'Hello from frontend',
        timestamp: new Date().toISOString()
      });
      setTestResult(JSON.stringify(response.data, null, 2));
    } catch (error) {
      setTestResult(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Test Backend Connection</h2>
      
      <div className="space-y-4">
        <Button onClick={testBackend} disabled={isLoading}>
          Test GET Request
        </Button>
        
        <Button onClick={testPost} disabled={isLoading}>
          Test POST Request
        </Button>
      </div>

      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <pre>{testResult}</pre>
      </div>
    </div>
  );
};

export default TestConnection;
