import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import SystemAdminReportPage from './SystemAdminReportPage';

// Placeholder: Replace with your actual user context/store
const currentUser = { role: 'system-admin' }; // Example: get from auth context or store

const roleSections = [
  { label: 'Unit Leader', key: 'unit-leader', component: <div className="p-8">Unit Leader report coming soon.</div> },
  { label: 'Logistic Officer', key: 'logistic-officer', component: <div className="p-8">Logistic Officer report coming soon.</div> },
  { label: 'System Admin', key: 'system-admin', component: <div className="p-8">System Admin report coming soon.</div> },
];

const Reports: React.FC = () => {
  // If not system admin, show only their own section
  if (currentUser.role !== 'system-admin') {
    const section = roleSections.find(r => r.key === currentUser.role);
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen flex flex-col">
        <PageHeader
          title="Reports"
          description={`View and generate reports for your role: ${section?.label}`}
        />
        <div className="bg-white rounded shadow mt-8">
          {section?.component}
        </div>
      </div>
    );
  }

  // System admin: show all tabs
  const [activeRole, setActiveRole] = useState('admin');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen flex flex-col">
      <PageHeader
        title="Reports"
        description="View and generate reports for each user role."
      />
      <div className="flex gap-4 mb-8 flex-wrap">
        {roleSections.map(role => (
          <button
            key={role.key}
            className={`px-4 py-2 rounded font-medium border ${activeRole === role.key ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border-blue-600'}`}
            onClick={() => setActiveRole(role.key)}
          >
            {role.label}
          </button>
        ))}
      </div>
      <div className="bg-white rounded shadow">
        {roleSections.find(r => r.key === activeRole)?.component}
      </div>
    </div>
  );
};

export default Reports;