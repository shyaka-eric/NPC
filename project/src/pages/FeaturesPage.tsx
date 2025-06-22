import React from 'react';

const features = [
  {
    title: 'Real-time Tracking',
    description: 'Monitor your shipments and inventory in real-time with live updates and notifications.',
    icon: (
      <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
    ),
  },
  {
    title: 'Smart Analytics',
    description: 'Make data-driven decisions with advanced analytics and reporting tools.',
    icon: (
      <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6" /></svg>
    ),
  },
  {
    title: 'Secure Platform',
    description: 'Enterprise-grade security for your operations and sensitive data.',
    icon: (
      <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0-1.104.896-2 2-2s2 .896 2 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
    ),
  },
  {
    title: '24/7 Support',
    description: 'Round-the-clock assistance for your logistics needs.',
    icon: (
      <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 8a6 6 0 11-12 0 6 6 0 0112 0z" /></svg>
    ),
  },
];

const FeaturesPage: React.FC = () => (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-16">
    <div className="max-w-3xl w-full bg-white rounded-xl shadow-lg p-8 border border-slate-200">
      <h1 className="text-3xl font-bold text-blue-700 mb-8">Platform Features</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {features.map((feature, i) => (
          <div key={i} className="flex items-start gap-4 bg-slate-50 rounded-lg p-5 border border-slate-100 shadow-sm">
            <div>{feature.icon}</div>
            <div>
              <h3 className="font-semibold text-lg text-slate-800 mb-1">{feature.title}</h3>
              <p className="text-slate-600 text-sm">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default FeaturesPage;
