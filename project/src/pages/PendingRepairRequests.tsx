import React from 'react';

const PendingRepairRequests: React.FC = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen flex flex-col items-center justify-center">
    <div className="bg-white rounded shadow p-8 w-full max-w-2xl text-center">
      <h1 className="text-2xl font-bold text-blue-700 mb-4">Pending Repair Requests</h1>
      <p className="text-slate-600">No pending repair requests to display.</p>
    </div>
  </div>
);

export default PendingRepairRequests;
