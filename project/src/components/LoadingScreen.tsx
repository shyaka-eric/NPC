import React from 'react';
import { Package } from 'lucide-react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50">
      <Package className="h-16 w-16 text-blue-800 animate-pulse mb-4" />
      <h1 className="text-2xl font-bold text-slate-900 mb-2">NPC Logistics</h1>
      <div className="mt-4 flex items-center space-x-2">
        <div className="w-2 h-2 rounded-full bg-blue-800 animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 rounded-full bg-blue-800 animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 rounded-full bg-blue-800 animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
};

export default LoadingScreen;