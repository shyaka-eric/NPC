import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '../components/LoginForm';

const ORG_NAME_KEY = 'orgName';
const ORG_LOGO_KEY = 'orgLogo';

const LoginPage: React.FC = () => {
  const [orgName, setOrgName] = useState(localStorage.getItem(ORG_NAME_KEY) || 'NPC Logistics');
  const [orgLogo, setOrgLogo] = useState(localStorage.getItem(ORG_LOGO_KEY));

  useEffect(() => {
    const handleStorage = () => {
      setOrgName(localStorage.getItem(ORG_NAME_KEY) || 'NPC Logistics');
      setOrgLogo(localStorage.getItem(ORG_LOGO_KEY));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <div className="min-h-screen text-slate-800 bg-white flex flex-col relative">
      {/* Navbar */}
      <nav className="w-full bg-gradient-to-r from-blue-600 to-blue-800 shadow-md py-3 px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          {orgLogo ? (
            <img src={orgLogo} alt="Logo" className="h-8 w-8 rounded object-contain bg-white" />
          ) : null}
          <span className="text-xl font-extrabold text-white tracking-wide drop-shadow">{orgName}</span>
        </div>
        <div className="hidden md:flex gap-8 text-white font-medium text-base">
          <Link to="/features" className="hover:underline">Features</Link>
          <Link to="/about" className="hover:underline">About</Link>
          <Link to="/contact" className="hover:underline">Contact</Link>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header (now handled by navbar) */}

        {/* Main */}
        <main className="flex-grow flex flex-col md:flex-row items-center justify-center">
          {/* Left Section */}
          <section className="hidden md:block md:w-1/2 py-16 px-12">
            <div className="max-w-xl">
              <h1 className="text-4xl md:text-5xl font-bold text-blue-600 leading-tight mb-6">
                Streamlining Logistics for a Smarter Tomorrow
              </h1>
              <p className="text-lg text-slate-700 leading-relaxed mb-8">
                NPC Logistics is your trusted platform to manage, track, and optimize inventory and supply chains within national operations.
              </p>
              <div className="grid grid-cols-2 gap-6">
                {[
                  {
                    title: 'Real-time Tracking',
                    description: 'Monitor your shipments and inventory in real-time',
                    color: 'from-blue-500 to-blue-600',
                    iconBg: 'bg-blue-500'
                  },
                  {
                    title: 'Smart Analytics',
                    description: 'Make data-driven decisions with advanced insights',
                    color: 'from-green-500 to-green-600',
                    iconBg: 'bg-green-500'
                  },
                  {
                    title: 'Secure Platform',
                    description: 'Enterprise-grade security for your operations',
                    color: 'from-amber-500 to-amber-600',
                    iconBg: 'bg-amber-500'
                  },
                  {
                    title: '24/7 Support',
                    description: 'Round-the-clock assistance for your needs',
                    color: 'from-emerald-500 to-emerald-600',
                    iconBg: 'bg-emerald-500'
                  }
                ].map((feature, i) => (
                  <div key={i} className="bg-white shadow rounded-xl p-4 border border-slate-200 hover:border-blue-400 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${feature.iconBg}`}>
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-slate-800">{feature.title}</h3>
                    </div>
                    <p className="text-sm text-slate-600">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Right Section - Login */}
          <section className="w-full md:w-1/2 flex items-center justify-center">
            <div className="w-full max-w-md">
              <LoginForm />
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="text-center p-6 bg-gradient-to-r from-blue-700 to-blue-900 text-white font-semibold shadow-inner mt-8">
          <div>© 2025 {orgName}. All rights reserved.</div>
        </footer>
      </div>
    </div>
  );
};

export default LoginPage;
